<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { isFallback } = useModelStatus()
const { signOut, user, sendPasswordReset } = useAuth()

// ── User dropdown ─────────────────────────────────────────────
const userDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function toggleDropdown() {
  userDropdownOpen.value = !userDropdownOpen.value
}

function closeDropdown() {
  userDropdownOpen.value = false
}

// Close dropdown when clicking outside (registered in onMounted)
function onClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    userDropdownOpen.value = false
  }
}

async function logout() {
  closeDropdown()
  await signOut()
  await router.push('/login')
}

// ── Settings modal ────────────────────────────────────────────
const showSettings = ref(false)
const settingsTab = ref<'password' | 'danger'>('password')

const passwordLoading = ref(false)
const passwordSuccess = ref('')
const passwordError = ref('')

async function handleChangePassword() {
  passwordError.value = ''
  passwordSuccess.value = ''
  passwordLoading.value = true
  try {
    const email = user.value?.email
    if (!email) throw new Error('No email found for current user.')
    await sendPasswordReset(email)
    passwordSuccess.value = 'A password reset link has been sent to your email. Please check your inbox to complete the change.'
  } catch (err) {
    passwordError.value = (err as Error).message || 'Failed to initiate password change.'
  } finally {
    passwordLoading.value = false
  }
}

// Delete account
const deleteConfirmText = ref('')
const deleteLoading = ref(false)
const deleteError = ref('')
const showDeleteConfirm = ref(false)

async function handleDeleteAccount() {
  if (deleteConfirmText.value !== 'DELETE') {
    deleteError.value = 'Please type DELETE to confirm.'
    return
  }
  deleteLoading.value = true
  deleteError.value = ''
  try {
    // Call API to delete user data
    const uid = user.value?.id
    const headers: Record<string, string> = {}
    if (uid) headers['x-user-id'] = uid
    await $fetch('/api/auth/delete-account', {
      method: 'POST',
      headers,
      body: { userId: uid }
    })
    await signOut()
    await router.push('/login')
  } catch (err) {
    deleteError.value = (err as Error).message || 'Failed to delete account. Please contact support.'
  } finally {
    deleteLoading.value = false
  }
}

function openSettings() {
  closeDropdown()
  settingsTab.value = 'password'
  passwordSuccess.value = ''
  passwordError.value = ''
  deleteError.value = ''
  showDeleteConfirm.value = false
  deleteConfirmText.value = ''
  showSettings.value = true
}

function closeSettings() {
  showSettings.value = false
}

const navLinks = [
  { id: 'how-it-works', label: 'How It Works', section: 'about', to: null },
  { id: 'features', label: 'Features', section: 'features', to: null },
  { id: 'try-drexii', label: 'Try Drexii', section: null, to: '/chat' },
  { id: 'integrations', label: 'Integrations', section: null, to: '/integrations' },
  { id: 'workflows', label: 'Workflows', section: null, to: '/workflows' },
  { id: 'automations', label: 'Automations', section: null, to: '/automations' },
  { id: 'memory', label: 'Memory', section: null, to: '/memory' },
  { id: 'docs', label: 'Docs', section: null, to: '/docs' }
]

