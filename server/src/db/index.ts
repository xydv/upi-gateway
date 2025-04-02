import * as schema from './schema';
import { drizzle } from 'drizzle-orm/d1';

export const database = (DB: D1Database) => {
	return drizzle(DB, { logger: false, schema });
};
