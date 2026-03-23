import { eq, and } from 'drizzle-orm'
import { useDB, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const userId = getHeader(event, 'x-user-id')
  if (!userId) {
    throw createError({ statusCode: 401, message: 'User ID is required' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Integration ID is required' })
  }

  const db = useDB()

  const [row] = await db.select()
    .from(schema.userIntegrations)
    .where(and(
      eq(schema.userIntegrations.id, id),
      eq(schema.userIntegrations.userId, userId)
    ))
    .limit(1)

  if (!row) {
    throw createError({ statusCode: 404, message: 'Integration not found' })
  }

  await db.delete(schema.userIntegrations)
    .where(eq(schema.userIntegrations.id, id))

  return { deleted: true, integration: row.integration }
})
