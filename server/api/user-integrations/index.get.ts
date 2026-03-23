import { eq } from 'drizzle-orm'
import { useDB, schema } from '../../db'

export default defineEventHandler(async (event) => {
  const userId = getHeader(event, 'x-user-id')
  if (!userId) {
    throw createError({ statusCode: 401, message: 'User ID is required' })
  }

  const db = useDB()
  const rows = await db.select()
    .from(schema.userIntegrations)
    .where(eq(schema.userIntegrations.userId, userId))

  // Return without exposing raw credentials — mask them
  return rows.map((row) => {
    const creds = row.credentials as Record<string, string>
    const masked: Record<string, string> = {}
    for (const [key, val] of Object.entries(creds)) {
      if (typeof val === 'string' && val.length > 8) {
        masked[key] = val.slice(0, 4) + '••••' + val.slice(-4)
      } else {
        masked[key] = '••••'
      }
    }

    return {
      id: row.id,
      integration: row.integration,
      credentials: masked,
      isActive: row.isActive === 1,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }
  })
})
