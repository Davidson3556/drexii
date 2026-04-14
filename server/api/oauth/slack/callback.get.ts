import { eq, and } from 'drizzle-orm'
import { useDB, schema } from '../../../db'

interface SlackTokenResponse {
  ok: boolean
  access_token?: string
  team?: { id: string, name: string }
  error?: string
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string
  const state = query.state as string
  const oauthError = query.error as string

  if (oauthError) {
    return sendRedirect(event, '/oauth-callback?error=oauth_denied')
  }

  if (!code || !state) {
    return sendRedirect(event, '/oauth-callback?error=oauth_invalid')
  }

  // Decode + validate state
  let userId: string
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf-8'))
    userId = decoded.userId
    if (!userId) throw new Error('missing userId')
    if (Date.now() - decoded.ts > 15 * 60 * 1000) {
      return sendRedirect(event, '/oauth-callback?error=oauth_expired')
    }
  } catch {
    return sendRedirect(event, '/oauth-callback?error=oauth_invalid')
  }

  const clientId = process.env.SLACK_CLIENT_ID!
  const clientSecret = process.env.SLACK_CLIENT_SECRET!
  const origin = getRequestURL(event).origin
  const redirectUri = `${origin}/api/oauth/slack/callback`

  // Exchange code for bot token (Slack uses form-encoded POST)
  let tokenData: SlackTokenResponse
  try {
    tokenData = await $fetch<SlackTokenResponse>('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri
      }).toString()
    })
  } catch (err) {
    console.error('[oauth/slack] token exchange failed:', err)
    return sendRedirect(event, '/oauth-callback?error=oauth_token_failed')
  }

  if (!tokenData.ok || !tokenData.access_token) {
    console.error('[oauth/slack] token exchange error:', tokenData.error)
    return sendRedirect(event, '/oauth-callback?error=oauth_token_failed')
  }

  const credentials = { bot_token: tokenData.access_token }
  const db = useDB()

  const [existing] = await db
    .select()
    .from(schema.userIntegrations)
    .where(
      and(
        eq(schema.userIntegrations.userId, userId),
        eq(schema.userIntegrations.integration, 'slack')
      )
    )
    .limit(1)

  if (existing) {
    await db
      .update(schema.userIntegrations)
      .set({ credentials, isActive: 1, updatedAt: new Date() })
      .where(eq(schema.userIntegrations.id, existing.id))
  } else {
    await db.insert(schema.userIntegrations).values({
      userId,
      integration: 'slack',
      credentials
    })
  }

  return sendRedirect(event, '/oauth-callback?connected=slack')
})
