import { Hono } from 'hono';
import { apiRouter } from './routes/api';
import { eventRouter } from './routes/event';

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
	return c.redirect('https://github.com/xydv/upi-gateway/');
});

app.get('/apps', async (c) => {
	return c.json([
		{
			name: 'google pay',
			packageName: 'com.google.android.apps.nbu.paisa.user',
			note: {
				optional: false,
				source: 'text',
				regex: String.raw`^(.*)$`,
			},
			amount: {
				optional: false,
				source: 'title',
				regex: String.raw`₹(\d+\.\d{2})`,
			},
		},
	]);
});

app.route('/api', apiRouter);
app.route('/event', eventRouter);

export default app;
