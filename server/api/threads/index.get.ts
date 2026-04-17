import { eq, and, isNull, desc } from 'drizzle-orm'
import { useDB, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const userId = getHeader(event, 'x-user-id')
  if (!userId) {
    throw createError({ statusCode: 401, message: 'User ID required' })
  }

  try {
    const db = useDB()
    const threads = await db.select()
      .from(schema.threads)
      .where(and(eq(schema.threads.userId, userId), isNull(schema.threads.archivedAt)))
      .orderBy(desc(schema.threads.createdAt))
      .limit(50)

    return { threads }
  } catch (error: unknown) {
    console.error('[API] List threads error:', error)
    throw createError({ statusCode: 500, message: `Failed to list threads: ${(error as Error).message}` })
  }
})
