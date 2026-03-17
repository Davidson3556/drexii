import { useDB, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name: string, description?: string, prompt: string }>(event)

  if (!body?.name?.trim() || !body?.prompt?.trim()) {
    throw createError({ statusCode: 400, message: 'name and prompt are required' })
  }

  const db = useDB()
  const [workflow] = await db.insert(schema.workflows)
    .values({
      name: body.name.trim(),
      description: body.description?.trim() || null,
      prompt: body.prompt.trim()
    })
    .returning()

  return { workflow }
})
