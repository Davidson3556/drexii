import { eq, desc } from 'drizzle-orm'
import { useDB, schema } from '../../../db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Automation ID required' })
  }

  const db = useDB()

  const logs = await db.select()
    .from(schema.automationLogs)
    .where(eq(schema.automationLogs.automationId, id))
    .orderBy(desc(schema.automationLogs.createdAt))
    .limit(50)

  return { logs }
})
