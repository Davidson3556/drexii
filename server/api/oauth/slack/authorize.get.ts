export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const userId = query.userId as string

  if (!userId) {
    throw createError({ statusCode: 400, message: 'userId is required' })
  }

  const clientId = process.env.SLACK_CLIENT_ID
  if (!clientId) {
    throw createError({ statusCode: 500, message: 'Slack OAuth is not configured on this server' })
  }

  const state = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString('base64url')

  const origin = getRequestURL(event).origin
  const redirectUri = `${origin}/api/oauth/slack/callback`

  const scopes = ['channels:read', 'chat:write', 'search:read', 'channels:history', 'users:read']

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(','),
    state
  })

  return sendRedirect(event, `https://slack.com/oauth/v2/authorize?${params.toString()}`)
})
