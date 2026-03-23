import { eq } from 'drizzle-orm'
import { useDB, schema } from '../db'
import { buildUserAdapters, type IntegrationAdapter, type UserIntegrationRecord } from './integrations'

export async function getUserAdapters(userId: string): Promise<IntegrationAdapter[]> {
  const db = useDB()
  const rows = await db.select()
    .from(schema.userIntegrations)
    .where(eq(schema.userIntegrations.userId, userId))

  const activeRows = rows.filter(r => r.isActive === 1)

  const records: UserIntegrationRecord[] = activeRows.map(r => ({
    integration: r.integration,
    credentials: r.credentials as Record<string, string>
  }))

  return buildUserAdapters(records)
}
