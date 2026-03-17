import { eq } from 'drizzle-orm'
import { useDB, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Workflow ID is required' })

  const db = useDB()
  const deleted = await db.delete(schema.workflows)
    .where(eq(schema.workflows.id, id))
    .returning({ id: schema.workflows.id })

  if (!deleted.length) {
    throw createError({ statusCode: 404, message: 'Workflow not found' })
  }

  return { success: true }
})
