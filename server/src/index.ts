import { zValidator } from '@hono/zod-validator';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { SSEStreamingApi, streamSSE } from 'hono/streaming';
import { z } from 'zod';
import { database } from './db';
import { merchants, requests } from './db/schema';

const app = new Hono<{ Bindings: Env }>();

/**
	server status
*/
app.get('/', async (c) => {
	return c.text('server is up');
});

/**
	create a new api-key (for a new client), todo: currency
	(input) 	name, vpa
	(output) 	key: api key for specific vpa
*/
app.post(
	'/api/create/key',
	zValidator(
		'json',
		z.object({
			name: z.string().min(1),
			vpa: z.string().includes('@').min(3), // x@x
		}),
	),
	async (c) => {
		const db = database(c.env.DB);
		const { name, vpa } = c.req.valid('json');

		const [{ key }] = await db.insert(merchants).values({ name, vpa }).returning({ key: merchants.key });
		return c.json({ key });
	},
);

/**
	create a new payment request
		(input) 	amount: optional
		(output) 	id: request id, qr: qrcode for the request
*/
app.post(
	'/api/create/request',
	zValidator(
		'json',
		z.object({
			amount: z.string().optional(),
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

		const qrString = new URLSearchParams(qrObject).toString();

		return c.json({ id, qr: 'upi://pay?' + qrString });
	},
);

/**
	server sent event to get request data
*/
app.get('/sse/:id', zValidator('param', z.object({ id: z.string() })), async (c) => {
	const db = database(c.env.DB);
	const { id } = c.req.valid('param');

	return streamSSE(c, async (stream) => {
		while (true) {
			const response = await db.query.requests.findFirst({ where: eq(requests.id, id), columns: { status: true } });

			if (!response) {
				await sendEvent(stream, JSON.stringify({ request: id, status: -1, message: 'request not found' }), 'update');
				return await stream.close();
			}

			if (response.status === 1) {
				await sendEvent(stream, JSON.stringify({ request: id, status: 1, message: 'payment success' }), 'success');
				await sendEvent(stream, JSON.stringify({ request: id, status: 1, message: 'payment success' }), 'update');
				return await stream.close();
			}

			await sendEvent(stream, JSON.stringify({ request: id, status: 0, message: 'payment pending' }), 'update');
			await stream.sleep(5000);
		}
	});
});

/**
	webhook to update status (called from application only & authenticate using apikey)
*/
app.post('/wh', zValidator('json', z.object({ note: z.string() })), zValidator('header', z.object({ key: z.string() })), async (c) => {
	const db = database(c.env.DB);
	const { key } = c.req.valid('header');
	const { note } = c.req.valid('json');

	const merchant = await db.query.merchants.findFirst({ where: eq(merchants.key, key), columns: { id: true } });
	if (!merchant) return c.text('invalid api key', 400);

	const merchantRequestValid = and(eq(requests.note, note), eq(requests.merchant, merchant.id));

	const request = await db.query.requests.findFirst({
		where: merchantRequestValid,
		columns: { id: true, status: true },
	});

	if (!request) return c.text('request not found', 400);
	// if (request.status == 1) return c.text('already verified', 400);
	await db.update(requests).set({ status: 1 }).where(merchantRequestValid);

	return c.text('success');
});

async function sendEvent(stream: SSEStreamingApi, data: string, event: string) {
	return await stream.writeSSE({
		data,
		event,
		id: crypto.randomUUID(), // todo: log this or use this for debug
	});
}

export default app;
