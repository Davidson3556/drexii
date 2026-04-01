<script setup lang="ts">
const router = useRouter()

const categories = ['Actions', 'Calendar', 'Email', 'Code']
const activeCategory = ref('Actions')

const suggestions = [
  { text: 'Create a Linear ticket for the login bug and assign it to me', icon: 'i-lucide-git-pull-request' },
  { text: 'What meetings do I have tomorrow and are there any conflicts?', icon: 'i-lucide-calendar' },
  { text: 'Summarize my unread emails and draft replies to the urgent ones', icon: 'i-lucide-mail' },
  { text: 'Find the Q4 roadmap in Drive and post a summary to #product on Slack', icon: 'i-lucide-send' }
]

const inputValue = ref('')
const heroRef = ref<HTMLElement>()
const chatCardRef = ref<HTMLElement>()
const introRefs = ref<HTMLElement[]>([])
const scrollY = ref(0)

function handleScroll() {
  scrollY.value = window.scrollY
  introRefs.value.forEach((el) => {
    if (!el) return
    const rect = el.getBoundingClientRect()
    const viewportMiddle = window.innerHeight * 0.6
    const startReveal = viewportMiddle + 150
    const endReveal = viewportMiddle - 50
    const scrollProgress = Math.max(0, Math.min(1, (startReveal - rect.top) / (startReveal - endReveal)))
    const opacity = 0.15 + (scrollProgress * 0.85)
    el.style.color = `rgba(255, 255, 255, ${opacity})`
    if (scrollProgress > 0.1) {
      el.style.textShadow = `0 0 ${scrollProgress * 15}px rgba(255, 255, 255, ${scrollProgress * 0.3})`
    } else {
      el.style.textShadow = 'none'
    }
  })
}

const chatCardStyle = computed(() => {
  const progress = Math.min(scrollY.value / 600, 1)
  const scale = 0.85 + (progress * 0.15)
  const translateY = 60 - (progress * 60)
  return {
    transform: `scale(${scale}) translateY(${translateY}px)`,
    opacity: Math.min(0.5 + progress * 0.5, 1)
  }
})

const heroParallax = computed(() => ({
  transform: `translateY(${scrollY.value * 0.3}px)`
}))

function setIntroRef(el: HTMLElement | null, index: number) {
  if (el) introRefs.value[index] = el
}
const introRef0 = (el: Element | null) => setIntroRef(el as HTMLElement | null, 0)
const introRef1 = (el: Element | null) => setIntroRef(el as HTMLElement | null, 1)
const introRef2 = (el: Element | null) => setIntroRef(el as HTMLElement | null, 2)

// ── Splash screen ─────────────────────────────────────────────
const showSplash = ref(true)
const splashFading = ref(false)

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('visible')
      })
    },
    { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
  )
  nextTick(() => {
    document.querySelectorAll('.fade-in-up, .scale-in, .text-reveal').forEach(el => observer.observe(el))
  })

  // Show splash for minimum 1.5s then fade out
  setTimeout(() => {
    splashFading.value = true
    setTimeout(() => {
      showSplash.value = false
    }, 600) // matches fade-out duration
  }, 1500)
})

onUnmounted(() => window.removeEventListener('scroll', handleScroll))

function handleSuggestion(text: string) {
  inputValue.value = text
  router.push('/chat')
}
</script>

