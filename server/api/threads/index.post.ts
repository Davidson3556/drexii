import { useDB, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ title?: string }>(event)
  // userId is optional — threads can be created anonymously (schema defaults to 'anonymous')
  const userId = getHeader(event, 'x-user-id') || undefined

  try {
    const db = useDB()
    const [thread] = await db.insert(schema.threads)
      .values({ title: body?.title || 'New Thread', ...(userId ? { userId } : {}) })
      .returning()

    return { thread }
  } catch (error: unknown) {
    console.error('[API] Create thread error:', error)
    throw createError({ statusCode: 500, message: `Failed to create thread: ${(error as Error).message}` })
  }
})
