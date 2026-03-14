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

  runtimeConfig: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    googleAiApiKey: process.env.GOOGLE_AI_API_KEY || '',
    databaseUrl: process.env.DATABASE_URL || '',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    notionApiKey: process.env.NOTION_API_KEY || '',
    slackBotToken: process.env.SLACK_BOT_TOKEN || '',
    discordBotToken: process.env.DISCORD_BOT_TOKEN || '',
    zendeskSubdomain: process.env.ZENDESK_SUBDOMAIN || '',
    zendeskEmail: process.env.ZENDESK_EMAIL || '',
    zendeskApiToken: process.env.ZENDESK_API_TOKEN || '',
    salesforceLoginUrl: process.env.SALESFORCE_LOGIN_URL || '',
    salesforceClientId: process.env.SALESFORCE_CLIENT_ID || '',
    salesforceClientSecret: process.env.SALESFORCE_CLIENT_SECRET || '',
    public: {
      appName: 'Drexii',
      appDescription: 'AI agent that turns conversation into execution'
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
          'https://api.anthropic.com',
          'https://generativelanguage.googleapis.com'
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
