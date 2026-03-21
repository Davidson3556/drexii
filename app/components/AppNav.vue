<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { isFallback } = useModelStatus()
const { signOut, user } = useAuth()

async function logout() {
  await signOut()
  await router.push('/login')
}

const navLinks = [
  { id: 'how-it-works', label: 'How It Works', section: 'about', to: null },
  { id: 'features', label: 'Features', section: 'features', to: null },
  { id: 'try-drexii', label: 'Try Drexii', section: null, to: '/chat' },
  { id: 'workflows', label: 'Workflows', section: null, to: '/workflows' },
]

const activeItem = ref(
  route.path === '/chat' ? 'try-drexii'
    : route.path === '/workflows' ? 'workflows'
      : 'how-it-works'
)
const mobileOpen = ref(false)

// ── Desktop pill indicator ────────────────────────────────────
const pillContainerRef = ref<HTMLElement | null>(null)
const pillRefs = ref<(HTMLElement | null)[]>(Array(navLinks.length).fill(null))
const pillLeft = ref(0)
const pillW = ref(0)
const pillH = ref(0)

function updatePill() {
  const idx = navLinks.findIndex(n => n.id === activeItem.value)
  const btn = pillRefs.value[idx]
  const ctr = pillContainerRef.value
  if (!btn || !ctr) return
  const b = btn.getBoundingClientRect()
  const c = ctr.getBoundingClientRect()
  pillLeft.value = b.left - c.left
  pillW.value = b.width
  pillH.value = b.height
}

// ── Mobile vertical indicator ─────────────────────────────────
const mobContainerRef = ref<HTMLElement | null>(null)
const mobRefs = ref<(HTMLElement | null)[]>(Array(navLinks.length).fill(null))
const mobTop = ref(0)
const mobW = ref(0)
const mobH = ref(0)

function updateMob() {
  const idx = navLinks.findIndex(n => n.id === activeItem.value)
  const btn = mobRefs.value[idx]
  const ctr = mobContainerRef.value
  if (!btn || !ctr) return
  const b = btn.getBoundingClientRect()
  const c = ctr.getBoundingClientRect()
  mobTop.value = b.top - c.top
  mobW.value = b.width
  mobH.value = b.height
}

// ── Watchers ──────────────────────────────────────────────────
watch(activeItem, () => nextTick(() => {
  updatePill()
  if (mobileOpen.value) updateMob()
}))

watch(mobileOpen, (open) => {
  if (import.meta.client) document.body.style.overflow = open ? 'hidden' : ''
  if (open) nextTick(updateMob)
})

watch(() => route.path, (path) => {
  activeItem.value = path === '/chat' ? 'try-drexii' : path === '/workflows' ? 'workflows' : 'how-it-works'
  mobileOpen.value = false
  nextTick(updatePill)
})

// ── Scroll-driven active (homepage only) ─────────────────────
function handleScroll() {
  if (route.path !== '/') return
  const f = document.getElementById('features')
  if (f && f.getBoundingClientRect().top < window.innerHeight * 0.55) {
    activeItem.value = 'features'
  } else {
    activeItem.value = 'how-it-works'
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  nextTick(updatePill)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (import.meta.client) document.body.style.overflow = ''
})

// ── Navigation handler ────────────────────────────────────────
function navigate(link: typeof navLinks[0]) {
  activeItem.value = link.id
  mobileOpen.value = false
  if (link.section) {
    if (route.path === '/') {
      document.getElementById(link.section)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      router.push(`/#${link.section}`)
    }
  } else if (link.to) {
    router.push(link.to)
  }
}

const isOnChat = computed(() => route.path === '/chat')
</script>

