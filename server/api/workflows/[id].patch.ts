import { eq, and } from 'drizzle-orm'
import { useDB, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Workflow ID is required' })
  }

  const userId = getHeader(event, 'x-user-id')
  if (!userId) {
    throw createError({ statusCode: 401, message: 'User ID required' })
  }

  const body = await readBody<{
    name?: string
    description?: string | null
    prompt?: string
  }>(event)

  if (!body || Object.keys(body).length === 0) {
    throw createError({ statusCode: 400, message: 'No fields provided to update' })
  }

  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) {
    const name = body.name.trim()
    if (!name) throw createError({ statusCode: 400, message: 'Name cannot be empty' })
    updates.name = name
  }
  if (body.description !== undefined) {
    updates.description = body.description?.toString().trim() || null
  }
  if (body.prompt !== undefined) {
    const prompt = body.prompt.trim()
    if (!prompt) throw createError({ statusCode: 400, message: 'Prompt cannot be empty' })
    updates.prompt = prompt
  }

  const db = useDB()
  const [workflow] = await db.update(schema.workflows)
    .set(updates)
    .where(and(eq(schema.workflows.id, id), eq(schema.workflows.userId, userId)))
    .returning()

  if (!workflow) {
    throw createError({ statusCode: 404, message: 'Workflow not found' })
  }

  return { workflow }
})
