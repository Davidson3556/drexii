import type { InsForgeClient } from '@insforge/sdk'

declare module '#app' {
  interface NuxtApp {
    $insforge: InsForgeClient
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $insforge: InsForgeClient
  }
}

export {}
