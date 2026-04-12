import { saveMemory } from '../lib/memory'

export default defineEventHandler(async (event) => {
  const userId = getHeader(event, 'x-user-id')
  const body = await readBody(event)

  if (!body.content || typeof body.content !== 'string') {
    throw createError({ statusCode: 400, message: 'content is required' })
  }

  const category = ['fact', 'preference', 'context'].includes(body.category)
    ? body.category
    : 'fact'

  const created = await saveMemory(category, body.content, body.source, userId || undefined)

  if (!created) {
    throw createError({ statusCode: 500, message: 'Failed to save memory' })
  }

  return { ok: true, id: created.id, category: created.category, content: created.content, createdAt: created.createdAt }
})
