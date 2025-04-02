import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/db/schema.ts',
	out: './src/db/migrations',
	dialect: 'sqlite',
	dbCredentials: {
		url: '/home/aditya/code/upig/server/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/db8ca7ab8a4a4947326aa01233081bbf9ceae7d04b539113317646d72ad0b100.sqlite',
	},
});
