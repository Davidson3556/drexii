import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle> | null = null

export function useDB() {
  if (!_db) {
    const databaseUrl = process.env.DATABASE_URL || useRuntimeConfig().databaseUrl
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set. Please add it to your .env file.')
    }
    const client = postgres(databaseUrl)
    _db = drizzle(client, { schema })
  }
  return _db
}

export { schema }
