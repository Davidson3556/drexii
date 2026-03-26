import { createClient } from '@insforge/sdk'

let _client: ReturnType<typeof createClient> | null = null

export function useInsforge() {
  if (!_client) {
    const config = useRuntimeConfig()
    const baseUrl = config.public.insforgeUrl as string
    const anonKey = config.public.insforgeAnonKey as string

    if (!baseUrl || !anonKey) {
      throw new Error('InsForge URL or Anon Key is not configured')
    }

    _client = createClient({ baseUrl, anonKey })
  }
  return _client
}
