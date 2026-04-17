import { eq, and } from 'drizzle-orm'
import { useDB, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Workflow ID is required' })

  const userId = getHeader(event, 'x-user-id')
  if (!userId) throw createError({ statusCode: 401, message: 'User ID required' })

  const db = useDB()
  const deleted = await db.delete(schema.workflows)
    .where(and(eq(schema.workflows.id, id), eq(schema.workflows.userId, userId)))
    .returning({ id: schema.workflows.id })

  if (!deleted.length) {
    throw createError({ statusCode: 404, message: 'Workflow not found' })
  }

  return { success: true }
})