const activeItem = ref(
  route.path === '/chat'
    ? 'try-drexii'
    : route.path === '/integrations'
      ? 'integrations'
      : route.path === '/workflows'
        ? 'workflows'
        : route.path === '/automations'
          ? 'automations'
          : route.path === '/memory'
            ? 'memory'
            : route.path === '/docs'
              ? 'docs'
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
  activeItem.value = path === '/chat'
    ? 'try-drexii'
    : path === '/integrations'
      ? 'integrations'
      : path === '/workflows'
        ? 'workflows'
        : path === '/automations'
          ? 'automations'
          : path === '/memory'
            ? 'memory'
            : 'how-it-works'
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
  window.addEventListener('click', onClickOutside)
  nextTick(updatePill)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('click', onClickOutside)
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
const isOnApp = computed(() => ['/chat', '/integrations', '/workflows', '/automations', '/memory', '/docs'].includes(route.path))
</script>

<template>
  <!-- ── Fixed header ────────────────────────────────────────── -->
  <header class="app-header">
    <!-- Logo -->
    <NuxtLink
      to="/"
      class="nav-logo"
    >
      <div class="logo-mark">
        <img
          src="/logo.png"
          alt="Drexii"
          class="w-full h-full object-cover"
        >
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
        :ref="(el: HTMLElement | null) => { pillRefs[i] = el }"
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

      <!-- App pages: model status + settings -->
      <template v-if="isOnApp">
        <div
          v-if="isFallback"
          class="status-pill status-pill--fallback"
          title="Claude is temporarily unavailable. Gemini is handling your requests."
        >
          <span class="status-dot status-dot--amber" />
          <span>Backup AI active</span>
        </div>
        <div
          v-else
          class="status-pill"
        >
          <span class="status-dot status-dot--green" />
          <span>AI Online</span>
        </div>
        <!-- User avatar dropdown -->
        <div ref="dropdownRef" class="user-dropdown-wrapper">
          <button
            class="user-avatar-btn"
            :title="`Signed in as ${user?.email ?? ''}`"
            @click.stop="toggleDropdown"
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

          <!-- Dropdown menu -->
          <Transition name="dropdown">
            <div v-if="userDropdownOpen" class="user-dropdown">
              <!-- User info header -->
              <div class="dropdown-header">
                <div class="dropdown-avatar">
                  <img
                    v-if="user?.avatar_url"
                    :src="user.avatar_url"
                    :alt="user?.name ?? 'User'"
                    class="w-full h-full object-cover rounded-full"
                  >
                  <span v-else class="text-sm font-semibold text-white/70">
                    {{ (user?.name ?? user?.email ?? '?').charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div class="dropdown-user-info">
                  <span class="dropdown-user-name">{{ user?.name || 'User' }}</span>
                  <span class="dropdown-user-email">{{ user?.email }}</span>
                </div>
              </div>

              <div class="dropdown-divider" />

              <!-- Menu items -->
              <button class="dropdown-item" @click="openSettings">
                <UIcon name="i-lucide-settings" class="w-4 h-4" />
                <span>Settings</span>
              </button>

              <div class="dropdown-divider" />

              <button class="dropdown-item dropdown-item--danger" @click="logout">
                <UIcon name="i-lucide-log-out" class="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          </Transition>
        </div>
      </template>
    </div>

    <!-- Mobile right: model dot + burger -->
    <div class="header-right header-right--mobile">
      <span
        v-if="isOnApp"
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
        <NuxtLink
          to="/"
          class="nav-logo"
          @click="mobileOpen = false"
        >
          <div class="logo-mark">
            <img
              src="/logo.png"
              alt="Drexii"
              class="w-full h-full object-cover"
            >
          </div>
          <span class="logo-text">Drexii</span>
        </NuxtLink>
        <button
          class="mob-close"
          aria-label="Close menu"
          @click="mobileOpen = false"
        >
          <UIcon
            name="i-lucide-x"
            class="w-5 h-5"
          />
        </button>
      </div>

      <!-- Nav items with vertical ring indicator -->
      <nav
        ref="mobContainerRef"
        class="mob-nav"
      >
        <!-- Vertical ring indicator (4 layers) -->
        <div
          class="mob-ring"
          :style="{
            top: `${mobTop}px`,
            width: `${mobW}px`,
            height: `${mobH}px`
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
          :ref="(el: HTMLElement | null) => { mobRefs[i] = el }"
          class="mob-link"
          :class="{ 'mob-link--active': activeItem === link.id }"
          @click="navigate(link)"
        >
          {{ link.label }}
        </button>
      </nav>

      <!-- Bottom CTA -->
      <div class="mob-footer">
        <div class="mob-footer-row">
          <NuxtLink
            to="/chat"
            class="mob-cta"
            @click="mobileOpen = false"
          >
            Start Chatting
            <UIcon
              name="i-lucide-arrow-right"
              class="w-4 h-4"
            />
          </NuxtLink>
        </div>
      </div>
    </div>
  </Transition>

  <!-- ── Settings modal ──────────────────────────────────── -->
  <Transition name="modal">
    <div
      v-if="showSettings"
      class="settings-overlay"
      @click.self="closeSettings"
    >
      <div class="settings-modal">
        <!-- Modal header -->
        <div class="settings-header">
          <h2 class="settings-title">Settings</h2>
          <button class="settings-close" @click="closeSettings">
            <UIcon name="i-lucide-x" class="w-5 h-5" />
          </button>
        </div>

        <!-- Tabs -->
        <div class="settings-tabs">
          <button
            class="settings-tab"
            :class="{ 'settings-tab--active': settingsTab === 'password' }"
            @click="settingsTab = 'password'"
          >
            <UIcon name="i-lucide-lock" class="w-4 h-4" />
            Change Password
          </button>
          <button
            class="settings-tab"
            :class="{ 'settings-tab--active': settingsTab === 'danger' }"
            @click="settingsTab = 'danger'"
          >
            <UIcon name="i-lucide-alert-triangle" class="w-4 h-4" />
            Danger Zone
          </button>
        </div>

        <!-- Tab content -->
        <div class="settings-body">
          <!-- Change Password tab -->
          <div v-if="settingsTab === 'password'" class="settings-section">
            <p class="settings-desc">
              For security, we'll send a password reset link to your email address.
              Click the link in the email to set a new password.
            </p>

            <div v-if="passwordSuccess" class="settings-alert settings-alert--success">
              <UIcon name="i-lucide-check-circle" class="w-4 h-4 shrink-0" />
              <span>{{ passwordSuccess }}</span>
            </div>
            <div v-if="passwordError" class="settings-alert settings-alert--error">
              <UIcon name="i-lucide-alert-circle" class="w-4 h-4 shrink-0" />
              <span>{{ passwordError }}</span>
            </div>

            <button
              class="settings-btn settings-btn--primary"
              :disabled="passwordLoading"
              @click="handleChangePassword"
            >
              <UIcon v-if="passwordLoading" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
              <UIcon v-else name="i-lucide-mail" class="w-4 h-4" />
              {{ passwordLoading ? 'Sending…' : 'Send Reset Link' }}
            </button>
          </div>

          <!-- Danger Zone tab -->
          <div v-if="settingsTab === 'danger'" class="settings-section">
            <div class="danger-card">
              <div class="danger-card-header">
                <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-red-400" />
                <h3 class="danger-card-title">Delete Account</h3>
              </div>
              <p class="danger-card-desc">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>

              <div v-if="!showDeleteConfirm">
                <button
                  class="settings-btn settings-btn--danger"
                  @click="showDeleteConfirm = true"
                >
                  <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                  Delete My Account
                </button>
              </div>

              <div v-else class="delete-confirm">
                <p class="delete-confirm-label">
                  Type <strong>DELETE</strong> to confirm:
                </p>
                <input
                  v-model="deleteConfirmText"
                  class="settings-input"
                  placeholder="Type DELETE"
                  autocomplete="off"
                >
                <div v-if="deleteError" class="settings-alert settings-alert--error mt-3">
                  <UIcon name="i-lucide-alert-circle" class="w-4 h-4 shrink-0" />
                  <span>{{ deleteError }}</span>
                </div>
                <div class="delete-confirm-actions">
                  <button
                    class="settings-btn settings-btn--ghost"
                    @click="showDeleteConfirm = false; deleteConfirmText = ''; deleteError = ''"
                  >
                    Cancel
                  </button>
                  <button
                    class="settings-btn settings-btn--danger"
                    :disabled="deleteLoading || deleteConfirmText !== 'DELETE'"
                    @click="handleDeleteAccount"
                  >
                    <UIcon v-if="deleteLoading" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
                    {{ deleteLoading ? 'Deleting…' : 'Permanently Delete' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
  background: var(--nav-bg, rgba(10, 10, 10, 0.6));
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border-bottom: 1px solid var(--nav-border, rgba(255, 255, 255, 0.05));
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
  background: var(--nav-pill-bg, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--nav-pill-border, rgba(255, 255, 255, 0.06));
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
  background: var(--mob-overlay-bg, rgba(9, 9, 11, 0.97));
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
.mob-footer-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  justify-content: center;
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
  background: var(--nav-plate-bg, rgba(14, 14, 16, 0.96));
}

/* Mobile: plate matches overlay bg */
.mob-ring .gold-plate {
  background: var(--mob-plate-bg, rgba(9, 9, 11, 0.97));
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

/* ── User dropdown ─────────────────────────────────────────── */
.user-dropdown-wrapper {
  position: relative;
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 260px;
  background: rgba(18, 18, 22, 0.98);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.04) inset;
  z-index: 100;
  overflow: hidden;
  padding: 6px;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px 8px;
}

.dropdown-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.dropdown-user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.dropdown-user-name {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-user-email {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.38);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 4px 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.65);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.92);
}

.dropdown-item--danger {
  color: rgba(239, 68, 68, 0.8);
}

.dropdown-item--danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: rgba(239, 68, 68, 1);
}

/* Dropdown transition */
.dropdown-enter-active {
  transition: opacity 0.18s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.dropdown-leave-active {
  transition: opacity 0.12s ease, transform 0.14s ease-in;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.96);
}

/* ── Settings modal ────────────────────────────────────────── */
.settings-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.settings-modal {
  width: 95vw;
  max-width: 480px;
  max-height: 85vh;
  background: rgba(18, 18, 22, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.settings-title {
  font-size: 18px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
  letter-spacing: -0.02em;
}

.settings-close {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.4);
  transition: background 0.15s ease, color 0.15s ease;
}

.settings-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.settings-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 24px 0;
}

.settings-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.settings-tab:hover {
  color: rgba(255, 255, 255, 0.65);
  background: rgba(255, 255, 255, 0.04);
}

.settings-tab--active {
  color: rgba(255, 255, 255, 0.92);
  background: rgba(255, 255, 255, 0.08);
}

.settings-body {
  padding: 20px 24px 24px;
  overflow-y: auto;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-desc {
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.45);
}

.settings-input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  outline: none;
  transition: border-color 0.15s ease;
}

