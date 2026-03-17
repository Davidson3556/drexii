<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()

const username = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)
const showPassword = ref(false)

async function handleLogin() {
  error.value = ''
  if (!username.value.trim() || !password.value) {
    error.value = 'Please enter your username and password.'
    return
  }

  isLoading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username: username.value.trim(), password: password.value }
    })
    const redirect = route.query.redirect as string | undefined
    await router.push(redirect || '/chat')
  } catch {
    error.value = 'Invalid username or password.'
    password.value = ''
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center px-6"
    style="background: var(--color-drexii-bg);"
  >
    <!-- Background radial glow -->
    <div
      class="pointer-events-none fixed inset-0"
      style="background: radial-gradient(ellipse 60% 50% at 50% 40%, rgba(232,175,72,0.06) 0%, transparent 70%);"
    />

    <div class="w-full max-w-sm relative">
      <!-- Logo -->
      <div class="flex flex-col items-center mb-8">
        <div class="w-12 h-12 rounded-2xl overflow-hidden mb-3 border border-white/10">
          <img src="/logo.png" alt="Drexii" class="w-full h-full object-cover">
        </div>
        <h1 class="text-xl font-semibold text-white/90 tracking-tight">
          Drexii
        </h1>
        <p class="text-sm text-white/35 mt-1">
          Sign in to continue
        </p>
      </div>

      <!-- Card -->
      <div class="login-card p-6 space-y-4">
        <!-- Username -->
        <div>
          <label class="block text-xs text-white/40 mb-1.5">Username</label>
          <input
            v-model="username"
            type="text"
            autocomplete="username"
            placeholder="admin"
            class="login-input"
            :disabled="isLoading"
            @keyup.enter="handleLogin"
          >
        </div>

        <!-- Password -->
        <div>
          <label class="block text-xs text-white/40 mb-1.5">Password</label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="••••••••"
              class="login-input pr-10"
              :disabled="isLoading"
              @keyup.enter="handleLogin"
            >
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
              @click="showPassword = !showPassword"
            >
              <UIcon
                :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                class="w-4 h-4"
              />
            </button>
          </div>
        </div>

        <!-- Error -->
        <p
          v-if="error"
          class="text-xs text-red-400 flex items-center gap-1.5"
        >
          <UIcon name="i-lucide-circle-alert" class="w-3.5 h-3.5 shrink-0" />
          {{ error }}
        </p>

        <!-- Submit -->
        <button
          class="w-full py-2.5 rounded-xl bg-amber-500/80 hover:bg-amber-500 text-white text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
          :disabled="isLoading"
          @click="handleLogin"
        >
          <UIcon
            v-if="isLoading"
            name="i-lucide-loader-2"
            class="w-4 h-4 animate-spin"
          />
          {{ isLoading ? 'Signing in…' : 'Sign in' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  backdrop-filter: blur(20px);
}

.login-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  outline: none;
  transition: border-color 0.18s ease;
}
.login-input::placeholder {
  color: rgba(255, 255, 255, 0.2);
}
.login-input:focus {
  border-color: rgba(232, 175, 72, 0.4);
}
.login-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
