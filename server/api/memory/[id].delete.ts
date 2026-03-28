import { deleteMemory } from '../../lib/memory'

export default defineEventHandler(async (event) => {
  const userId = getHeader(event, 'x-user-id')
  if (!userId) throw createError({ statusCode: 401, message: 'User ID required' })

  const id = getRouterParam(event, 'id')!
  const deleted = await deleteMemory(id, userId)
  if (!deleted) throw createError({ statusCode: 404, message: 'Memory not found' })

  return { ok: true }
})
