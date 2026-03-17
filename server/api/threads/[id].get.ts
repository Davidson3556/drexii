import { eq } from 'drizzle-orm'
import { useDB, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Thread ID is required' })
  }

  try {
    const db = useDB()
    const [thread] = await db.select()
      .from(schema.threads)
      .where(eq(schema.threads.id, id))
      .limit(1)

    if (!thread) {
      throw createError({ statusCode: 404, message: 'Thread not found' })
    }

    const messages = await db.select()
      .from(schema.messages)
      .where(eq(schema.messages.threadId, id))
      .orderBy(schema.messages.createdAt)

    return { thread, messages }
  } catch (error: unknown) {
    if ((error as { statusCode?: number }).statusCode) throw error
    console.error('[API] Get thread error:', error)
    throw createError({ statusCode: 500, message: 'Failed to get thread' })
  }
})