<template>
  <!-- ── Fixed header ────────────────────────────────────────── -->
  <header class="app-header">
    <!-- Logo -->
    <NuxtLink to="/" class="nav-logo">
      <div class="logo-mark">
        <img src="/logo.png" alt="Drexii" class="w-full h-full object-cover">
      </div>
      <span class="logo-text">Drexii</span>
    </NuxtLink>

    <!-- Desktop golden ring pill nav -->
    <div
      ref="pillContainerRef"
      class="pill-nav"
    >
      <!-- Ring indicator (4 layers) -->
      <div
        class="pill-ring"
        :style="{ left: `${pillLeft}px`, width: `${pillW}px`, height: `${pillH}px` }"
      >
        <div class="gold-glow" />
        <div class="gold-clip">
          <div class="gold-spin" />
        </div>
        <div class="gold-plate" />
      </div>

      <!-- Links -->
      <button
        v-for="(link, i) in navLinks"
        :key="link.id"
        :ref="(el) => { pillRefs[i] = el as HTMLElement }"
        class="pill-link"
        :class="{ 'pill-link--active': activeItem === link.id }"
        @click="navigate(link)"
      >
        {{ link.label }}
      </button>
    </div>

    <!-- Desktop right -->
    <div class="header-right header-right--desktop">
      <!-- Homepage: Open Chat CTA -->
      <NuxtLink
        v-if="!isOnChat"
        to="/chat"
        class="cta-btn"
      >
        Open Chat
      </NuxtLink>

      <!-- Chat page: model status + settings -->
      <template v-if="isOnChat">
        <div
          v-if="isFallback"
          class="status-pill status-pill--fallback"
          title="Claude is temporarily unavailable. Gemini is handling your requests."
        >
          <span class="status-dot status-dot--amber" />
          <span>Backup AI active</span>
        </div>
        <div v-else class="status-pill">
          <span class="status-dot status-dot--green" />
          <span>AI Online</span>
        </div>
        <button
          class="user-avatar-btn"
          :title="`Signed in as ${user?.email ?? ''} · Click to sign out`"
          @click="logout"
        >
          <img
            v-if="user?.avatar_url"
            :src="user.avatar_url"
            :alt="user?.name ?? 'User'"
            class="w-full h-full object-cover rounded-full"
          >
          <span
            v-else
            class="text-xs font-semibold text-white/70"
          >{{ (user?.name ?? user?.email ?? '?').charAt(0).toUpperCase() }}</span>
        </button>
      </template>
    </div>

    <!-- Mobile right: model dot + burger -->
    <div class="header-right header-right--mobile">
      <span
        v-if="isOnChat"
        class="status-dot-sm"
        :class="isFallback ? 'status-dot-sm--amber' : 'status-dot-sm--green'"
      />
      <button
        class="burger-btn"
        :class="{ 'burger-btn--open': mobileOpen }"
        aria-label="Toggle menu"
        @click="mobileOpen = !mobileOpen"
      >
        <span class="burger-line burger-line--top" />
        <span class="burger-line burger-line--mid" />
        <span class="burger-line burger-line--bot" />
      </button>
    </div>
  </header>

  <!-- ── Mobile overlay ─────────────────────────────────────── -->
  <Transition name="mob">
    <div
      v-show="mobileOpen"
      class="mobile-overlay"
      @click.self="mobileOpen = false"
    >
      <!-- Overlay top bar -->
      <div class="mob-topbar">
        <NuxtLink to="/" class="nav-logo" @click="mobileOpen = false">
          <div class="logo-mark">
            <img src="/logo.png" alt="Drexii" class="w-full h-full object-cover">
          </div>
          <span class="logo-text">Drexii</span>
        </NuxtLink>
        <button class="mob-close" aria-label="Close menu" @click="mobileOpen = false">
          <UIcon name="i-lucide-x" class="w-5 h-5" />
        </button>
      </div>

      <!-- Nav items with vertical ring indicator -->
      <nav ref="mobContainerRef" class="mob-nav">
        <!-- Vertical ring indicator (4 layers) -->
        <div
          class="mob-ring"
          :style="{
            top: `${mobTop}px`,
            width: `${mobW}px`,
            height: `${mobH}px`,
          }"
        >
          <div class="gold-glow" />
          <div class="gold-clip">
            <div class="gold-spin" />
          </div>
          <div class="gold-plate" />
        </div>

        <!-- Mobile links -->
        <button
          v-for="(link, i) in navLinks"
          :key="link.id"
          :ref="(el) => { mobRefs[i] = el as HTMLElement }"
          class="mob-link"
          :class="{ 'mob-link--active': activeItem === link.id }"
          @click="navigate(link)"
        >
          {{ link.label }}
        </button>
      </nav>

      <!-- Bottom CTA -->
      <div class="mob-footer">
        <NuxtLink to="/chat" class="mob-cta" @click="mobileOpen = false">
          Start Chatting
          <UIcon name="i-lucide-arrow-right" class="w-4 h-4" />
        </NuxtLink>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ── Header ─────────────────────────────────────────────────── */
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: rgba(10, 10, 10, 0.6);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

