import { eq, sql } from 'drizzle-orm'
import { useDB, schema } from '../../../db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Workflow ID is required' })

  const db = useDB()

  const [workflow] = await db.select()
    .from(schema.workflows)
    .where(eq(schema.workflows.id, id))
    .limit(1)

  if (!workflow) {
    throw createError({ statusCode: 404, message: 'Workflow not found' })
  }

  // Create a new thread for this workflow run
  const [thread] = await db.insert(schema.threads)
    .values({ title: `Workflow: ${workflow.name}` })
    .returning()

  // Update run stats
  await db.update(schema.workflows)
    .set({
      runCount: sql`${schema.workflows.runCount} + 1`,
      lastRunAt: new Date()
    })
    .where(eq(schema.workflows.id, id))

  return {
    threadId: thread!.id,
    prompt: workflow.prompt,
    workflowName: workflow.name
  }
})
