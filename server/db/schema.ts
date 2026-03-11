import { pgTable, uuid, text, timestamp, jsonb, integer, varchar } from 'drizzle-orm/pg-core'

export const threads = pgTable('threads', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull().default('New Thread'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true })
})

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  threadId: uuid('thread_id').notNull().references(() => threads.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(),
  content: text('content').notNull(),
  modelUsed: varchar('model_used', { length: 20 }),
  toolCalls: jsonb('tool_calls'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const sources = pgTable('sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  tool: varchar('tool', { length: 50 }).notNull(),
  recordId: text('record_id').notNull(),
  title: text('title').notNull(),
  url: text('url'),
  excerpt: text('excerpt'),
  score: integer('score').default(0)
})

export const actions = pgTable('actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  tool: varchar('tool', { length: 50 }).notNull(),
  actionType: varchar('action_type', { length: 50 }).notNull(),
  params: jsonb('params'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  executedAt: timestamp('executed_at', { withTimezone: true })
})

export const modelEvents = pgTable('model_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventType: varchar('event_type', { length: 30 }).notNull(),
  provider: varchar('provider', { length: 20 }).notNull(),
  reason: text('reason'),
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const preferences = pgTable('preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 100 }).notNull(),
  value: text('value'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})