/* ── Logo ────────────────────────────────────────────────────── */
.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  flex-shrink: 0;
}
.logo-mark {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
}
.logo-text {
  color: rgba(255, 255, 255, 0.92);
  font-weight: 600;
  font-size: 16px;
  letter-spacing: -0.02em;
}

/* ── Desktop pill nav ────────────────────────────────────────── */
.pill-nav {
  display: none;
  align-items: center;
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 9999px;
  padding: 4px;
}

@media (min-width: 768px) {
  .pill-nav {
    display: flex;
  }
}

.pill-link {
  position: relative;
  z-index: 3;
  padding: 6px 18px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.42);
  background: transparent;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.22s ease;
}
.pill-link:hover {
  color: rgba(255, 255, 255, 0.72);
}
.pill-link--active {
  color: rgba(255, 255, 255, 0.96);
}

/* ── Desktop right section ──────────────────────────────────── */
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.header-right--desktop {
  display: none;
}
.header-right--mobile {
  display: flex;
}

@media (min-width: 768px) {
  .header-right--desktop {
    display: flex;
  }
  .header-right--mobile {
    display: none;
  }
}

.cta-btn {
  padding: 7px 18px;
  border-radius: 9999px;
  background: #ffffff;
  color: #000000;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.18s ease;
}
.cta-btn:hover {
  background: rgba(255, 255, 255, 0.88);
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.05);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}
.status-pill--fallback {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  color: rgba(251, 191, 36, 0.9);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  animation: pulse-dot 2s infinite;
}
.status-dot--green {
  background: #22c55e;
  box-shadow: 0 0 5px rgba(34, 197, 94, 0.5);
}
.status-dot--amber {
  background: #f59e0b;
  box-shadow: 0 0 5px rgba(245, 158, 11, 0.5);
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

.user-avatar-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: border-color 0.18s ease, transform 0.18s ease;
  flex-shrink: 0;
}
.user-avatar-btn:hover {
  border-color: rgba(232, 194, 116, 0.5);
  transform: scale(1.05);
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.38);
  transition: background 0.18s ease, color 0.18s ease;
}
.icon-btn:hover {
  background: rgba(255, 255, 255, 0.09);
  color: rgba(255, 255, 255, 0.65);
}

/* ── Burger button ───────────────────────────────────────────── */
.status-dot-sm {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  animation: pulse-dot 2s infinite;
}
.status-dot-sm--green {
  background: #22c55e;
  box-shadow: 0 0 5px rgba(34, 197, 94, 0.5);
}
.status-dot-sm--amber {
  background: #f59e0b;
  box-shadow: 0 0 5px rgba(245, 158, 11, 0.5);
}

.burger-btn {
  width: 36px;
  height: 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.burger-line {
  display: block;
  width: 20px;
  height: 1.5px;
  background: rgba(255, 255, 255, 0.65);
  border-radius: 2px;
  transform-origin: center;
  transition: transform 0.3s cubic-bezier(0.34, 1.2, 0.64, 1),
              opacity 0.2s ease;
}

.burger-btn--open .burger-line--top {
  transform: translateY(6.5px) rotate(45deg);
}
.burger-btn--open .burger-line--mid {
  opacity: 0;
  transform: scaleX(0);
}
.burger-btn--open .burger-line--bot {
  transform: translateY(-6.5px) rotate(-45deg);
}

/* ── Mobile overlay ──────────────────────────────────────────── */
.mobile-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  background: rgba(9, 9, 11, 0.97);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}

/* Film grain on overlay */
.mobile-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 200px 200px;
  opacity: 0.03;
  mix-blend-mode: overlay;
}

.mob-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.mob-close {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: none;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.55);
  transition: background 0.18s ease;
}
.mob-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* ── Mobile nav links + vertical ring ───────────────────────── */
.mob-nav {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 32px 24px;
}

