import { SSEStreamingApi } from 'hono/streaming';

export async function sendEvent(stream: SSEStreamingApi, data: string, event: string = 'update', enableLogs: boolean = false) {
	const randomId = crypto.randomUUID();

	if (enableLogs) {
		console.log({ id: randomId, data, event });
	}

	return await stream.writeSSE({
		data,
		event,
		id: randomId,
	});
}
