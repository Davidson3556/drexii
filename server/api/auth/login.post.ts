const SESSION_TOKEN = 'drexii_admin_v1'
const SESSION_COOKIE = 'drexii_session'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ username: string, password: string }>(event)

  if (body?.username !== 'admin' || body?.password !== 'admin') {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  setCookie(event, SESSION_COOKIE, SESSION_TOKEN, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  })

  return { success: true }
})
