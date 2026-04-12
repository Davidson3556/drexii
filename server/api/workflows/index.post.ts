import { useDB, schema } from '../../db'

interface WorkflowStep {
  title?: string
  description?: string
  instruction?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    name: string
    description?: string
    prompt?: string
    steps?: WorkflowStep[]
  }>(event)

  if (!body?.name?.trim()) {
    throw createError({ statusCode: 400, message: 'name is required' })
  }

  // Accept either a prompt string or a steps array — convert steps to a prompt if needed
  let prompt = body.prompt?.trim() || ''
  if (!prompt && Array.isArray(body.steps) && body.steps.length > 0) {
    prompt = body.steps
      .map((step, i) => {
        const title = step.title || step.description || `Step ${i + 1}`
        const detail = step.instruction || step.description || ''
        return detail ? `${i + 1}. ${title}: ${detail}` : `${i + 1}. ${title}`
      })
      .join('\n')
  }

  if (!prompt) {
    throw createError({ statusCode: 400, message: 'name and prompt (or steps) are required' })
  }

  const db = useDB()
  const [workflow] = await db.insert(schema.workflows)
    .values({
      name: body.name.trim(),
      description: body.description?.trim() || null,
      prompt
    })
    .returning()

  return { workflow }
})
