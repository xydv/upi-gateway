import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { database } from '../db';
import { merchants, requests } from '../db/schema';
import { and, eq, sql } from 'drizzle-orm';
import qrImage from 'qr-image';
import { MESSAGE, WEBHOOK_TYPE } from '../utils/types';
import { sendWebhook } from '../utils/sendWebhook';

const router = new Hono<{ Bindings: Env }>();

router.post(
	'/createKey',
	zValidator(
		'json',
		z.object({
			name: z.string().min(1),
			vpa: z.string().includes('@').min(3),
			webhook: z.string().url().optional(),
		}),
	),
	async (c) => {
		const db = database(c.env.DB);
		const { name, vpa, webhook } = c.req.valid('json');

		const [{ key }] = await db.insert(merchants).values({ name, vpa, webhook }).returning({ key: merchants.key });
		return c.json({ key });
	},
);

router.post(
	'/setWebhook',
	zValidator(
		'json',
		z.object({
			webhook: z.string().url(),
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
		const { webhook } = c.req.valid('json');
		const { key } = c.req.valid('header');

		const merchant = await db.query.merchants.findFirst({ where: eq(merchants.key, key), columns: { id: true } });
		if (!merchant) return c.text(MESSAGE.INVALID_KEY, 400);

		await db.update(merchants).set({ webhook }).where(eq(merchants.id, merchant.id));

		return c.text(MESSAGE.WEBHOOK_SET);
	},
);

router.post(
	'/deleteWebhook',
	zValidator(
		'header',
		z.object({
			key: z.string(),
		}),
	),
	async (c) => {
		const db = database(c.env.DB);
		const { key } = c.req.valid('header');

		const merchant = await db.query.merchants.findFirst({ where: eq(merchants.key, key), columns: { id: true } });
		if (!merchant) return c.text(MESSAGE.INVALID_KEY, 400);

		await db.update(merchants).set({ webhook: null }).where(eq(merchants.id, merchant.id));

		return c.text(MESSAGE.WEBHOOK_DELETED);
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
		if (!merchant) return c.text(MESSAGE.INVALID_KEY, 400);

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

		const uri = 'upi://pay?' + new URLSearchParams(qrObject).toString();
		const qr = 'data:image/png;base64,' + qrImage.imageSync(uri, { type: 'png' }).toString('base64');

		return c.json({ id, uri, qr });
	},
);

router.get(
	'/getRequest/:id',
	zValidator(
		'param',
		z.object({
			id: z.string(),
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
		const { id } = c.req.valid('param');

		const merchant = await db.query.merchants.findFirst({
			where: eq(merchants.key, key),
			columns: { key: false },
		});

		if (!merchant) return c.text(MESSAGE.INVALID_KEY, 400);

		const request = await db.query.requests.findFirst({
			where: and(eq(requests.merchant, merchant.id), eq(requests.id, id)),
			columns: { merchant: false },
		});

		if (!request) return c.text(MESSAGE.REQUEST_NOT_FOUND, 400);

		const qrObject = {
			pa: merchant.vpa,
			pn: merchant.name,
			tn: request.note,
			am: request.amount || '',
			cu: merchant.currency,
		};

		const uri = 'upi://pay?' + new URLSearchParams(qrObject).toString();
		const qr = 'data:image/png;base64,' + qrImage.imageSync(uri, { type: 'png' }).toString('base64');

		return c.json(
			(({ note, ...others }) => {
				return { ...others, uri, qr };
			})(request),
		);
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

		const merchant = await db.query.merchants.findFirst({
			where: eq(merchants.key, key),
			columns: { key: false },
		});
		if (!merchant) return c.text(MESSAGE.INVALID_KEY, 400);

		const allRequests = await db.query.requests.findMany({
			where: eq(requests.merchant, merchant.id),
			columns: { merchant: false, note: false },
			orderBy: (requests, { desc }) => [desc(requests.timestamp)],
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

		const merchant = await db.query.merchants.findFirst({ where: eq(merchants.key, key), columns: { id: true, webhook: true } });
		if (!merchant) return c.text(MESSAGE.INVALID_KEY, 400);

		const merchantRequestValid = and(eq(requests.note, note), eq(requests.amount, amount || sql`NULL`), eq(requests.merchant, merchant.id));

		const request = await db.query.requests.findFirst({
			where: merchantRequestValid,
			columns: { id: true, status: true },
		});
		if (!request) return c.text(MESSAGE.REQUEST_NOT_FOUND, 400);

		await db.update(requests).set({ status: 1 }).where(merchantRequestValid);

		if (merchant.webhook) {
			await sendWebhook(merchant.webhook, {
				type: WEBHOOK_TYPE.SUCCESS,
				webhookId: crypto.randomUUID(),
				requestId: request.id,
				status: 1,
				timestamp: Date.now(),
			});
		}

		return c.text(MESSAGE.SUCCESS);
	},
);

export { router as apiRouter };
