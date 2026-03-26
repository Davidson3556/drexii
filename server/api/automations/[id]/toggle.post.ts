import { eq, and } from 'drizzle-orm'
import { useDB, schema } from '../../../db'

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

  const [automation] = await db.select()
    .from(schema.automations)
    .where(and(
      eq(schema.automations.id, id),
      eq(schema.automations.userId, userId)
    ))
    .limit(1)

  if (!automation) {
    throw createError({ statusCode: 404, message: 'Automation not found' })
  }

  const [updated] = await db.update(schema.automations)
    .set({
      isActive: !automation.isActive,
      updatedAt: new Date()
    })
    .where(eq(schema.automations.id, id))
    .returning()

  return { automation: updated }
})
