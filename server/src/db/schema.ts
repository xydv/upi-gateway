import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core';
import { nanoid, customAlphabet } from 'nanoid';

const nanoidCustom = customAlphabet('abcdefghijklmnopqrstuvwxyz1234567890', 10);

export const merchants = sqliteTable('merchants', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	vpa: text('vpa').notNull(),
	currency: text('currency').notNull().default('INR'),
	key: text('key')
		.notNull()
		.$defaultFn(() => nanoid(25)),
});

export const requests = sqliteTable('requests', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	amount: text('amount'),
	note: text('note').notNull().$defaultFn(nanoidCustom),
	status: integer('status').notNull().default(0), // 0 -> pending, 1 -> success, 2 (maybe future) -> expired
	merchant: text('merchant')
		.notNull()
		.references(() => merchants.id),
});

export const merchantRelations = relations(merchants, ({ many }) => ({
	requests: many(requests),
}));

export const requestRelations = relations(requests, ({ one }) => ({
	merchant: one(merchants, {
		fields: [requests.merchant],
		references: [merchants.id],
	}),
}));
