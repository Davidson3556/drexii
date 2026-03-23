<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'theme-color', content: '#0a0a0a' },
    { name: 'author', content: 'Drexii' },
    { name: 'keywords', content: 'AI agent, Notion integration, Slack integration, Discord bot, AI chat, workflow automation, cross-tool AI, audit trail, persistent memory' },
    { name: 'robots', content: 'index, follow' }
  ],
  link: [
    { rel: 'icon', type: 'image/png', href: '/logo.png' },
    { rel: 'apple-touch-icon', href: '/logo.png' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' }
  ],
  htmlAttrs: {
    lang: 'en',
    class: 'dark'
  }
})

const title = 'Drexii — AI Agent That Turns Conversation Into Execution'
const description = 'One chat to search, write, and act across your stack. Drexii connects to Notion, Slack, and Discord — ask a question, get sourced answers, and trigger real actions without switching tabs.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: '/logo.png',
  ogType: 'website',
  ogSiteName: 'Drexii',
  twitterCard: 'summary',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: '/logo.png'
})
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-[var(--color-drexii-bg)]">
      <AppNav />
      <NuxtPage />
    </div>
  </UApp>
</template>
