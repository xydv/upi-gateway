import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

export const createKeyValidator = zValidator(
	'json',
	z.object({
		name: z.string().min(1),
		vpa: z.string().includes('@').min(3),
		webhook: z.string().url().optional(),
	}),
);

export const setWebhookValidator = zValidator(
	'json',
	z.object({
		webhook: z.string().url(),
	}),
);

export const createRequestValidator = zValidator(
	'json',
	z.object({
		amount: z
			.string()
			.regex(/^\d+(\.\d{2})$/)
			.optional(),
	}),
);

export const getRequestValidator = zValidator(
	'query',
	z.object({
		id: z.string(),
	}),
);

export const sendUpdateValidator = zValidator(
	'json',
	z.object({
		note: z.string(),
		amount: z
			.string()
			.regex(/^\d+(\.\d{2})$/)
			.optional(),
	}),
);

export const keyValidator = zValidator(
	'header',
	z.object({
		key: z.string(),
	}),
);
