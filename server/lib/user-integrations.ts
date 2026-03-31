import { eq } from 'drizzle-orm'
import { useDB, schema } from '../db'
import { buildUserAdapters, type IntegrationAdapter, type UserIntegrationRecord } from './integrations'

export async function getUserAdapters(userId: string): Promise<IntegrationAdapter[]> {
  const db = useDB()
  const rows = await db.select()
    .from(schema.userIntegrations)
    .where(eq(schema.userIntegrations.userId, userId))

  console.info(`[UserIntegrations] userId=${userId}, total rows=${rows.length}, rows:`, rows.map(r => ({ integration: r.integration, isActive: r.isActive, type: typeof r.isActive })))

  // Support both integer (1) and boolean (true) since Postgres may return either
  const activeRows = rows.filter(r => r.isActive == 1)

  console.info(`[UserIntegrations] active integrations: ${activeRows.map(r => r.integration).join(', ')}`)

  const records: UserIntegrationRecord[] = activeRows.map(r => ({
    integration: r.integration,
    credentials: r.credentials as Record<string, string>
  }))

  return buildUserAdapters(records)
}
