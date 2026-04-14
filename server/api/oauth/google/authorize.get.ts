export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const userId = query.userId as string

  if (!userId) {
    throw createError({ statusCode: 400, message: 'userId is required' })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return sendRedirect(event, '/integrations?error=oauth_not_configured&provider=google')
  }

  // Encode userId + timestamp in state to survive the redirect round-trip
  const state = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString('base64url')

  const origin = getRequestURL(event).origin
  const redirectUri = `${origin}/api/oauth/google/callback`

  const scopes = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/drive'
  ]

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent', // always return a refresh_token
    state
  })

  return sendRedirect(event, `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
})
