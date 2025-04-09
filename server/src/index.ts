import { Hono } from 'hono';
import { apiRouter } from './routes/api';
import { eventRouter } from './routes/event';

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
	return c.redirect('https://github.com/xydv/upi-gateway/');
});

app.route('/api', apiRouter);
app.route('/event', eventRouter);

export default app;
