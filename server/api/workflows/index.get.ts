import { eq, desc } from 'drizzle-orm'
import { useDB, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const userId = getHeader(event, 'x-user-id')
  if (!userId) {
    throw createError({ statusCode: 401, message: 'User ID required' })
  }

  const db = useDB()
  const workflows = await db.select()
    .from(schema.workflows)
    .where(eq(schema.workflows.userId, userId))
    .orderBy(desc(schema.workflows.createdAt))

  return { workflows }
})
