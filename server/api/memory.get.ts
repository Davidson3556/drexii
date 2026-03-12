import { getRecentMemories, searchMemories } from '../lib/memory'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = query.q as string | undefined
  const limit = Math.min(Number(query.limit) || 20, 100)

  const results = search
    ? await searchMemories(search, limit)
    : await getRecentMemories(limit)

  return {
    memories: results,
    count: results.length
  }
})
