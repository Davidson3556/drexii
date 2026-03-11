import { defineEventHandler, readBody, createError } from 'h3'
import { useDB, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ title?: string }>(event)

  try {
    const db = useDB()
    const [thread] = await db.insert(schema.threads)
      .values({ title: body?.title || 'New Thread' })
      .returning()

    return { thread }
  }
  catch (error: unknown) {
    console.error('[API] Create thread error:', error)
    throw createError({ statusCode: 500, message: 'Failed to create thread' })
  }
})
