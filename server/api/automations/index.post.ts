import { useDB, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const userId = getHeader(event, 'x-user-id') || 'anonymous'

  const body = await readBody<{
    name: string
    description?: string
    trigger: string
    triggerConfig?: Record<string, unknown>
    instructions: string
    parentAutomationId?: string
    chainOn?: string
    triggerCondition?: string
  }>(event)

  if (!body?.name?.trim() || !body?.trigger?.trim() || !body?.instructions?.trim()) {
    throw createError({ statusCode: 400, message: 'Name, trigger, and instructions are required' })
  }

  const validTriggers = ['email_received', 'schedule', 'webhook', 'chain']
  if (!validTriggers.includes(body.trigger)) {
    throw createError({ statusCode: 400, message: `Invalid trigger. Must be one of: ${validTriggers.join(', ')}` })
  }

  const db = useDB()

  const [automation] = await db.insert(schema.automations).values({
    userId,
    name: body.name.trim(),
    description: body.description?.trim() || null,
    trigger: body.trigger,
    triggerConfig: body.triggerConfig || {},
    instructions: body.instructions.trim(),
    parentAutomationId: body.parentAutomationId || null,
    chainOn: body.chainOn || 'success',
    triggerCondition: body.triggerCondition?.trim() || null
  }).returning()

  return { automation }
})
