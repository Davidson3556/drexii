<script setup lang="ts">
import type { ComponentPublicInstance } from '#imports'

const router = useRouter()

const categories = ['Email', 'Research', 'Writing', 'Actions']
const activeCategory = ref('Research')

const suggestions = [
  { text: 'List my unread emails and summarize the important ones', icon: 'i-lucide-mail' },
  { text: 'Search Notion for our project roadmap', icon: 'i-lucide-sparkles' },
  { text: 'Draft a reply to the latest client email', icon: 'i-lucide-message-square' },
  { text: 'Post a status update to #general on Slack', icon: 'i-lucide-send' }
]

const inputValue = ref('')

const heroRef = ref<HTMLElement>()
const chatCardRef = ref<HTMLElement>()
const introRefs = ref<HTMLElement[]>([])

const scrollY = ref(0)

function handleScroll() {
  scrollY.value = window.scrollY

  // Text Reveal Logic for Intro Paragraphs
  const isDark = document.documentElement.classList.contains('dark')
  introRefs.value.forEach((el) => {
    if (!el) return

    const rect = el.getBoundingClientRect()
    // Calculate distance from center of viewport
    const viewportMiddle = window.innerHeight * 0.6
    const startReveal = viewportMiddle + 150
    const endReveal = viewportMiddle - 50

    const scrollProgress = Math.max(0, Math.min(1, (startReveal - rect.top) / (startReveal - endReveal)))
    const opacity = 0.15 + (scrollProgress * 0.85)

    // Apply dynamic inline styles for the scrub-in effect
    if (isDark) {
      el.style.color = `rgba(255, 255, 255, ${opacity})`
      if (scrollProgress > 0.1) {
        el.style.textShadow = `0 0 ${scrollProgress * 15}px rgba(255, 255, 255, ${scrollProgress * 0.3})`
      } else {
        el.style.textShadow = 'none'
      }
    } else {
      // Light mode: reveal from light-muted to dark text
      const darkOpacity = 0.15 + (scrollProgress * 0.77)
      el.style.color = `rgba(12, 12, 14, ${darkOpacity})`
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

const heroParallax = computed(() => {
  const offset = scrollY.value * 0.3
  return {
    transform: `translateY(${offset}px)`
  }
})

function setIntroRef(el: HTMLElement | null, index: number) {
  if (el) introRefs.value[index] = el
}

const introRef0 = (el: Element | ComponentPublicInstance | null) => setIntroRef(el as HTMLElement | null, 0)
const introRef1 = (el: Element | ComponentPublicInstance | null) => setIntroRef(el as HTMLElement | null, 1)
const introRef2 = (el: Element | ComponentPublicInstance | null) => setIntroRef(el as HTMLElement | null, 2)

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    },
    { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
  )

  nextTick(() => {
    document.querySelectorAll('.fade-in-up, .scale-in, .text-reveal').forEach((el) => {
      observer.observe(el)
    })
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

async function handleStartChat() {
  router.push('/chat')
}

async function handleSuggestion(text: string) {
  inputValue.value = text
  router.push('/chat')
}
</script>

<template>
  <div>
    <!-- ======== HERO SECTION ======== -->
    <section
      ref="heroRef"
      class="hero-bg"
    >
      <div
        class="hero-overlay"
        :style="heroParallax"
      />

      <!-- Hero Content -->
      <div class="relative z-10 flex flex-col items-center pt-24 md:pt-32 pb-24 md:pb-32 px-4 md:px-6 text-center min-h-[90vh] justify-start mt-[8vh]">
        <!-- Headline -->
        <h1 class="fade-in-up stagger-1 text-[32px] sm:text-[44px] md:text-[64px] font-medium tracking-tight leading-[1.1] max-w-4xl mb-6">
          <span class="text-white/60">One chat to search, write,</span>
          <br>
          <span class="text-white drop-shadow-sm">and act across your stack</span>
        </h1>

        <!-- Subtitle -->
        <p class="fade-in-up stagger-2 text-white/50 text-[14px] sm:text-base max-w-md mb-8 leading-relaxed font-normal">
          Drexii connects to Gmail, Notion, Slack, Discord, and more.
          <br class="hidden sm:block">
          Ask a question — get answers, drafts, and actions.
        </p>

        <!-- CTAs -->
        <div class="fade-in-up stagger-3 flex flex-col sm:flex-row items-center gap-3 mb-12 md:mb-16 z-20">
          <NuxtLink
            to="/chat"
            class="px-6 py-2.5 rounded-full bg-white text-black text-[14px] font-semibold hover:bg-white/90 transition-all shadow-lg"
          >
            Start Chatting
          </NuxtLink>
          <a
            href="#features"
            class="px-6 py-2.5 rounded-full bg-white/5 text-white text-[14px] font-medium hover:bg-white/10 transition-all border border-white/10"
          >
            See What It Does
          </a>
        </div>

        <!-- Floating Chat Card (Centered Interface) -->
        <div class="w-full max-w-4xl mx-auto px-4 md:px-0 z-10 mt-2 md:mt-4 relative">
          <div
            ref="chatCardRef"
            class="scale-in app-window w-full rounded-[24px] md:rounded-[30px] p-5 sm:p-8 md:p-12 shadow-[0_32px_80px_rgba(0,0,0,0.6)] mx-auto transition-transform duration-100 will-change-transform"
            :style="chatCardStyle"
          >
            <!-- Card Header -->
            <div class="flex items-center justify-between mb-8 md:mb-12">
              <div class="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-white/10 flex items-center justify-center shadow-inner pt-0.5 pl-0.5">
                <UIcon
                  name="i-lucide-box"
                  class="w-4 h-4 md:w-5 md:h-5 text-white/80"
                />
              </div>
              <button class="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition">
                <UIcon
                  name="i-lucide-menu"
                  class="w-4 h-4 text-white/50"
                />
              </button>
            </div>

            <!-- Welcome -->
            <h2 class="text-[20px] md:text-[22px] font-medium text-white/90 text-center mb-1 md:mb-2">
              Welcome back
            </h2>
            <p class="text-white/40 text-[12px] md:text-[13px] text-center mb-6 md:mb-10 font-medium">
              How can I help you today?
            </p>

            <!-- Input Box -->
            <div class="bg-[#2a2a2a]/80 border border-white/5 rounded-2xl p-3 md:p-4 mb-4 shadow-inner">
              <input
                v-model="inputValue"
                type="text"
                placeholder="Ask anything. Type @ for mentions and / for shortcuts."
                class="w-full bg-transparent outline-none text-[14px] md:text-[15px] text-white/80 placeholder:text-white/30 pt-1 pb-2 md:pb-4"
                @keyup.enter="handleStartChat"
              >
              <div class="flex items-center justify-between mt-2">
                <div class="flex items-center gap-3 md:gap-4 px-1">
                  <UIcon
                    name="i-lucide-paperclip"
                    class="w-4 h-4 text-white/20 hover:text-white/50 transition-colors cursor-pointer"
                  />
                  <UIcon
                    name="i-lucide-bar-chart-2"
                    class="w-4 h-4 text-white/20 hover:text-white/50 transition-colors cursor-pointer"
                  />
                  <UIcon
                    name="i-lucide-zap"
                    class="w-4 h-4 text-white/20 hover:text-white/50 transition-colors cursor-pointer"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors border border-white/5">
                    <UIcon
                      name="i-lucide-mic"
                      class="w-3.5 h-3.5 text-white/40"
                    />
                  </div>
                  <div class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/80 flex items-center justify-center cursor-pointer hover:bg-white transition-colors">
                    <UIcon
                      name="i-lucide-arrow-up"
                      class="w-4 h-4 text-black"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Categories -->
            <div class="flex items-center justify-between mb-4 md:mb-6 pb-4 md:pb-6 border-b border-white/5">
              <div class="flex items-center gap-2 overflow-x-auto no-scrollbar mask-edges pr-4">
                <button
                  v-for="cat in categories"
                  :key="cat"
                  :class="['px-3 md:px-4 py-1.5 rounded-full text-[12px] md:text-[13px] font-medium transition-colors border border-transparent whitespace-nowrap', cat === activeCategory ? 'bg-white/10 text-white/90 border-white/5' : 'text-white/40 hover:text-white/70']"
                  @click="activeCategory = cat"
                >
                  {{ cat }}
                </button>
              </div>
              <UIcon
                name="i-lucide-search"
                class="w-4 h-4 text-white/30 cursor-pointer"
              />
            </div>

            <!-- Suggestions -->
            <div class="space-y-1 mt-6">
              <div
                v-for="(suggestion, i) in suggestions.slice(0, 2)"
                :key="i"
                class="flex items-center justify-between py-3 px-2 group cursor-pointer text-white/40 hover:text-white/80 transition-colors border-b border-white/5 last:border-0"
                @click="handleSuggestion(suggestion.text)"
              >
                <span class="text-[14px]">{{ suggestion.text }}</span>
                <div class="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center">
                  <UIcon
                    name="i-lucide-arrow-right"
                    class="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </div>
            </div>

            <div class="h-8" />
          </div>
        </div>
      </div>
    </section>

    <!-- ======== INTRO SECTION ======== -->
    <section
      id="about"
      class="intro-section relative z-20"
    >
      <div class="max-w-4xl mx-auto px-6 text-center">
        <!-- Intro Badge -->
        <div class="fade-in-up flex items-center justify-center gap-2 mb-12">
          <span class="w-2 h-2 rounded-full bg-accent-glow" />
          <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">The Platform</span>
        </div>

        <!-- Intro Paragraphs — staggered text reveal -->
        <p
          :ref="introRef0"
          class="intro-text intro-scrub mb-8 mx-auto text-[24px] md:text-[32px] font-light leading-snug transition-colors duration-100 ease-out"
        >
          You ask a question in plain language.
          Drexii searches your emails, pulls context from Notion,
          checks Slack, and gives you the answer — with sources.
        </p>

        <p
          :ref="introRef1"
          class="intro-text intro-scrub stagger-2 mb-8 mx-auto text-[20px] md:text-[32px] font-light leading-snug transition-colors duration-100 ease-out"
        >
          Need a draft? An email sent? A ticket created?
          Just say it. Drexii executes across your
          connected tools without you leaving the chat.
        </p>

        <p
          :ref="introRef2"
          class="intro-text intro-scrub stagger-3 mx-auto text-[20px] md:text-[32px] font-light leading-snug transition-colors duration-100 ease-out"
        >
          Set up automations and Drexii works even when
          you're offline — handling emails, running tasks,
          and keeping everything moving.
        </p>
      </div>
    </section>

    <!-- ======== FEATURES SECTION ======== -->
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
          <h2 class="fade-in-up stagger-1 text-[28px] md:text-[40px] font-medium text-white tracking-tight leading-tight max-w-2xl">
            What makes Drexii <br><span class="text-white/50">different</span>
          </h2>
        </div>

        <!-- Bento Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Multi-Model AI — wide (2 cols) -->
          <div class="fade-in-up feature-card feature-card--amber lg:col-span-2 group">
            <span class="fc-num">01</span>
            <div class="fc-icon fc-icon--amber">
              <UIcon
                name="i-lucide-brain"
                class="w-6 h-6 text-amber-400"
              />
            </div>
            <h3 class="fc-title">
              Multi-Model AI
            </h3>
            <p class="fc-desc">
              Multiple AI models working together. The right model is selected for each task — deep reasoning, writing, quick answers, or code.
            </p>
            <div class="fc-badge">
              <span class="fc-badge-dot fc-badge-dot--amber" />
              Opus · Sonnet · Haiku · DeepSeek
            </div>
          </div>

          <!-- 6 Integrations -->
          <div class="fade-in-up stagger-1 feature-card feature-card--blue group">
            <span class="fc-num">02</span>
            <div class="fc-icon fc-icon--blue">
              <UIcon
                name="i-lucide-plug-zap"
                class="w-6 h-6 text-blue-400"
              />
            </div>
            <h3 class="fc-title">
              6 Integrations,<br>20+ Tools
            </h3>
            <p class="fc-desc">
              Gmail, Notion, Slack, Discord, Zendesk, Salesforce — all from one chat.
            </p>
          </div>

          <!-- Traceable Answers -->
          <div class="fade-in-up stagger-1 feature-card feature-card--emerald group">
            <span class="fc-num">03</span>
            <div class="fc-icon fc-icon--emerald">
              <UIcon
                name="i-lucide-fingerprint"
                class="w-6 h-6 text-emerald-400"
              />
            </div>
            <h3 class="fc-title">
              Traceable Answers
            </h3>
            <p class="fc-desc">
              Every response cites exactly where it came from — a Notion page, a Slack thread, a record.
            </p>
          </div>

          <!-- Autonomous Automations -->
          <div class="fade-in-up stagger-2 feature-card feature-card--purple group">
            <span class="fc-num">04</span>
            <div class="fc-icon fc-icon--purple">
              <UIcon
                name="i-lucide-bot"
                class="w-6 h-6 text-purple-400"
              />
            </div>
            <h3 class="fc-title">
              Autonomous Automations
            </h3>
            <p class="fc-desc">
              Set triggers for emails, schedules, or webhooks. Drexii runs in the background — even when you're offline.
            </p>
          </div>

          <!-- Full Audit Trail -->
          <div class="fade-in-up stagger-2 feature-card feature-card--rose group">
            <span class="fc-num">05</span>
            <div class="fc-icon fc-icon--rose">
              <UIcon
                name="i-lucide-scroll-text"
                class="w-6 h-6 text-rose-400"
              />
            </div>
            <h3 class="fc-title">
              Full Audit Trail
            </h3>
            <p class="fc-desc">
              Every action logged — what tool, what arguments, what result. Complete transparency.
            </p>
          </div>

          <!-- Persistent Memory — full width -->
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
                  Tell Drexii something once and it remembers — your preferences, your projects, your context. Across every conversation.
                </p>
              </div>
              <div class="flex flex-col gap-2.5 md:w-72 shrink-0">
                <div class="memory-chip">
                  <UIcon
                    name="i-lucide-bookmark"
                    class="w-3.5 h-3.5 text-cyan-400 shrink-0"
                  />
                  "Always use bullet points"
                </div>
                <div class="memory-chip">
                  <UIcon
                    name="i-lucide-bookmark"
                    class="w-3.5 h-3.5 text-cyan-400 shrink-0"
                  />
                  "Q1 budget is $50k"
                </div>
                <div class="memory-chip">
                  <UIcon
                    name="i-lucide-bookmark"
                    class="w-3.5 h-3.5 text-cyan-400 shrink-0"
                  />
                  "Post bugs to #engineering"
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

    <!-- ======== PRE-FOOTER CTA ======== -->
    <section class="py-20 md:py-32 px-4 md:px-6 relative z-20 bg-[var(--color-drexii-bg2)] border-t border-white/5">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="fade-in-up text-[32px] md:text-[56px] font-medium text-white mb-8 tracking-tight leading-[1.1]">
          Stop switching tabs. <br><span class="text-white/40">Start asking Drexii.</span>
        </h2>
        <div class="fade-in-up stagger-1 flex flex-col sm:flex-row items-center justify-center gap-4">
          <NuxtLink
            to="/chat"
            class="px-8 py-3.5 rounded-full bg-white text-black text-[15px] font-semibold hover:bg-white/90 transition-all shadow-lg shadow-white/10"
          >
            Open Chat Now
          </NuxtLink>
          <a
            href="https://discord.gg/3vg69uJP4n"
            target="_blank"
            rel="noopener noreferrer"
            class="px-8 py-3.5 rounded-full bg-white/5 text-white text-[15px] font-medium hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2"
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
      <div class="max-w-[1100px] mx-auto border-t border-white/10 pt-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center">
            <img
              src="/logo.png"
              class="w-9 h-9 object-cover opacity-70"
              alt="Drexii Logo"
            >
          </div>
          <span class="text-white/40 text-[14px] font-medium">Drexii © {{ new Date().getFullYear() }}</span>
        </div>

        <div class="flex items-center gap-8">
          <a
            href="https://discord.gg/3vg69uJP4n"
            target="_blank"
            rel="noopener noreferrer"
            class="text-white/40 hover:text-white text-[14px] font-medium transition-colors"
          >Discord</a>
          <a
            href="#"
            class="text-white/40 hover:text-white text-[14px] font-medium transition-colors"
          >Twitter</a>
          <a
            href="#"
            class="text-white/40 hover:text-white text-[14px] font-medium transition-colors"
          >GitHub</a>
          <a
            href="#"
            class="text-white/40 hover:text-white text-[14px] font-medium transition-colors"
          >Privacy</a>
          <a
            href="#"
            class="text-white/40 hover:text-white text-[14px] font-medium transition-colors"
          >Terms</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Intro scrub paragraphs — initial muted state (JS animates to full opacity on scroll) */
.intro-scrub {
  color: rgba(255, 255, 255, 0.15);
}
:global(html:not(.dark)) .intro-scrub {
  color: rgba(12, 12, 14, 0.15);
}
</style>
