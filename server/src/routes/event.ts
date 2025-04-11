import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import { database } from '../db';
import { requests } from '../db/schema';
import { sendEvent } from '../utils/sendEvent';

const router = new Hono<{ Bindings: Env }>();

router.get('/:id', zValidator('param', z.object({ id: z.string() })), async (c) => {
	const db = database(c.env.DB);
	const { id } = c.req.valid('param');

	return streamSSE(c, async (stream) => {
		let pending = false;
		await sendEvent(stream, JSON.stringify([-2]));

		while (true) {
			const response = await db.query.requests.findFirst({ where: eq(requests.id, id), columns: { status: true } });

			if (!response) {
				await sendEvent(stream, JSON.stringify([-1]));
				return await stream.close();
			}

			if ([1, 2, 3].includes(response.status)) {
				await sendEvent(stream, JSON.stringify([response.status]));
				return await stream.close();
			}

			if (!pending) {
				await sendEvent(stream, JSON.stringify([response.status]));
			}

			pending = true;
			await stream.sleep(5000);
		}
	});
});

export { router as eventRouter };
