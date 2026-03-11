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

  // Text Reveal Logic for Intro Paragraphs
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
    <section
      ref="heroRef"
      class="hero-bg"
    >
      <div
        class="hero-overlay"
        :style="heroParallax"
      />

      <!-- Premium Navigation -->
      <nav
        ref="navRef"
        class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-4 transition-all duration-500 backdrop-blur-xl bg-[#0a0a0a]/40 border-b border-white/5"
      >
        <NuxtLink
          to="/"
          class="flex items-center gap-2 group"
        >
          <div class="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
            <img
              src="/logo.png"
              class="w-4 h-4 object-contain brightness-0 invert"
              alt="Logo"
            >
          </div>
          <span class="text-white font-medium text-[16px] md:text-lg tracking-tight">Drexii</span>
        </NuxtLink>

        <div class="hidden md:flex items-center gap-8 bg-white/5 px-6 py-2 rounded-full border border-white/5 backdrop-blur-md">
          <a
            href="#about"
            class="text-white/50 hover:text-white text-[13px] font-medium transition-colors"
          >Platform</a>
          <a
            href="#features"
            class="text-white/50 hover:text-white text-[13px] font-medium transition-colors"
          >Features</a>
          <a
            href="#"
            class="text-white/50 hover:text-white text-[13px] font-medium transition-colors"
          >Changelog</a>
        </div>

        <button
          class="px-5 py-2 rounded-full bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-all shadow-lg"
          @click="handleStartChat"
        >
          Join Waitlist
        </button>
      </nav>

      <!-- Hero Content -->
      <div class="relative z-10 flex flex-col items-center pt-24 md:pt-32 pb-24 md:pb-32 px-4 md:px-6 text-center min-h-[90vh] justify-start mt-[8vh]">
        <!-- Announcement Pill -->
        <div class="fade-in-up flex items-center justify-center px-4 py-1.5 mb-6 md:mb-8 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[12px] md:text-[13px] text-white/70 hover:bg-white/10 transition-colors cursor-pointer">
          <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse mr-2" />
          <span class="hidden sm:inline">New: </span>Verified answers with sources
          <UIcon
            name="i-lucide-arrow-right"
            class="w-3.5 h-3.5 ml-2 opacity-60"
          />
        </div>

        <!-- Headline -->
        <h1 class="fade-in-up stagger-1 text-[36px] sm:text-[48px] md:text-[68px] font-medium tracking-tight leading-[1.1] max-w-4xl mb-6">
          <span class="text-white/60">Solid AI agent that turns</span>
          <br>
          <span class="text-white drop-shadow-sm">chats into outcomes</span>
        </h1>

        <!-- Subtitle -->
        <p class="fade-in-up stagger-2 text-white/50 text-[14px] sm:text-base max-w-sm mb-8 leading-relaxed font-normal">
          Ask anything, get verified answers,
          <br class="hidden sm:block">
          and trigger actions in seconds.
        </p>

        <!-- CTAs -->
        <div class="fade-in-up stagger-3 flex items-center gap-3 mb-16 z-20">
          <button
            class="px-6 py-2.5 rounded-full bg-white text-black text-[14px] font-semibold hover:bg-white/90 transition-all shadow-lg"
          >
            Join Waitlist
          </button>
          <button class="w-[38px] h-[38px] rounded-full bg-[#4a4a4a] flex items-center justify-center hover:bg-[#5a5a5a] transition-all border border-white/5">
            <UIcon
              name="i-lucide-play"
              class="w-3.5 h-3.5 text-white ml-0.5 fill-white"
            />
          </button>
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
              How can I help you today, Jackson?
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
          :ref="(el) => setIntroRef(el as HTMLElement, 0)"
          class="intro-text text-reveal mb-8 mx-auto text-[24px] md:text-[32px] font-light leading-snug transition-colors duration-100 ease-out"
          style="color: rgba(255,255,255,0.15);"
        >
          Drexii is an AI agent that turns conversation
          into execution, delivering clear answers
          and ready-to-use drafts in seconds.
        </p>

        <p
          :ref="(el) => setIntroRef(el as HTMLElement, 1)"
          class="intro-text text-reveal stagger-2 mb-8 mx-auto text-[24px] md:text-[32px] font-light leading-snug transition-colors duration-100 ease-out"
          style="color: rgba(255,255,255,0.15);"
        >
          It connects to your docs and tools, keeps
          context across threads, and surfaces
          sources so teams can trust what they ship.
        </p>

        <p
          :ref="(el) => setIntroRef(el as HTMLElement, 2)"
          class="intro-text text-reveal stagger-3 mx-auto text-[24px] md:text-[32px] font-light leading-snug transition-colors duration-100 ease-out"
          style="color: rgba(255,255,255,0.15);"
        >
          From support to ops to sales, Drexii handles
          the busywork and triggers real actions so
          work keeps moving without tab switching.
        </p>
      </div>
    </section>

    <!-- ======== FEATURES SECTION ======== -->
    <section
      id="features"
      class="py-32 px-6 relative z-20 bg-[#060606]"
    >
      <div class="max-w-[1100px] mx-auto">
        <div class="flex flex-col items-center mb-20 text-center">
          <div class="fade-in-up flex items-center justify-center gap-2 mb-6">
            <span class="w-2 h-2 rounded-full bg-accent-glow" />
            <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">Capabilities</span>
          </div>
          <h2 class="fade-in-up stagger-1 text-3xl md:text-[40px] font-medium text-white tracking-tight leading-tight max-w-2xl">
            Everything you need to <br><span class="text-white/50">ship faster</span>
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="fade-in-up premium-card p-8 group">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/5 border border-amber-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UIcon
                name="i-lucide-brain"
                class="w-6 h-6 text-amber-400"
              />
            </div>
            <h3 class="text-white font-medium text-lg mb-3">
              Dual AI Engine
            </h3>
            <p class="text-white/50 text-[15px] leading-relaxed">
              Claude Opus acts as your primary brain, with Gemini automatically handling fallbacks. Zero interruptions.
            </p>
          </div>

          <div class="fade-in-up stagger-1 premium-card p-8 group">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/5 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UIcon
                name="i-lucide-link"
                class="w-6 h-6 text-blue-400"
              />
            </div>
            <h3 class="text-white font-medium text-lg mb-3">
              Connected Stack
            </h3>
            <p class="text-white/50 text-[15px] leading-relaxed">
              Notion, Slack, Zendesk, Salesforce. Pull live data and trigger complex workflows instantly.
            </p>
          </div>

          <div class="fade-in-up stagger-2 premium-card p-8 group">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/5 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UIcon
                name="i-lucide-fingerprint"
                class="w-6 h-6 text-emerald-400"
              />
            </div>
            <h3 class="text-white font-medium text-lg mb-3">
              Verified Sources
            </h3>
            <p class="text-white/50 text-[15px] leading-relaxed">
              Every answer is rigorously traced back to your internal docs. Clickable citations build trust.
            </p>
          </div>

          <div class="fade-in-up stagger-1 premium-card p-8 group">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/5 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UIcon
                name="i-lucide-pen-tool"
                class="w-6 h-6 text-purple-400"
              />
            </div>
            <h3 class="text-white font-medium text-lg mb-3">
              One-Click Drafts
            </h3>
            <p class="text-white/50 text-[15px] leading-relaxed">
              Turn bullet points into PRDs, customer emails, or Jira tickets instantly.
            </p>
          </div>

          <div class="fade-in-up stagger-2 premium-card p-8 group">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/5 border border-rose-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UIcon
                name="i-lucide-shield-check"
                class="w-6 h-6 text-rose-400"
              />
            </div>
            <h3 class="text-white font-medium text-lg mb-3">
              Safe Execution
            </h3>
            <p class="text-white/50 text-[15px] leading-relaxed">
              Human-in-the-loop validation before Drexii updates records or sends messages externally.
            </p>
          </div>

          <div class="fade-in-up stagger-3 premium-card p-8 group">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/5 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UIcon
                name="i-lucide-database"
                class="w-6 h-6 text-cyan-400"
              />
            </div>
            <h3 class="text-white font-medium text-lg mb-3">
              Persistent Memory
            </h3>
            <p class="text-white/50 text-[15px] leading-relaxed">
              Drexii remembers conversation history, user preferences, and project context across sessions.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ======== PRE-FOOTER CTA ======== -->
    <section class="py-32 px-6 relative z-20 bg-[#060606] border-t border-white/5">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="fade-in-up text-[40px] md:text-[56px] font-medium text-white mb-8 tracking-tight leading-[1.1]">
          Ready to turn your <br>conversations into <span class="text-white/40">execution?</span>
        </h2>
        <div class="fade-in-up stagger-1 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button class="px-8 py-3.5 rounded-full bg-white text-black text-[15px] font-semibold hover:bg-white/90 transition-all shadow-lg shadow-white/10">
            Join Waitlist
          </button>
          <button class="px-8 py-3.5 rounded-full bg-white/5 text-white text-[15px] font-medium hover:bg-white/10 transition-all border border-white/10">
            Book a Demo
          </button>
        </div>
      </div>
    </section>

    <!-- ======== FOOTER ======== -->
    <footer class="py-12 px-6 bg-[#060606] relative z-20">
      <div class="max-w-[1100px] mx-auto border-t border-white/10 pt-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
            <img
              src="/logo.png"
              class="w-4 h-4 object-contain brightness-0 invert opacity-60"
              alt="Logo"
            >
          </div>
          <span class="text-white/40 text-[14px] font-medium">Drexii © {{ new Date().getFullYear() }}</span>
        </div>

        <div class="flex items-center gap-8">
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
