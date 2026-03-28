import { pgTable, uuid, text, timestamp, jsonb, integer, varchar, boolean } from 'drizzle-orm/pg-core'

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

export const auditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  integration: varchar('integration', { length: 50 }).notNull(),
  toolName: varchar('tool_name', { length: 100 }).notNull(),
  args: jsonb('args'),
  result: jsonb('result'),
  status: varchar('status', { length: 20 }).notNull().default('success'),
  executedAt: timestamp('executed_at', { withTimezone: true }).defaultNow().notNull()
})

export const memories = pgTable('memories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }),
  category: varchar('category', { length: 30 }).notNull().default('fact'),
  content: text('content').notNull(),
  source: uuid('source'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const userIntegrations = pgTable('user_integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  integration: varchar('integration', { length: 50 }).notNull(),
  credentials: jsonb('credentials').notNull(),
  isActive: integer('is_active').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const workflows = pgTable('workflows', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  prompt: text('prompt').notNull(),
  runCount: integer('run_count').notNull().default(0),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const automations = pgTable('automations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  trigger: varchar('trigger', { length: 50 }).notNull(), // email_received | schedule | webhook | chain
  triggerConfig: jsonb('trigger_config').notNull().default({}), // e.g. { schedule: "0 8 * * 1" } or { filter: "is:unread" }
  instructions: text('instructions').notNull(), // Plain English instructions for the AI agent
  isActive: boolean('is_active').notNull().default(true),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  runCount: integer('run_count').notNull().default(0),
  // Chaining support
  parentAutomationId: uuid('parent_automation_id'), // references automations.id
  chainOn: varchar('chain_on', { length: 20 }).default('success'), // 'success' | 'failure' | 'always'
  triggerCondition: text('trigger_condition'), // plain English condition e.g. "output contains urgent"
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const automationLogs = pgTable('automation_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  automationId: uuid('automation_id').notNull().references(() => automations.id, { onDelete: 'cascade' }),
  trigger: varchar('trigger', { length: 50 }).notNull(),
  input: jsonb('input'), // What triggered it (e.g. email subject, sender)
  output: text('output'), // AI response / actions taken
  status: varchar('status', { length: 20 }).notNull().default('success'), // success | error | skipped
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})
