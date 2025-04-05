import { Hono } from 'hono';
import { apiRouter } from './routes/api';
import { eventRouter } from './routes/event';

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
	return c.json([
		{
			'/api': [
				{
					'/createKey': {
						type: 'POST',
						body: { type: 'application/json', schema: { name: '<merchant name>', vpa: '<merchant vpa>' } },
						header: {},
					},
				},
				{
					'/createRequest': {
						type: 'POST',
						body: { type: 'application/json', schema: { amount: '<request amount (optional)>' } },
						header: { key: '<client key>' },
					},
				},
				{
					'/allRequests': {
						type: 'GET',
						params: {},
						header: { key: '<client key>' },
					},
				},
				{
					'/sendUpdate': {
						type: 'POST',
						body: { type: 'application/json', schema: { note: '<response note>', amount: '<response amount>' } },
						header: { key: '<client key>' },
					},
				},
			],
			'/event': [
				{
					'/:requestId': {
						type: 'GET',
						params: { requestId: '<request id>' },
						// header: { key: '<client key>' },
					},
				},
			],
		},
	]);
});

app.route('/api', apiRouter);
app.route('/event', eventRouter);

export default app;
