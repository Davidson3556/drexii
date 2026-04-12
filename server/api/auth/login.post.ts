import { useInsforge } from '../../lib/insforge-client'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string, password?: string }>(event)

  if (!body?.email?.trim() || !body?.password) {
    throw createError({ statusCode: 400, message: 'email and password are required' })
  }

  try {
    const insforge = useInsforge()
    const { data, error } = await insforge.auth.signInWithPassword({
      email: body.email.trim(),
      password: body.password
    })

    if (error || !data) {
      throw createError({ statusCode: 401, message: 'Invalid credentials' })
    }

    return { ok: true, provider: 'insforge' }
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode
    if (statusCode) throw err
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }
})
