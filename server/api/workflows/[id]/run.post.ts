import { eq, sql } from 'drizzle-orm'
import { useDB, schema } from '../../../db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Workflow ID is required' })

  // x-user-id is optional — look up workflow by id only, use its stored userId
  const db = useDB()

  const [workflow] = await db.select()
    .from(schema.workflows)
    .where(eq(schema.workflows.id, id))
    .limit(1)

  if (!workflow) {
    throw createError({ statusCode: 404, message: 'Workflow not found' })
  }

  // Create a new thread for this workflow run (scoped to the workflow's owner)
  const [thread] = await db.insert(schema.threads)
    .values({ title: `Workflow: ${workflow.name}`, userId: workflow.userId })
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
    workflowName: workflow.name,
    result: `Workflow "${workflow.name}" started in thread ${thread!.id}. Send a message to the thread to execute: ${workflow.prompt.slice(0, 200)}`
  }
})