.mob-link {
  position: relative;
  z-index: 3;
  padding: 14px 52px;
  border-radius: 9999px;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: rgba(255, 255, 255, 0.35);
  background: transparent;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.22s ease;
}
.mob-link:hover {
  color: rgba(255, 255, 255, 0.7);
}
.mob-link--active {
  color: rgba(255, 255, 255, 0.96);
}

.mob-footer {
  padding: 32px 24px;
  display: flex;
  justify-content: center;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.mob-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 32px;
  border-radius: 9999px;
  background: #ffffff;
  color: #000000;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.18s ease;
}
.mob-cta:hover {
  background: rgba(255, 255, 255, 0.88);
}

/* ── Desktop pill ring indicator ────────────────────────────── */
.pill-ring {
  position: absolute;
  top: 4px;
  pointer-events: none;
  z-index: 2;
  transition:
    left  0.45s cubic-bezier(0.34, 1.2, 0.64, 1),
    width 0.45s cubic-bezier(0.34, 1.2, 0.64, 1);
}

/* ── Mobile vertical ring indicator ────────────────────────── */
.mob-ring {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 2;
  transition:
    top    0.45s cubic-bezier(0.34, 1.2, 0.64, 1),
    width  0.45s cubic-bezier(0.34, 1.2, 0.64, 1),
    height 0.45s cubic-bezier(0.34, 1.2, 0.64, 1);
}

/* ── Shared 4-layer golden ring CSS ─────────────────────────── */

/* Layer 1: warm gold glow */
.gold-glow {
  position: absolute;
  inset: -5px;
  border-radius: 9999px;
  background: #e8af48;
  opacity: 0.15;
  filter: blur(14px);
}

/* Layer 2: pill clip container */
.gold-clip {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  overflow: hidden;
}

/*
  Layer 3: spinning conic-gradient
  200% sized, -50% offset so it rotates from center.
  Gold-dominant: ~70% bronze→warm gold→light gold
  2 × white hotspots ~3% each (~11°)
  2 × thin pink + blue hints for chromatic iridescence
  Pattern repeats twice (symmetry)
*/
.gold-spin {
  position: absolute;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  animation: spin-gold 4.5s linear infinite;
  background: conic-gradient(
    from 0deg,
    #533517   0deg,
    #7a4e1f  12deg,
    #c49746  28deg,
    #e8c574  48deg,
    #feeaa5  68deg,
    #feeaa5  88deg,
    #e8c574 105deg,
    #c49746 116deg,
    #7a4e1f 124deg,
    #533517 126deg,
    #ffc0cb 130deg,
    #ffc0cb 132deg,
    #ffffff 135deg,
    #ffffff 145deg,
    #87ceeb 148deg,
    #87ceeb 151deg,
    #533517 158deg,
    #533517 180deg,
    #7a4e1f 192deg,
    #c49746 208deg,
    #e8c574 228deg,
    #feeaa5 248deg,
    #feeaa5 268deg,
    #e8c574 285deg,
    #c49746 296deg,
    #7a4e1f 304deg,
    #533517 306deg,
    #ffc0cb 310deg,
    #ffc0cb 312deg,
    #ffffff 315deg,
    #ffffff 325deg,
    #87ceeb 328deg,
    #87ceeb 331deg,
    #533517 338deg,
    #533517 360deg
  );
}

@keyframes spin-gold {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* Layer 4: inner plate, inset 2px → only 2px ring visible */
.gold-plate {
  position: absolute;
  inset: 2px;
  border-radius: 9999px;
}

/* Desktop pill: plate matches nav pill bg */
.pill-ring .gold-plate {
  background: rgba(14, 14, 16, 0.96);
}

/* Mobile: plate matches overlay bg */
.mob-ring .gold-plate {
  background: rgba(9, 9, 11, 0.97);
}

/* ── Mobile overlay transition ──────────────────────────────── */
.mob-enter-active {
  transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.mob-leave-active {
  transition: opacity 0.22s ease, transform 0.25s ease-in;
}
.mob-enter-from,
.mob-leave-to {
  opacity: 0;
  transform: translateY(-16px);
}
</style>
