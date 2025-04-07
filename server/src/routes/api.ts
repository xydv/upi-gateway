import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { database } from '../db';
import { merchants, requests } from '../db/schema';
import { and, eq, sql } from 'drizzle-orm';

const router = new Hono<{ Bindings: Env }>();

router.post(
	'/createKey',
	zValidator(
		'json',
		z.object({
			name: z.string().min(1),
			vpa: z.string().includes('@').min(3),
		}),
	),
	async (c) => {
		const db = database(c.env.DB);
		const { name, vpa } = c.req.valid('json');

		const [{ key }] = await db.insert(merchants).values({ name, vpa }).returning({ key: merchants.key });
		return c.json({ key });
	},
);

router.post(
	'/createRequest',
	zValidator(
		'json',
		z.object({
			amount: z
				.string()
				.regex(/^\d+(\.\d{2})$/)
				.optional(),
		}),
	),
	zValidator(
		'header',
		z.object({
			key: z.string(),
		}),
	),
	async (c) => {
		const db = database(c.env.DB);
		const { key } = c.req.valid('header');
		const { amount } = c.req.valid('json');

		const merchant = await db.query.merchants.findFirst({ where: eq(merchants.key, key), columns: { key: false } });
		if (!merchant) return c.text('invalid api key', 400);

		const [{ id, note }] = await db
			.insert(requests)
			.values({ merchant: merchant.id, amount })
			.returning({ id: requests.id, note: requests.note });

		const qrObject = {
			pa: merchant.vpa,
			pn: merchant.name,
			tn: note,
			am: amount || '',
			cu: merchant.currency,
		};

		const qr = 'upi://pay?' + new URLSearchParams(qrObject).toString();

		return c.json({ id, qr });
	},
);

router.get(
	'/allRequests',
	zValidator(
		'header',
		z.object({
			key: z.string(),
		}),
	),
	async (c) => {
		const db = database(c.env.DB);
		const { key } = c.req.valid('header');

		const merchant = await db.query.merchants.findFirst({ where: eq(merchants.key, key), columns: { key: false } });
		if (!merchant) return c.text('invalid api key', 400);

		const allRequests = await db.query.requests.findMany({
			where: eq(requests.merchant, merchant.id),
			columns: { merchant: false, note: false },
		});

		return c.json(allRequests);
	},
);

router.post(
	'/sendUpdate',
	zValidator(
		'json',
		z.object({
			note: z.string(),
			amount: z
				.string()
				.regex(/^\d+(\.\d{2})$/)
				.optional(),
		}),
	),
	zValidator('header', z.object({ key: z.string() })),
	async (c) => {
		const db = database(c.env.DB);
		const { key } = c.req.valid('header');
		const { note, amount } = c.req.valid('json');

		const merchant = await db.query.merchants.findFirst({ where: eq(merchants.key, key), columns: { id: true } });
		if (!merchant) return c.text('invalid api key', 400);

		const merchantRequestValid = and(eq(requests.note, note), eq(requests.amount, amount || sql`NULL`), eq(requests.merchant, merchant.id));

		const request = await db.query.requests.findFirst({
			where: merchantRequestValid,
			columns: { id: true, status: true },
		});
		if (!request) return c.text('request not found', 400);

		await db.update(requests).set({ status: 1 }).where(merchantRequestValid);

		return c.json([1]);
	},
);

export { router as apiRouter };
