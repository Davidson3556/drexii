import { getAuditEntries } from '../lib/audit'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 50, 100)

  const entries = await getAuditEntries(limit)

  return {
    entries,
    count: entries.length
  }
})
