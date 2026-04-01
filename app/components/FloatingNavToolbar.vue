<script setup lang="ts">
const navItems = [
  { id: 'home', icon: 'i-lucide-house', label: 'Home' },
  { id: 'chat', icon: 'i-lucide-message-square', label: 'Chat' },
  { id: 'search', icon: 'i-lucide-search', label: 'Search' },
  { id: 'integrations', icon: 'i-lucide-plug-2', label: 'Integrations' },
  { id: 'settings', icon: 'i-lucide-settings-2', label: 'Settings' }
]

const activeItem = ref('chat')
const isDark = ref(true)
const isThemeBouncing = ref(false)
const buttonRefs = ref<(HTMLElement | null)[]>(Array(navItems.length).fill(null))
const toolbarInnerRef = ref<HTMLElement | null>(null)
const indicatorLeft = ref(0)
const indicatorSize = ref(40)

function updateIndicator() {
  const index = navItems.findIndex(n => n.id === activeItem.value)
  const btn = buttonRefs.value[index]
  const toolbar = toolbarInnerRef.value
  if (!btn || !toolbar) return
  const bRect = btn.getBoundingClientRect()
  const tRect = toolbar.getBoundingClientRect()
  indicatorLeft.value = bRect.left - tRect.left
  indicatorSize.value = bRect.width
}

watch(activeItem, () => nextTick(updateIndicator))
onMounted(() => nextTick(updateIndicator))

function setActive(id: string) {
  activeItem.value = id
}

function toggleTheme() {
  if (isThemeBouncing.value) return
  isThemeBouncing.value = true
  isDark.value = !isDark.value
  setTimeout(() => {
    isThemeBouncing.value = false
  }, 700)
}
</script>

<template>
  <div class="floating-toolbar-wrapper">
    <!-- Radial ambient glow -->
    <div class="ambient-glow" />

    <!-- Toolbar pill -->
    <div
      ref="toolbarInnerRef"
      class="toolbar"
    >
      <!-- Golden active ring indicator -->
      <div
        class="ring-indicator"
        :style="{ left: `${indicatorLeft}px`, width: `${indicatorSize}px`, height: `${indicatorSize}px` }"
      >
        <!-- Layer 1: warm gold glow blur -->
        <div class="ring-glow" />
        <!-- Layer 2 + 3: clip container + spinning conic-gradient -->
        <div class="ring-clip">
          <div class="ring-spin" />
        </div>
        <!-- Layer 4: inner plate, covers center leaving 2px ring -->
        <div class="ring-inner-plate" />
      </div>

      <!-- Nav buttons -->
      <button
        v-for="(item, i) in navItems"
        :key="item.id"
        :ref="(el: Element | ComponentPublicInstance | null) => { buttonRefs[i] = el as HTMLElement }"
        class="nav-btn"
        :class="{ 'nav-btn--active': activeItem === item.id }"
        :aria-label="item.label"
        @click="setActive(item.id)"
      >
        <UIcon
          :name="item.icon"
          class="nav-icon"
        />
      </button>

      <!-- Divider -->
      <div class="toolbar-divider" />

      <!-- Theme toggle -->
      <button
        class="theme-btn"
        :class="{ 'theme-btn--bounce': isThemeBouncing }"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleTheme"
      >
        <div class="theme-icon-wrap">
          <UIcon
            name="i-lucide-sun"
            class="theme-icon nav-icon"
            :class="isDark ? 'theme-icon--on' : 'theme-icon--off'"
          />
          <UIcon
            name="i-lucide-moon"
            class="theme-icon nav-icon"
            :class="!isDark ? 'theme-icon--on' : 'theme-icon--off'"
          />
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ── Wrapper ────────────────────────────────────────────────── */
.floating-toolbar-wrapper {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  pointer-events: none;
}
.floating-toolbar-wrapper > * {
  pointer-events: auto;
}

/* ── Radial ambient glow ─────────────────────────────────────── */
.ambient-glow {
  position: absolute;
  inset: -32px -48px;
  border-radius: 60px;
  background: radial-gradient(
    ellipse 110% 80% at 50% 60%,
    rgba(232, 175, 72, 0.18) 0%,
    rgba(196, 151, 70, 0.08) 40%,
    transparent 70%
  );
  pointer-events: none;
  filter: blur(8px);
  z-index: 0;
}

/* ── Toolbar pill ────────────────────────────────────────────── */
.toolbar {
  position: relative;
  display: flex;
  align-items: center;
  padding: 8px;
  background: rgba(16, 16, 16, 0.88);
  backdrop-filter: blur(28px) saturate(1.6);
  -webkit-backdrop-filter: blur(28px) saturate(1.6);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 26px;
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.7),
    0 4px 16px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.075),
    inset 0 -1px 0 rgba(0, 0, 0, 0.35);
  z-index: 1;
}

