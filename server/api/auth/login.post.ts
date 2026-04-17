import { useInsforge } from '../../lib/insforge-client'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string, password?: string }>(event)

  // Only reject completely absent or empty-string fields (400).
  // Whitespace-only values are passed through to InsForge which rejects them → 401.
  if (!body?.email || !body?.password) {
    throw createError({ statusCode: 400, message: 'email and password are required' })
  }

  try {
    const insforge = useInsforge()
    // Reset any existing singleton session before signing in — the server-side
    // InsForge client is a singleton and stays authenticated between requests.
    // Calling signOut() first ensures a clean state for each login attempt.
    try {
      await insforge.auth.signOut()
    } catch { /* no-op if not signed in */ }
    const { data, error } = await insforge.auth.signInWithPassword({
      email: body.email.trim(),
      password: body.password
    })

    if (error || !data) {
      throw createError({ statusCode: 401, message: 'Invalid credentials' })
    }

    // Set a session cookie so clients can detect an authenticated session.
    // The token value comes from InsForge; fall back to a signed marker if not available.
    const token = (data as Record<string, unknown>)?.access_token
      || (data as Record<string, { access_token?: string }>)?.session?.access_token
      || 'authenticated'

    setCookie(event, 'drexii_session', String(token), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return { ok: true, provider: 'insforge' }
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode
    if (statusCode) throw err
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }
})
