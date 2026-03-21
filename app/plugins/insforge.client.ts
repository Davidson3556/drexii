import { createClient } from '@insforge/sdk'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const insforge = createClient({
    baseUrl: config.public.insforgeUrl as string,
    anonKey: config.public.insforgeAnonKey as string
  })

  return {
    provide: {
      insforge
    }
  }
})
