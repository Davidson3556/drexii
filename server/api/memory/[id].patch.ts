import { updateMemory } from '../../lib/memory'

export default defineEventHandler(async (event) => {
  const userId = getHeader(event, 'x-user-id')
  if (!userId) throw createError({ statusCode: 401, message: 'User ID required' })

  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  if (!body.content || typeof body.content !== 'string') {
    throw createError({ statusCode: 400, message: 'content is required' })
  }

  const updated = await updateMemory(id, body.content.trim(), userId)
  if (!updated) throw createError({ statusCode: 404, message: 'Memory not found' })

  return { ok: true }
})