<template>
  <div>
    <!-- ======== SPLASH SCREEN ======== -->
    <div
      v-if="showSplash"
      class="splash-overlay"
      :class="{ 'splash-fading': splashFading }"
    >
      <div class="splash-content">
        <!-- Logo with ring -->
        <div class="splash-logo-wrapper">
          <div class="splash-ring">
            <div class="splash-ring-track" />
          </div>
          <div class="splash-logo">
            <img
              src="/logo.png"
              alt="Drexii"
              class="w-full h-full object-cover"
            >
          </div>
        </div>
        <span class="splash-brand">
          Drexii
        </span>
        <div class="splash-dots">
          <span class="splash-dot" />
          <span class="splash-dot" />
          <span class="splash-dot" />
        </div>
      </div>
    </div>

    <!-- ======== HERO ======== -->
    <section
      ref="heroRef"
      class="hero-bg"
    >
      <div
        class="hero-overlay"
        :style="heroParallax"
      />

      <div class="relative z-10 flex flex-col items-center pt-24 md:pt-32 pb-24 md:pb-32 px-4 md:px-6 text-center min-h-[90vh] justify-start mt-[8vh]">
        <!-- Headline -->
        <h1 class="fade-in-up stagger-1 text-[32px] sm:text-[48px] md:text-[68px] font-medium tracking-tight leading-[1.05] max-w-5xl mb-6">
          <span class="hero-headline-muted">Your AI agent for</span>
          <br>
          <span class="hero-headline">every tool you work with</span>
        </h1>

        <!-- Subtitle -->
        <p class="fade-in-up stagger-2 hero-subtitle text-[14px] sm:text-base max-w-lg mb-8 leading-relaxed font-normal">
          Connect Gmail, Calendar, Drive, Notion, Slack, Jira, Linear, and more. Ask questions, take action, set automations — all from one chat.
        </p>

        <!-- CTAs -->
        <div class="fade-in-up stagger-3 flex flex-col sm:flex-row items-center gap-3 mb-12 md:mb-16 z-20">
          <NuxtLink
            to="/chat"
            class="hero-cta-primary px-6 py-2.5 rounded-full text-[14px] font-semibold transition-all shadow-lg"
          >
            Start Chatting Free
          </NuxtLink>
          <a
            href="#features"
            class="hero-cta-secondary px-6 py-2.5 rounded-full text-[14px] font-medium transition-all border"
          >
            See What It Does
          </a>
        </div>

        <!-- Integration logos marquee -->
        <div class="fade-in-up stagger-4 mb-12 w-full">
          <p class="text-[10px] text-white/20 uppercase tracking-[0.25em] text-center mb-5 font-semibold">
            Works perfectly with
          </p>
          <div class="marquee-container overflow-hidden relative w-full">
            <div class="marquee-fade-left" />
            <div class="marquee-fade-right" />
            <div class="marquee-track flex items-center gap-12">
              <template
                v-for="n in 2"
                :key="n"
              >
                <div class="marquee-item flex items-center gap-2.5 shrink-0">
                  <UIcon
                    name="i-simple-icons-gmail"
                    class="w-[18px] h-[18px] text-white/50"
                  />
                  <span class="text-[13px] text-white/50 font-medium tracking-wide">Gmail</span>
                </div>
                <div class="marquee-item flex items-center gap-2.5 shrink-0">
                  <UIcon
                    name="i-lucide-calendar"
                    class="w-[18px] h-[18px] text-white/50"
                  />
                  <span class="text-[13px] text-white/50 font-medium tracking-wide">Calendar</span>
                </div>
                <div class="marquee-item flex items-center gap-2.5 shrink-0">
                  <UIcon
                    name="i-lucide-hard-drive"
                    class="w-[18px] h-[18px] text-white/50"
                  />
                  <span class="text-[13px] text-white/50 font-medium tracking-wide">Drive</span>
                </div>
                <div class="marquee-item flex items-center gap-2.5 shrink-0">
                  <UIcon
                    name="i-simple-icons-slack"
                    class="w-[18px] h-[18px] text-white/50"
                  />
                  <span class="text-[13px] text-white/50 font-medium tracking-wide">Slack</span>
                </div>
                <div class="marquee-item flex items-center gap-2.5 shrink-0">
                  <UIcon
                    name="i-simple-icons-notion"
                    class="w-[18px] h-[18px] text-white/50"
                  />
                  <span class="text-[13px] text-white/50 font-medium tracking-wide">Notion</span>
                </div>
                <div class="marquee-item flex items-center gap-2.5 shrink-0">
                  <UIcon
                    name="i-simple-icons-jira"
                    class="w-[18px] h-[18px] text-white/50"
                  />
                  <span class="text-[13px] text-white/50 font-medium tracking-wide">Jira</span>
                </div>
                <div class="marquee-item flex items-center gap-2.5 shrink-0">
                  <UIcon
                    name="i-simple-icons-linear"
                    class="w-[18px] h-[18px] text-white/50"
                  />
                  <span class="text-[13px] text-white/50 font-medium tracking-wide">Linear</span>
                </div>
                <div class="marquee-item flex items-center gap-2.5 shrink-0">
                  <UIcon
                    name="i-simple-icons-discord"
                    class="w-[18px] h-[18px] text-white/50"
                  />
                  <span class="text-[13px] text-white/50 font-medium tracking-wide">Discord</span>
                </div>
                <div class="marquee-item flex items-center gap-2.5 shrink-0">
                  <UIcon
                    name="i-simple-icons-zendesk"
                    class="w-[18px] h-[18px] text-white/50"
                  />
                  <span class="text-[13px] text-white/50 font-medium tracking-wide">Zendesk</span>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Floating Chat Card -->
        <div class="w-full max-w-4xl mx-auto px-4 md:px-0 z-10 mt-2 md:mt-4 relative">
          <div
            ref="chatCardRef"
            class="scale-in app-window w-full rounded-[24px] md:rounded-[30px] p-5 sm:p-8 md:p-12 shadow-[0_32px_80px_rgba(0,0,0,0.7)] mx-auto transition-transform duration-100 will-change-transform"
            :style="chatCardStyle"
          >
            <!-- Card Header -->
            <div class="flex items-center justify-between mb-8 md:mb-12">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 md:w-9 md:h-9 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src="/logo.png"
                    class="w-full h-full object-cover"
                    alt="Drexii"
                  >
                </div>
                <span class="text-[13px] font-semibold text-white/70">Drexii</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                <span class="text-[11px] text-white/30">AI Online</span>
              </div>
            </div>

            <!-- Welcome -->
            <h2 class="text-[20px] md:text-[22px] font-medium text-center mb-1 md:mb-2 text-white/90">
              Good morning
            </h2>
            <p class="text-[12px] md:text-[13px] text-center mb-6 md:mb-10 font-medium text-white/35">
              What do you need today?
            </p>

            <!-- Input Box -->
            <div class="card-input-box rounded-2xl p-3 md:p-4 mb-4 shadow-inner">
              <input
                v-model="inputValue"
                type="text"
                placeholder="Ask anything across your tools..."
                class="w-full bg-transparent outline-none text-[14px] md:text-[15px] pt-1 pb-2 md:pb-4 text-white/80 placeholder:text-white/20"
                @keyup.enter="handleSuggestion(inputValue)"
              >
              <div class="flex items-center justify-between mt-2">
                <div class="flex items-center gap-3 md:gap-4 px-1">
                  <UIcon
                    name="i-lucide-paperclip"
                    class="w-4 h-4 text-white/25 cursor-pointer hover:text-white/50 transition-colors"
                  />
                  <UIcon
                    name="i-lucide-mic"
                    class="w-4 h-4 text-white/25 cursor-pointer hover:text-amber-400 transition-colors"
                  />
                  <UIcon
                    name="i-lucide-zap"
                    class="w-4 h-4 text-white/25 cursor-pointer hover:text-white/50 transition-colors"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <div
                    class="card-send-btn w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                    @click="handleSuggestion(inputValue)"
                  >
                    <UIcon
                      name="i-lucide-arrow-up"
                      class="w-4 h-4"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Categories -->
            <div class="flex items-center justify-between mb-4 md:mb-6 pb-4 md:pb-6 border-b border-white/6">
              <div class="flex items-center gap-2 overflow-x-auto no-scrollbar mask-edges pr-4">
                <button
                  v-for="cat in categories"
                  :key="cat"
                  :class="['card-category-pill px-3 md:px-4 py-1.5 rounded-full text-[12px] md:text-[13px] font-medium transition-colors border border-transparent whitespace-nowrap', cat === activeCategory ? 'card-category-pill--active' : '']"
                  @click="activeCategory = cat"
                >
                  {{ cat }}
                </button>
              </div>
              <UIcon
                name="i-lucide-search"
                class="w-4 h-4 text-white/25 cursor-pointer"
              />
            </div>

            <!-- Suggestions -->
            <div class="space-y-1 mt-6">
              <div
                v-for="(suggestion, i) in suggestions.slice(0, 2)"
                :key="i"
                class="card-suggestion flex items-center justify-between py-3 px-2 group cursor-pointer transition-colors border-b border-white/6 last:border-0"
                @click="handleSuggestion(suggestion.text)"
              >
                <div class="flex items-center gap-3">
                  <UIcon
                    :name="suggestion.icon"
                    class="w-4 h-4 text-white/25 shrink-0"
                  />
                  <span class="text-[14px] text-white/50 group-hover:text-white/75 transition-colors">{{ suggestion.text }}</span>
                </div>
                <div class="card-suggestion-arrow w-6 h-6 rounded-full border border-white/10 flex items-center justify-center shrink-0 ml-3">
                  <UIcon
                    name="i-lucide-arrow-right"
                    class="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </div>
            </div>

            <div class="h-8" />
          </div>
        </div>
      </div>
    </section>

    <!-- ======== INTRO ======== -->
    <section
      id="about"
      class="intro-section relative z-20"
    >
      <div class="max-w-4xl mx-auto px-6 text-center">
        <div class="fade-in-up flex items-center justify-center gap-2 mb-12">
          <span class="w-2 h-2 rounded-full bg-accent-glow" />
          <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">How It Works</span>
        </div>

        <p
          :ref="introRef0"
          class="intro-text intro-scrub mb-10 mx-auto text-[24px] md:text-[32px] font-light leading-snug transition-colors duration-100 ease-out"
        >
          Ask in plain English. Drexii searches your emails, checks your Calendar,
          reads Drive docs, and queries your project tools — then gives you a real answer with sources.
        </p>

        <p
          :ref="introRef1"
          class="intro-text intro-scrub stagger-2 mb-10 mx-auto text-[20px] md:text-[32px] font-light leading-snug transition-colors duration-100 ease-out"
        >
          Say the action. Drexii creates the Jira ticket, drafts the Gmail reply, updates the Linear issue,
          and posts to Slack — without you leaving the chat.
        </p>

        <p
          :ref="introRef2"
          class="intro-text intro-scrub stagger-3 mx-auto text-[20px] md:text-[32px] font-light leading-snug transition-colors duration-100 ease-out"
        >
          Set an automation and Drexii runs while you're offline — chaining actions across tools,
          handling emails as they arrive, keeping everything moving.
        </p>
      </div>
    </section>

    <!-- ======== FEATURES ======== -->
    <section
      id="features"
      class="py-32 px-6 relative z-20 bg-[var(--color-drexii-bg2)]"
    >
      <div class="max-w-[1100px] mx-auto">
        <div class="flex flex-col items-center mb-20 text-center">
          <div class="fade-in-up flex items-center justify-center gap-2 mb-6">
            <span class="w-2 h-2 rounded-full bg-accent-glow" />
            <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">Capabilities</span>
          </div>
          <h2 class="fade-in-up stagger-1 text-[28px] md:text-[40px] font-medium tracking-tight leading-tight max-w-2xl text-white/90">
            Built to handle the work<br><span class="text-white/30">you don't have time for</span>
          </h2>
        </div>

        <!-- Bento Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- 01 Multi-Model AI — 2 cols -->
          <div class="fade-in-up feature-card feature-card--amber lg:col-span-2 group">
            <span class="fc-num">01</span>
            <div class="fc-icon fc-icon--amber">
              <UIcon
                name="i-lucide-brain"
                class="w-6 h-6 text-amber-400"
              />
            </div>
            <h3 class="fc-title">
              Multi-Model AI Routing
            </h3>
            <p class="fc-desc">
              The right model for every task — Opus for deep analysis, Sonnet for writing, Haiku for quick replies, DeepSeek for code. Automatic fallback if any model goes down.
            </p>
            <div class="fc-badge">
              <span class="fc-badge-dot fc-badge-dot--amber" />
              Opus 4.6 · Sonnet · Haiku · DeepSeek · Gemini
            </div>
          </div>

          <!-- 02 Integrations -->
          <div class="fade-in-up stagger-1 feature-card feature-card--blue group">
            <span class="fc-num">02</span>
            <div class="fc-icon fc-icon--blue">
              <UIcon
                name="i-lucide-plug-zap"
                class="w-6 h-6 text-blue-400"
              />
            </div>
            <h3 class="fc-title">
              11 Integrations<br>50+ Tools
            </h3>
            <p class="fc-desc">
              Gmail, Calendar, Drive, Notion, Slack, Discord, Jira, Linear, Asana, Zendesk, Salesforce — all from one chat.
            </p>
          </div>

          <!-- 03 Chained Automations -->
          <div class="fade-in-up stagger-1 feature-card feature-card--purple group">
            <span class="fc-num">03</span>
            <div class="fc-icon fc-icon--purple">
              <UIcon
                name="i-lucide-link"
                class="w-6 h-6 text-purple-400"
              />
            </div>
            <h3 class="fc-title">
              Chained Automations
            </h3>
            <p class="fc-desc">
              Automations that trigger each other. Email arrives → summarise → create ticket → post to Slack. Set conditions in plain English.
            </p>
          </div>

          <!-- 04 Voice -->
          <div class="fade-in-up stagger-2 feature-card feature-card--rose group">
            <span class="fc-num">04</span>
            <div class="fc-icon fc-icon--rose">
              <UIcon
                name="i-lucide-mic"
                class="w-6 h-6 text-rose-400"
              />
            </div>
            <h3 class="fc-title">
              Voice In & Out
            </h3>
            <p class="fc-desc">
              Speak your requests. Drexii listens, acts, and reads responses aloud. Hands-free mode available for continuous back-and-forth.
            </p>
            <div class="fc-badge">
              <span class="fc-badge-dot fc-badge-dot--rose" />
              Web Speech API · Browser TTS · Zero cost
            </div>
          </div>

          <!-- 05 Action Confirmation -->
          <div class="fade-in-up stagger-2 feature-card feature-card--emerald group">
            <span class="fc-num">05</span>
            <div class="fc-icon fc-icon--emerald">
              <UIcon
                name="i-lucide-shield-check"
                class="w-6 h-6 text-emerald-400"
              />
            </div>
            <h3 class="fc-title">
              Confirm Before Acting
            </h3>
            <p class="fc-desc">
              Write operations — send email, create ticket, post message — are held for your approval. Nothing fires without your say-so.
            </p>
          </div>

          <!-- 06 Persistent Memory — full width -->
          <div class="fade-in-up stagger-3 feature-card feature-card--cyan lg:col-span-3 group">
            <span class="fc-num">06</span>
            <div class="flex flex-col md:flex-row md:items-center gap-8 md:gap-16">
              <div class="flex-1">
                <div class="fc-icon fc-icon--cyan mb-6">
                  <UIcon
                    name="i-lucide-brain-circuit"
                    class="w-6 h-6 text-cyan-400"
                  />
                </div>
                <h3 class="fc-title text-2xl md:text-3xl">
                  Persistent Memory
                </h3>
                <p class="fc-desc max-w-sm">
                  Drexii remembers your preferences, context, and facts across every conversation. View, edit, and delete what it knows about you — full transparency, full control.
                </p>
              </div>
              <div class="flex flex-col gap-2.5 md:w-72 shrink-0">
                <div class="memory-chip">
                  <UIcon
                    name="i-lucide-bookmark"
                    class="w-3.5 h-3.5 text-cyan-400 shrink-0"
                  />
                  "Always reply formally to enterprise clients"
                </div>
                <div class="memory-chip">
                  <UIcon
                    name="i-lucide-bookmark"
                    class="w-3.5 h-3.5 text-cyan-400 shrink-0"
                  />
                  "Linear team ID for backend is ENG"
                </div>
                <div class="memory-chip">
                  <UIcon
                    name="i-lucide-bookmark"
                    class="w-3.5 h-3.5 text-cyan-400 shrink-0"
                  />
                  "Post bugs to #engineering on Slack"
                </div>
                <div class="memory-chip memory-chip--faded">
                  <UIcon
                    name="i-lucide-bookmark"
                    class="w-3.5 h-3.5 text-white/20 shrink-0"
                  />
                  + more stored context...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ======== HOW IT COMPARES ======== -->
    <section class="py-24 px-6 relative z-20 bg-[var(--color-drexii-bg)]">
      <div class="max-w-3xl mx-auto text-center">
        <div class="fade-in-up flex items-center justify-center gap-2 mb-8">
          <span class="w-2 h-2 rounded-full bg-accent-glow" />
          <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">Why Drexii</span>
        </div>
        <h2 class="fade-in-up text-[26px] md:text-[36px] font-medium tracking-tight leading-tight text-white/90 mb-16">
          Everything in one place.<br><span class="text-white/30">No tab-switching. No copy-pasting.</span>
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div
            v-for="item in [
              { icon: 'i-lucide-layers', title: 'Cross-tool agent', desc: 'One request can span Gmail, Calendar, Jira, and Slack — Drexii chains the steps automatically.' },
              { icon: 'i-lucide-eye', title: 'Full transparency', desc: 'Every tool call is logged. Every action needs your approval. You always know what ran and why.' },
              { icon: 'i-lucide-timer', title: 'Works offline', desc: 'Set automations and Drexii keeps running in the background — handling emails, triggering chains.' }
            ]"
            :key="item.title"
            class="fade-in-up p-5 rounded-2xl border border-white/6 bg-white/[0.02]"
          >
            <UIcon
              :name="item.icon"
              class="w-5 h-5 text-amber-400 mb-3"
            />
            <h3 class="text-[14px] font-semibold text-white/85 mb-2">
              {{ item.title }}
            </h3>
            <p class="text-[13px] text-white/40 leading-relaxed">
              {{ item.desc }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ======== CTA ======== -->
    <section class="py-20 md:py-32 px-4 md:px-6 relative z-20 bg-[var(--color-drexii-bg2)] border-t border-white/6">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="fade-in-up text-[32px] md:text-[56px] font-medium mb-8 tracking-tight leading-[1.1] text-white/90">
          Stop switching tabs.<br><span class="text-white/30">Start asking Drexii.</span>
        </h2>
        <div class="fade-in-up stagger-1 flex flex-col sm:flex-row items-center justify-center gap-4">
          <NuxtLink
            to="/chat"
            class="cta-footer-primary px-8 py-3.5 rounded-full text-[15px] font-semibold transition-all shadow-lg"
          >
            Open Chat Now
          </NuxtLink>
          <a
            href="https://discord.gg/3vg69uJP4n"
            target="_blank"
            rel="noopener noreferrer"
            class="cta-footer-secondary px-8 py-3.5 rounded-full text-[15px] font-medium transition-all border flex items-center gap-2"
          >
            <UIcon
              name="i-lucide-message-circle"
              class="w-4 h-4"
            />
            Join Discord
          </a>
        </div>
      </div>
    </section>

    <!-- ======== FOOTER ======== -->
    <footer class="py-12 px-6 bg-[var(--color-drexii-bg2)] relative z-20">
      <div class="max-w-[1100px] mx-auto border-t border-white/6 pt-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg overflow-hidden">
            <img
              src="/logo.png"
              class="w-9 h-9 object-cover opacity-70"
              alt="Drexii Logo"
            >
          </div>
          <span class="text-[14px] font-medium text-white/35">Drexii © {{ new Date().getFullYear() }}</span>
        </div>
        <div class="flex items-center gap-8">
          <a
            href="https://discord.gg/3vg69uJP4n"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-link text-[14px] font-medium transition-colors"
          >Discord</a>
          <a
            href="#"
            class="footer-link text-[14px] font-medium transition-colors"
          >Twitter</a>
          <a
            href="#"
            class="footer-link text-[14px] font-medium transition-colors"
          >GitHub</a>
          <a
            href="#"
            class="footer-link text-[14px] font-medium transition-colors"
          >Privacy</a>
          <a
            href="#"
            class="footer-link text-[14px] font-medium transition-colors"
          >Terms</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.intro-scrub { color: rgba(255, 255, 255, 0.15); }

/* ── Hero text ─────────────────────────────────────────────── */
.hero-headline { color: rgba(255, 255, 255, 1); text-shadow: 0 1px 2px rgba(0,0,0,0.2); }
.hero-headline-muted { color: rgba(255, 255, 255, 0.5); }
.hero-subtitle { color: rgba(255, 255, 255, 0.45); }

/* ── Hero CTA buttons ──────────────────────────────────────── */
.hero-cta-primary { background: #ffffff; color: #000000; }
.hero-cta-primary:hover { background: rgba(255,255,255,0.88); }
.hero-cta-secondary { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.75); border-color: rgba(255,255,255,0.1); }
.hero-cta-secondary:hover { background: rgba(255,255,255,0.1); }

/* ── Card input box ────────────────────────────────────────── */
.card-input-box {
  background: rgba(42, 42, 42, 0.8);
  border: 1px solid rgba(255,255,255,0.05);
}

/* ── Card send button ──────────────────────────────────────── */
.card-send-btn { background: rgba(255,255,255,0.8); color: #000; }
.card-send-btn:hover { background: #ffffff; }

/* ── Card category pills ──────────────────────────────────── */
.card-category-pill { color: rgba(255,255,255,0.35); }
.card-category-pill:hover { color: rgba(255,255,255,0.7); }
.card-category-pill--active {
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.9);
  border-color: rgba(255,255,255,0.05) !important;
}

/* ── Card suggestions ──────────────────────────────────────── */
.card-suggestion { color: rgba(255,255,255,0.4); }
.card-suggestion:hover { color: rgba(255,255,255,0.75); }

/* ── CTA footer buttons ───────────────────────────────────── */
.cta-footer-primary { background: #ffffff; color: #000; box-shadow: 0 4px 24px rgba(255,255,255,0.1); }
.cta-footer-primary:hover { background: rgba(255,255,255,0.9); }
.cta-footer-secondary { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.75); border-color: rgba(255,255,255,0.1); }
.cta-footer-secondary:hover { background: rgba(255,255,255,0.1); }

/* ── Footer links ──────────────────────────────────────────── */
.footer-link { color: rgba(255,255,255,0.35); }
.footer-link:hover { color: #ffffff; }

/* ── Marquee ──────────────────────────────────────────────── */
.marquee-container {
  position: relative;
  width: 100%;
}
.marquee-fade-left,
.marquee-fade-right {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 80px;
  z-index: 2;
  pointer-events: none;
}
.marquee-fade-left {
  left: 0;
  background: linear-gradient(to right, rgb(0,0,0) 0%, transparent 100%);
}
.marquee-fade-right {
  right: 0;
  background: linear-gradient(to left, rgb(0,0,0) 0%, transparent 100%);
}
.marquee-track {
  animation: marquee-scroll 30s linear infinite;
  width: max-content;
}
@keyframes marquee-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* ── Splash screen ────────────────────────────────────────────── */
.splash-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.splash-fading {
  opacity: 0;
  pointer-events: none;
}

.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  animation: splash-arrive 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes splash-arrive {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.splash-logo-wrapper {
  position: relative;
  width: 72px;
  height: 72px;
}

.splash-logo {
  position: absolute;
  inset: 8px;
  border-radius: 16px;
  overflow: hidden;
  z-index: 2;
}

.splash-ring {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  overflow: hidden;
}

.splash-ring-track {
  position: absolute;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  animation: splash-spin 2s linear infinite;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    transparent 60deg,
    #c49746 90deg,
    #e8c574 120deg,
    #feeaa5 150deg,
    #e8c574 180deg,
    #c49746 210deg,
    transparent 240deg,
    transparent 360deg
  );
}

@keyframes splash-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.splash-brand {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: rgba(255, 255, 255, 0.85);
}

.splash-dots {
  display: flex;
  gap: 6px;
}

.splash-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(196, 151, 70, 0.6);
  animation: splash-pulse 1.4s ease-in-out infinite;
}

.splash-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.splash-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes splash-pulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1.2); }
}
</style>