.settings-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.settings-input:focus {
  border-color: rgba(232, 194, 116, 0.4);
}

.settings-alert {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.4;
}

.settings-alert--success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.15);
  color: rgba(134, 239, 172, 0.9);
}

.settings-alert--error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.15);
  color: rgba(252, 165, 165, 0.9);
}

.settings-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease, transform 0.1s ease;
}

.settings-btn:active {
  transform: scale(0.98);
}

.settings-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.settings-btn--primary {
  background: linear-gradient(135deg, #c49746, #e8c574);
  color: #000;
}

.settings-btn--primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #d4a74f, #f0d080);
}

.settings-btn--danger {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.settings-btn--danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.25);
}

.settings-btn--ghost {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
}

.settings-btn--ghost:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
}

/* Danger zone */
.danger-card {
  border: 1px solid rgba(239, 68, 68, 0.15);
  border-radius: 14px;
  padding: 20px;
  background: rgba(239, 68, 68, 0.04);
}

.danger-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.danger-card-title {
  font-size: 15px;
  font-weight: 700;
  color: rgba(239, 68, 68, 0.9);
}

.danger-card-desc {
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 16px;
}

.delete-confirm {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.delete-confirm-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
}

.delete-confirm-label strong {
  color: rgba(239, 68, 68, 0.9);
  font-weight: 700;
}

.delete-confirm-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.mt-3 {
  margin-top: 12px;
}

/* Modal transition */
.modal-enter-active {
  transition: opacity 0.22s ease;
}
.modal-enter-active .settings-modal {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease;
}
.modal-leave-active {
  transition: opacity 0.18s ease;
}
.modal-leave-active .settings-modal {
  transition: transform 0.18s ease-in, opacity 0.16s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .settings-modal {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}
.modal-leave-to .settings-modal {
  transform: scale(0.97) translateY(6px);
  opacity: 0;
}

/* Animate spin for loader */
@keyframes spin-loader {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin-loader 1s linear infinite;
}
</style>
