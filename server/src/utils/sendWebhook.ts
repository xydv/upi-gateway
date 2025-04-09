import { WEBHOOK_DATA } from './types';

export async function sendWebhook(webhookUrl: string, data: WEBHOOK_DATA) {
	await fetch(webhookUrl, {
		method: 'POST',
		body: JSON.stringify(data),
		headers: {
			'content-type': 'application/json',
			// todo: add signature headers to validate webhook
		},
	});
}
