import { eq, and } from 'drizzle-orm'
import { useDB, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Automation ID required' })
  }

  const db = useDB()
  const userId = getHeader(event, 'x-user-id')

  await db.delete(schema.automations)
    .where(
      userId
        ? and(eq(schema.automations.id, id), eq(schema.automations.userId, userId))
        : eq(schema.automations.id, id)
    )

  return { ok: true }
})