/* Film grain noise via pseudo-element */
.toolbar::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  /* inline SVG turbulence noise */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  background-size: 180px 180px;
  opacity: 0.038;
  pointer-events: none;
  mix-blend-mode: overlay;
}

/* ── Nav buttons ─────────────────────────────────────────────── */
.nav-btn {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.28);
  transition: color 0.22s ease;
  border: none;
  background: transparent;
  z-index: 3;
  flex-shrink: 0;
}
.nav-btn:hover {
  color: rgba(255, 255, 255, 0.62);
}
.nav-btn--active {
  color: rgba(255, 255, 255, 0.95);
}

.nav-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* ── Divider ─────────────────────────────────────────────────── */
.toolbar-divider {
  width: 1px;
  height: 18px;
  flex-shrink: 0;
  margin: 0 6px;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 100%
  );
}

/* ── Theme toggle ────────────────────────────────────────────── */
.theme-btn {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.3);
  border: none;
  background: transparent;
  z-index: 3;
  flex-shrink: 0;
  transition: color 0.22s ease;
}
.theme-btn:hover {
  color: rgba(255, 255, 255, 0.62);
}
.theme-btn--bounce {
  animation: theme-bounce 0.65s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes theme-bounce {
  0%   { transform: scale(1) translateY(0); }
  38%  { transform: scale(1.25) translateY(-3px); }
  68%  { transform: scale(1.04) translateY(-1px); }
  100% { transform: scale(1) translateY(0); }
}

.theme-icon-wrap {
  position: relative;
  width: 18px;
  height: 18px;
}
.theme-icon {
  position: absolute;
  top: 0;
  left: 0;
  transition: opacity 0.28s ease, transform 0.32s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.theme-icon--on {
  opacity: 1;
  transform: rotate(0deg) scale(1);
}
.theme-icon--off {
  opacity: 0;
  transform: rotate(80deg) scale(0.45);
}

/* ── Golden ring indicator ───────────────────────────────────── */
.ring-indicator {
  position: absolute;
  top: 8px; /* matches toolbar padding */
  pointer-events: none;
  z-index: 2;
  transition:
    left   0.45s cubic-bezier(0.34, 1.2, 0.64, 1),
    width  0.45s cubic-bezier(0.34, 1.2, 0.64, 1);
}

/* Layer 1 — warm gold glow behind ring */
.ring-glow {
  position: absolute;
  inset: -5px;
  border-radius: 22px;
  background: #e8af48;
  opacity: 0.15;
  filter: blur(14px);
}

/* Layer 2 — clip container (shapes the ring to the button form) */
.ring-clip {
  position: absolute;
  inset: 0;
  border-radius: 18px;
  overflow: hidden;
}

/*
  Layer 3 — spinning conic-gradient
  200% size, offset -50% so it rotates from the center.
  Color stops (360° = 2 repetitions):
    • 70% gold tones  (dark bronze #533517 → warm gold #c49746 → light gold #feeaa5)
    • 2 × white hotspots ~3% each (~11°) — studio light reflections
    • 2 × thin pink (#ffc0cb) ~1.5% between hotspots — chromatic iridescence
    • 2 × thin blue  (#87ceeb) ~1.5% between hotspots
    Remaining ~18% = deep bronze transitions / dark sections for depth
*/
.ring-spin {
  position: absolute;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  animation: spin-ring 4.5s linear infinite;
  background: conic-gradient(
    from 0deg,
    /* ——— rep 1: 0°–180° ——— */
    /* gold ramp: 0°–126° */
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
    /* pink hint: 126°–131° */
    #ffc0cb 130deg,
    #ffc0cb 132deg,
    /* white hotspot 1: 132°–143° (~11°) */
    #ffffff 135deg,
    #ffffff 145deg,
    /* blue hint: 145°–151° */
    #87ceeb 148deg,
    #87ceeb 151deg,
    /* fade back to bronze */
    #533517 158deg,
    #533517 180deg,
    /* ——— rep 2: 180°–360° ——— */
    #7a4e1f 192deg,
    #c49746 208deg,
    #e8c574 228deg,
    #feeaa5 248deg,
    #feeaa5 268deg,
    #e8c574 285deg,
    #c49746 296deg,
    #7a4e1f 304deg,
    #533517 306deg,
    /* pink hint 2 */
    #ffc0cb 310deg,
    #ffc0cb 312deg,
    /* white hotspot 2 */
    #ffffff 315deg,
    #ffffff 325deg,
    /* blue hint 2 */
    #87ceeb 328deg,
    #87ceeb 331deg,
    /* fade back */
    #533517 338deg,
    #533517 360deg
  );
}

@keyframes spin-ring {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* Layer 4 — inner plate: inset 2px exposes exactly 2px of spinning ring */
.ring-inner-plate {
  position: absolute;
  inset: 2px;
  border-radius: 16px;
  background: #101010;
}
</style>
