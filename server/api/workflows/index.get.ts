import { desc } from 'drizzle-orm'
import { useDB, schema } from '../../db'

export default defineEventHandler(async () => {
  const db = useDB()
  const workflows = await db.select()
    .from(schema.workflows)
    .orderBy(desc(schema.workflows.createdAt))

  return { workflows }
})
