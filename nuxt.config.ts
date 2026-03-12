// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true }
  },

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

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
