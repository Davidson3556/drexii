import { getRecentMemories, searchMemories } from '../lib/memory'

export default defineEventHandler(async (event) => {
  const userId = getHeader(event, 'x-user-id')
  const query = getQuery(event)
  const search = query.q as string | undefined
  const limit = Math.min(Number(query.limit) || 20, 100)

  const results = search
    ? await searchMemories(search, limit, userId || undefined)
    : await getRecentMemories(limit, userId || undefined)

  return {
    memories: results,
    count: results.length
  }
})
