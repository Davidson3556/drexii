import { eq, and } from 'drizzle-orm'
import { useDB, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const userId = getHeader(event, 'x-user-id')
  if (!userId) {
    throw createError({ statusCode: 401, message: 'User ID required' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Automation ID required' })
  }

  const db = useDB()

  await db.delete(schema.automations)
    .where(and(
      eq(schema.automations.id, id),
      eq(schema.automations.userId, userId)
    ))

  return { ok: true }
})
