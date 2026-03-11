<script setup lang="ts">
const router = useRouter()

const categories = ['Research', 'Support Ops', 'Writing', 'Actions']
const activeCategory = ref('Research')

const suggestions = [
  { text: 'Summarize our product in simple terms for new users', icon: 'i-lucide-sparkles' },
  { text: 'Draft a friendly support reply using our help docs', icon: 'i-lucide-message-square' },
  { text: 'Pull the latest metrics from our analytics dashboard', icon: 'i-lucide-bar-chart-3' },
  { text: 'Create a follow-up email for the last sales meeting', icon: 'i-lucide-mail' }
]

const inputValue = ref('')

const heroRef = ref<HTMLElement>()
const chatCardRef = ref<HTMLElement>()
const introRefs = ref<HTMLElement[]>([])
const navRef = ref<HTMLElement>()

const scrollY = ref(0)

function handleScroll() {
  scrollY.value = window.scrollY
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

const navOpacity = computed(() => {
  return Math.max(1 - scrollY.value / 300, 0)
})

const heroParallax = computed(() => {
  const offset = scrollY.value * 0.3
  return {
    transform: `translateY(${offset}px)`
  }
})

function setIntroRef(el: any, index: number) {
  if (el) introRefs.value[index] = el
}

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
    <section class="hero-bg" ref="heroRef">
      <div class="hero-overlay" :style="heroParallax" />

      <!-- Navigation -->
      <nav
        ref="navRef"
        class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 transition-opacity duration-300"
        :style="{ opacity: navOpacity }"
      >
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <UIcon name="i-lucide-diamond" class="w-4 h-4 text-white" />
          </div>
          <span class="text-white font-semibold text-lg tracking-tight">Drexii</span>
        </div>

        <div class="hidden md:flex items-center gap-8">
          <a href="#about" class="text-white/60 hover:text-white text-sm font-medium transition-colors">About</a>
          <a href="#" class="text-white/60 hover:text-white text-sm font-medium transition-colors">Changelog</a>
          <a href="#" class="text-white/60 hover:text-white text-sm font-medium transition-colors">Blog</a>
          <a href="#" class="text-white/60 hover:text-white text-sm font-medium transition-colors">Contact</a>
        </div>

        <button
          class="px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/20 transition-all border border-white/10"
          @click="handleStartChat"
        >
          Get Started
        </button>
      </nav>

      <!-- Hero Content -->
      <div class="relative z-10 flex flex-col items-center pt-32 pb-16 px-6 text-center min-h-screen">
        <!-- Announcement Pill -->
        <div class="fade-in-up pill pill-announcement mb-8">
          <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span>New: Verified answers with sources</span>
          <UIcon name="i-lucide-arrow-right" class="w-3.5 h-3.5" />
        </div>

        <!-- Headline -->
        <h1 class="fade-in-up stagger-1 text-4xl md:text-6xl lg:text-7xl font-light tracking-tight leading-tight max-w-3xl mb-6">
          <span class="text-white/50">Solid AI agent that turns</span>
          <br />
          <span class="text-white font-medium">chats into outcomes</span>
        </h1>

        <!-- Subtitle -->
        <p class="fade-in-up stagger-2 text-white/45 text-base md:text-lg max-w-md mb-10 leading-relaxed">
          Ask anything, get verified answers,
          <br />
          and trigger actions in seconds.
        </p>

        <!-- CTAs -->
        <div class="fade-in-up stagger-3 flex items-center gap-3 mb-16">
          <button
            class="px-7 py-3 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all shadow-lg shadow-white/10"
            @click="handleStartChat"
          >
            Get Started
          </button>
          <button class="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all border border-white/10">
            <UIcon name="i-lucide-play" class="w-4 h-4 text-white ml-0.5" />
          </button>
        </div>

        <!-- Floating Chat Card -->
        <div
          ref="chatCardRef"
          class="scale-in glass-card w-full max-w-2xl mx-auto p-8 transition-transform duration-100"
          :style="chatCardStyle"
        >
          <!-- Card Header -->
          <div class="flex items-center justify-between mb-6">
            <div class="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center">
              <UIcon name="i-lucide-diamond" class="w-4 h-4 text-white/60" />
            </div>
            <button class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <UIcon name="i-lucide-menu" class="w-4 h-4 text-white/40" />
            </button>
          </div>

          <!-- Welcome -->
          <h2 class="text-xl font-semibold text-white text-center mb-1">Welcome back</h2>
          <p class="text-white/40 text-sm text-center mb-8">How can I help you today, Jackson?</p>

          <!-- Input -->
          <div class="glass-input p-4 mb-6">
            <input
              v-model="inputValue"
              type="text"
              placeholder="Ask anything. Type @ for mentions and / for shortcuts."
              class="w-full bg-transparent outline-none text-sm text-white/80 placeholder:text-white/30"
              @keyup.enter="handleStartChat"
            />
            <div class="flex items-center justify-between mt-3">
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-paperclip" class="w-4 h-4 text-white/25 cursor-pointer hover:text-white/50 transition-colors" />
                <UIcon name="i-lucide-bar-chart-2" class="w-4 h-4 text-white/25 cursor-pointer hover:text-white/50 transition-colors" />
                <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-white/25 cursor-pointer hover:text-white/50 transition-colors" />
              </div>
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center cursor-pointer hover:bg-white/12 transition-colors">
                  <UIcon name="i-lucide-sparkles" class="w-3.5 h-3.5 text-white/40" />
                </div>
                <div class="w-7 h-7 rounded-full bg-amber-500/80 flex items-center justify-center cursor-pointer hover:bg-amber-500 transition-colors">
                  <UIcon name="i-lucide-arrow-up" class="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>
          </div>

          <!-- Categories -->
          <div class="flex items-center gap-2 mb-5 overflow-x-auto">
            <button
              v-for="cat in categories"
              :key="cat"
              :class="['pill', cat === activeCategory ? 'pill-active' : 'pill-default']"
              @click="activeCategory = cat"
            >
              {{ cat }}
            </button>
            <div class="ml-auto">
              <UIcon name="i-lucide-search" class="w-4 h-4 text-white/25" />
            </div>
          </div>

          <!-- Suggestions -->
          <div class="space-y-1">
            <div
              v-for="(suggestion, i) in suggestions.slice(0, 2)"
              :key="i"
              class="suggestion-row"
              @click="handleSuggestion(suggestion.text)"
            >
              <span class="flex-1">{{ suggestion.text }}</span>
              <UIcon name="i-lucide-arrow-right" class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ======== INTRO SECTION ======== -->
    <section id="about" class="intro-section">
      <div class="max-w-3xl mx-auto px-6">
        <!-- Intro Badge -->
        <div class="fade-in-up flex items-center gap-2 mb-8">
          <span class="w-2 h-2 rounded-full bg-green-400" />
          <span class="pill pill-default text-xs">Intro</span>
        </div>

        <!-- Intro Paragraphs — staggered text reveal -->
        <p :ref="(el) => setIntroRef(el as HTMLElement, 0)" class="intro-text text-reveal mb-8">
          Drexii is an AI agent that turns conversation
          into execution, delivering clear answers
          and ready-to-use drafts in seconds.
        </p>

        <p :ref="(el) => setIntroRef(el as HTMLElement, 1)" class="intro-text text-reveal stagger-2 mb-8" style="color: rgba(255,255,255,0.15);">
          It connects to your docs and tools, keeps
          context across threads, and surfaces
          sources so teams can trust what they ship.
        </p>

        <p :ref="(el) => setIntroRef(el as HTMLElement, 2)" class="intro-text text-reveal stagger-3" style="color: rgba(255,255,255,0.1);">
          From support to ops to sales, Drexii handles
          the busywork and triggers real actions so
          work keeps moving without tab switching.
        </p>
      </div>
    </section>

    <!-- ======== FEATURES SECTION ======== -->
    <section class="py-24 px-6" style="background: var(--color-drexii-bg);">
      <div class="max-w-5xl mx-auto">
        <h2 class="fade-in-up text-3xl md:text-4xl font-medium text-white mb-16 text-center">
          Everything you need to ship faster
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="fade-in-up glass-card p-6">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
              <UIcon name="i-lucide-brain" class="w-5 h-5 text-amber-400" />
            </div>
            <h3 class="text-white font-semibold mb-2">Dual AI Engine</h3>
            <p class="text-white/40 text-sm leading-relaxed">Claude Opus as primary, Gemini as automatic fallback. Zero interruption, always available.</p>
          </div>

          <div class="fade-in-up stagger-1 glass-card p-6">
            <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <UIcon name="i-lucide-link" class="w-5 h-5 text-blue-400" />
            </div>
            <h3 class="text-white font-semibold mb-2">Connected Tools</h3>
            <p class="text-white/40 text-sm leading-relaxed">Notion, Slack, Zendesk, Salesforce. Pull data and trigger actions from one chat.</p>
          </div>

          <div class="fade-in-up stagger-2 glass-card p-6">
            <div class="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
              <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-green-400" />
            </div>
            <h3 class="text-white font-semibold mb-2">Source Attribution</h3>
            <p class="text-white/40 text-sm leading-relaxed">Every answer links to exactly which docs and records were used. 100% traceable.</p>
          </div>

          <div class="fade-in-up stagger-1 glass-card p-6">
            <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
              <UIcon name="i-lucide-file-text" class="w-5 h-5 text-purple-400" />
            </div>
            <h3 class="text-white font-semibold mb-2">Draft Generation</h3>
            <p class="text-white/40 text-sm leading-relaxed">Emails, docs, tickets, reports — ready-to-send drafts from conversation context.</p>
          </div>

          <div class="fade-in-up stagger-2 glass-card p-6">
            <div class="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center mb-4">
              <UIcon name="i-lucide-zap" class="w-5 h-5 text-rose-400" />
            </div>
            <h3 class="text-white font-semibold mb-2">Action Executor</h3>
            <p class="text-white/40 text-sm leading-relaxed">Confirm before Drexii acts. Full audit log, undo support, and rollback safety.</p>
          </div>

          <div class="fade-in-up stagger-3 glass-card p-6">
            <div class="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4">
              <UIcon name="i-lucide-database" class="w-5 h-5 text-cyan-400" />
            </div>
            <h3 class="text-white font-semibold mb-2">Context Memory</h3>
            <p class="text-white/40 text-sm leading-relaxed">Remembers entities across sessions. Builds knowledge of your team over time.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ======== FOOTER ======== -->
    <footer class="py-12 px-6 border-t border-white/5" style="background: var(--color-drexii-bg);">
      <div class="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-diamond" class="w-4 h-4 text-white/30" />
          <span class="text-white/30 text-sm">Drexii © {{ new Date().getFullYear() }}</span>
        </div>
        <div class="flex items-center gap-6">
          <a href="#" class="text-white/25 hover:text-white/50 text-sm transition-colors">Privacy</a>
          <a href="#" class="text-white/25 hover:text-white/50 text-sm transition-colors">Terms</a>
          <a href="#" class="text-white/25 hover:text-white/50 text-sm transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  </div>
</template>
