import { eq, and } from 'drizzle-orm'
import { useDB, schema } from '../../db'
import { processAutomation } from '../../lib/agent-runner'
import { fetchNewMessages } from '../../lib/integrations/gmail'

/**
 * Gmail Push Notification Webhook
 *
 * Gmail sends a Pub/Sub notification when new emails arrive.
 * This endpoint receives it, fetches new emails, and triggers
 * any matching automations.
 *
 * For cron-based polling, call POST /api/webhooks/gmail with
 * { poll: true, userId: "..." } to manually trigger a check.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{
    // Gmail Pub/Sub push notification
    message?: { data: string, messageId: string }
    subscription?: string
    // Manual poll trigger
    poll?: boolean
    userId?: string
  }>(event)

  const db = useDB()

  // ── Handle manual poll request ───────────────────────────────────
  if (body?.poll && body.userId) {
    await processEmailAutomations(db, body.userId)
    return { ok: true, mode: 'poll' }
  }

  // ── Handle Gmail Pub/Sub push notification ───────────────────────
  if (body?.message?.data) {
    try {
      const decoded = Buffer.from(body.message.data, 'base64').toString('utf-8')
      const _notification = JSON.parse(decoded) as { emailAddress: string, historyId: number }

      // Find user by email in their Gmail integration credentials
      const allIntegrations = await db.select()
        .from(schema.userIntegrations)
        .where(eq(schema.userIntegrations.integration, 'gmail'))

      // Find the user whose Gmail account matches this notification
      for (const integration of allIntegrations) {
        const _creds = integration.credentials as Record<string, string>
        // Process automations for this user
        await processEmailAutomations(db, integration.userId)
      }

      return { ok: true, mode: 'push' }
    } catch (error: unknown) {
      console.error('[Webhook/Gmail] Error processing push notification:', (error as Error).message)
      // Return 200 to avoid Gmail retrying
      return { ok: false, error: (error as Error).message }
    }
  }

  return { ok: true, mode: 'noop' }
})

async function processEmailAutomations(
  db: ReturnType<typeof useDB>,
  userId: string
): Promise<void> {
  // Find active email automations for this user
  const automations = await db.select()
    .from(schema.automations)
    .where(and(
      eq(schema.automations.userId, userId),
      eq(schema.automations.trigger, 'email_received'),
      eq(schema.automations.isActive, true)
    ))

  if (automations.length === 0) return

  // Get user's Gmail credentials
  const [gmailIntegration] = await db.select()
    .from(schema.userIntegrations)
    .where(and(
      eq(schema.userIntegrations.userId, userId),
      eq(schema.userIntegrations.integration, 'gmail')
    ))
    .limit(1)

  if (!gmailIntegration) return

  const creds = gmailIntegration.credentials as Record<string, string>
  if (!creds.client_id || !creds.client_secret || !creds.refresh_token) return

  // Fetch new emails since last check (default: last 5 minutes)
  const lastCheck = automations.reduce((latest, a) => {
    const t = a.lastRunAt ? new Date(a.lastRunAt).getTime() : 0
    return t > latest ? t : latest
  }, Date.now() - 5 * 60 * 1000)

  try {
    const newEmails = await fetchNewMessages(
      { client_id: creds.client_id, client_secret: creds.client_secret, refresh_token: creds.refresh_token },
      lastCheck
    )

    if (newEmails.length === 0) return

    // Build context from new emails
    const emailSummary = newEmails.map(e =>
      `- From: ${e.from}\n  Subject: ${e.subject}\n  Preview: ${e.snippet}`
    ).join('\n\n')

    const triggerContext = `New emails received (${newEmails.length}):\n\n${emailSummary}`

    // Run each matching automation
    for (const automation of automations) {
      await processAutomation(automation.id, triggerContext, {
        emailCount: newEmails.length,
        emails: newEmails.map(e => ({ id: e.id, from: e.from, subject: e.subject }))
      })
    }
  } catch (error: unknown) {
    console.error('[Webhook/Gmail] Error fetching new emails:', (error as Error).message)
  }
}
