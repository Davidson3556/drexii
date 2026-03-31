// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'nuxt-security'
  ],

  devtools: {
    enabled: process.env.NODE_ENV === 'development'
  },

  css: ['~/assets/css/main.css'],

  colorMode: { preference: 'dark', fallback: 'dark', classSuffix: '' },

  runtimeConfig: {
    // Legacy — kept for backward compatibility with env-based integrations
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    googleAiApiKey: process.env.GOOGLE_AI_API_KEY || '',
    databaseUrl: process.env.DATABASE_URL || '',
    notionApiKey: process.env.NOTION_API_KEY || '',
    slackBotToken: process.env.SLACK_BOT_TOKEN || '',
    discordBotToken: process.env.DISCORD_BOT_TOKEN || '',
    zendeskSubdomain: process.env.ZENDESK_SUBDOMAIN || '',
    zendeskEmail: process.env.ZENDESK_EMAIL || '',
    zendeskApiToken: process.env.ZENDESK_API_TOKEN || '',
    public: {
      appName: 'Drexii',
      appDescription: 'AI agent that turns conversation into execution',
      insforgeUrl: process.env.NUXT_PUBLIC_INSFORGE_URL || 'https://ce3wqa6u.us-east.insforge.app',
      insforgeAnonKey: process.env.NUXT_PUBLIC_INSFORGE_ANON_KEY || ''
    }
  },

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  security: {
    headers: {
      contentSecurityPolicy: {
        'default-src': ['\'self\''],
        'script-src': ['\'self\'', '\'nonce-{{nonce}}\''],
        'style-src': ['\'self\'', '\'unsafe-inline\''],
        'img-src': ['\'self\'', 'https:', 'data:'],
        'font-src': ['\'self\'', 'https://fonts.gstatic.com'],
        'connect-src': [
          '\'self\'',
          'https://ce3wqa6u.us-east.insforge.app',
          'wss://ce3wqa6u.us-east.insforge.app',
          'https://gmail.googleapis.com',
          'https://oauth2.googleapis.com'
        ],
        'object-src': ['\'none\''],
        'frame-ancestors': ['\'none\'']
      },
      xFrameOptions: 'DENY',
      xContentTypeOptions: 'nosniff',
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: []
      }
    },
    // Blocks API abuse and runaway AI credit usage
    rateLimiter: {
      tokensPerInterval: 60,
      interval: 'minute',
      headers: true,
      driver: { name: 'lruCache' }
    },
    // Blocks oversized request attacks
    requestSizeLimiter: {
      maxRequestSizeInBytes: 2_000_000,
      maxUploadFileRequestInBytes: 8_000_000
    }
  }
})
