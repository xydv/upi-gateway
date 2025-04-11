import { and, eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import qrImage from 'qr-image';
import { database } from '../db';
import { merchants, requests } from '../db/schema';
import { sendWebhook } from '../utils/sendWebhook';
import { MESSAGE, WEBHOOK_TYPE } from '../utils/types';
import {
	createKeyValidator,
	createRequestValidator,
	getRequestValidator,
	keyValidator,
	sendUpdateValidator,
	setWebhookValidator,
} from '../utils/validators';

const router = new Hono<{ Bindings: Env }>();

router.post('/createKey', createKeyValidator, async (c) => {
	const db = database(c.env.DB);
	const { name, vpa, webhook } = c.req.valid('json');

	const [{ key }] = await db.insert(merchants).values({ name, vpa, webhook }).returning({ key: merchants.key });
	return c.json({ key });
});

router.post('/setWebhook', setWebhookValidator, keyValidator, async (c) => {
	const db = database(c.env.DB);
	const { webhook } = c.req.valid('json');
	const { key } = c.req.valid('header');

	const merchant = await db.query.merchants.findFirst({ where: eq(merchants.key, key), columns: { id: true } });
	if (!merchant) return c.text(MESSAGE.INVALID_KEY, 400);

	await db.update(merchants).set({ webhook }).where(eq(merchants.id, merchant.id));
	return c.text(MESSAGE.WEBHOOK_SET);
});

router.post('/deleteWebhook', keyValidator, async (c) => {
	const db = database(c.env.DB);
	const { key } = c.req.valid('header');

	const merchant = await db.query.merchants.findFirst({ where: eq(merchants.key, key), columns: { id: true } });
	if (!merchant) return c.text(MESSAGE.INVALID_KEY, 400);

	await db.update(merchants).set({ webhook: null }).where(eq(merchants.id, merchant.id));
	return c.text(MESSAGE.WEBHOOK_DELETED);
});

router.post('/createRequest', createRequestValidator, keyValidator, async (c) => {
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
});

router.get('/getRequest', getRequestValidator, keyValidator, async (c) => {
	const db = database(c.env.DB);
	const { key } = c.req.valid('header');
	const { id } = c.req.valid('query');

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
});

router.get('/allRequests', keyValidator, async (c) => {
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
});

router.post('/sendUpdate', sendUpdateValidator, keyValidator, async (c) => {
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
});

router.onError((err, c) => {
	return c.text(MESSAGE.SERVER_ERROR, 500);
});

export { router as apiRouter };
