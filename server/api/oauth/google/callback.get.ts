import { eq, and } from 'drizzle-orm'
import { useDB, schema } from '../../../db'

interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string
  const state = query.state as string
  const oauthError = query.error as string

  if (oauthError) {
    return sendRedirect(event, '/integrations?error=oauth_denied')
  }

  if (!code || !state) {
    return sendRedirect(event, '/integrations?error=oauth_invalid')
  }

  // Decode + validate state
  let userId: string
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf-8'))
    userId = decoded.userId
    if (!userId) throw new Error('missing userId')
    if (Date.now() - decoded.ts > 15 * 60 * 1000) {
      return sendRedirect(event, '/integrations?error=oauth_expired')
    }
  } catch {
    return sendRedirect(event, '/integrations?error=oauth_invalid')
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const origin = getRequestURL(event).origin
  const redirectUri = `${origin}/api/oauth/google/callback`

  // Exchange authorization code for tokens
  let tokens: GoogleTokenResponse
  try {
    tokens = await $fetch<GoogleTokenResponse>('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }
    })
  } catch (err) {
    console.error('[oauth/google] token exchange failed:', err)
    return sendRedirect(event, '/integrations?error=oauth_token_failed')
  }

  if (!tokens.refresh_token) {
    // This happens when the user already granted access before and revoke wasn't forced.
    // We used prompt=consent so this shouldn't normally occur.
    return sendRedirect(event, '/integrations?error=no_refresh_token')
  }

  // One refresh_token covers all three Google services — save credentials for each
  const credentials = {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: tokens.refresh_token
  }

  const db = useDB()
  const googleIntegrations = ['gmail', 'google_calendar', 'google_drive'] as const

  for (const integration of googleIntegrations) {
    const [existing] = await db
      .select()
      .from(schema.userIntegrations)
      .where(
        and(
          eq(schema.userIntegrations.userId, userId),
          eq(schema.userIntegrations.integration, integration)
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
        integration,
        credentials
      })
    }
  }

  return sendRedirect(event, '/integrations?connected=google')
})
