<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const { signIn, signUp, verifyEmail, resendVerification, signInWithOAuth, sendPasswordReset, exchangeResetToken, resetPassword } = useAuth()

// State
const mode = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const name = ref('')
const error = ref('')
const isLoading = ref(false)
const showPassword = ref(false)

// Verification state
const needsVerification = ref(false)
const otpCode = ref('')
const verificationEmail = ref('')

// Forgot password state
const resetStep = ref<'idle' | 'email' | 'code' | 'newpass'>('idle')
const resetEmail = ref('')
const resetCode = ref('')
const resetToken = ref('')
const newPassword = ref('')
const newPasswordConfirm = ref('')

// OAuth providers enabled on this InsForge project
const oauthProviders = [
  { id: 'google', label: 'Google', icon: 'i-simple-icons-google' },
  { id: 'github', label: 'GitHub', icon: 'i-simple-icons-github' }
]

async function handleSignIn() {
  error.value = ''
  if (!email.value.trim() || !password.value) {
    error.value = 'Please enter your email and password.'
    return
  }

  isLoading.value = true
  try {
    await signIn(email.value.trim(), password.value)
    const redirect = route.query.redirect as string | undefined
    await router.push(redirect || '/chat')
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number }
    if (e.statusCode === 403) {
      error.value = 'Email not verified. Please sign up again to receive a new code.'
    } else {
      error.value = e.message || 'Invalid email or password.'
    }
    password.value = ''
  } finally {
    isLoading.value = false
  }
}

async function handleSignUp() {
  error.value = ''
  if (!name.value.trim() || !email.value.trim() || !password.value) {
    error.value = 'Please fill in all fields.'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }

  isLoading.value = true
  try {
    const data = await signUp(email.value.trim(), password.value, name.value.trim())

    if (data?.requireEmailVerification) {
      // Show OTP verification step on the SAME page
      needsVerification.value = true
      verificationEmail.value = email.value.trim()
    } else if (data?.accessToken) {
      // No verification needed — already signed in
      const redirect = route.query.redirect as string | undefined
      await router.push(redirect || '/chat')
    }
  } catch (err: unknown) {
    const e = err as { message?: string }
    error.value = e.message || 'Sign up failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}

async function handleVerifyOtp() {
  error.value = ''
  if (otpCode.value.length !== 6) {
    error.value = 'Please enter the 6-digit code from your email.'
    return
  }

  isLoading.value = true
  try {
    await verifyEmail(verificationEmail.value, otpCode.value)
    const redirect = route.query.redirect as string | undefined
    await router.push(redirect || '/chat')
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number }
    if (e.statusCode === 400) {
      error.value = 'Invalid or expired code. Please try again.'
    } else {
      error.value = e.message || 'Verification failed.'
    }
    otpCode.value = ''
  } finally {
    isLoading.value = false
  }
}

async function handleResendCode() {
  error.value = ''
  try {
    await resendVerification(verificationEmail.value)
    error.value = '' // Clear any previous error
  } catch {
    error.value = 'Failed to resend code. Please try again.'
  }
}

async function handleOAuth(provider: string) {
  try {
    await signInWithOAuth(provider)
  } catch (err: unknown) {
    const e = err as { message?: string }
    error.value = e.message || `Failed to sign in with ${provider}.`
  }
}

async function handleForgotPasswordSend() {
  error.value = ''
  if (!resetEmail.value.trim()) {
    error.value = 'Please enter your email.'
    return
  }
  isLoading.value = true
  try {
    await sendPasswordReset(resetEmail.value.trim())
    resetStep.value = 'code'
  } catch (err: unknown) {
    error.value = (err as { message?: string }).message || 'Failed to send reset email.'
  } finally {
    isLoading.value = false
  }
}

async function handleForgotPasswordCode() {
  error.value = ''
  if (resetCode.value.length !== 6) {
    error.value = 'Please enter the 6-digit code.'
    return
  }
  isLoading.value = true
  try {
    const data = await exchangeResetToken(resetEmail.value.trim(), resetCode.value)
    resetToken.value = data?.token ?? ''
    resetStep.value = 'newpass'
  } catch (err: unknown) {
    error.value = (err as { message?: string }).message || 'Invalid or expired code.'
    resetCode.value = ''
  } finally {
    isLoading.value = false
  }
}

async function handleForgotPasswordReset() {
  error.value = ''
  if (newPassword.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }
  if (newPassword.value !== newPasswordConfirm.value) {
    error.value = 'Passwords do not match.'
    return
  }
  isLoading.value = true
  try {
    await resetPassword(newPassword.value, resetToken.value)
    resetStep.value = 'idle'
    mode.value = 'signin'
    error.value = ''
    newPassword.value = ''
    newPasswordConfirm.value = ''
  } catch (err: unknown) {
    error.value = (err as { message?: string }).message || 'Failed to reset password.'
  } finally {
    isLoading.value = false
  }
}

function handleSubmit() {
  if (resetStep.value === 'email') {
    handleForgotPasswordSend()
    return
  }
  if (resetStep.value === 'code') {
    handleForgotPasswordCode()
    return
  }
  if (resetStep.value === 'newpass') {
    handleForgotPasswordReset()
    return
  }
  if (needsVerification.value) {
    handleVerifyOtp()
  } else if (mode.value === 'signin') {
    handleSignIn()
  } else {
    handleSignUp()
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
          {{
              resetStep !== 'idle' ? 'Reset your password'
                : needsVerification ? 'Verify your email'
                  : mode === 'signin' ? 'Sign in to continue'
                    : 'Create your account'
            }}
        </p>
      </div>

      <!-- Card -->
      <form class="login-card p-6 space-y-4" @submit.prevent="handleSubmit">
        <!-- OTP Verification View -->
        <!-- Forgot Password Flow -->
        <template v-if="resetStep !== 'idle'">
          <!-- Step 1: Enter email -->
          <template v-if="resetStep === 'email'">
            <p class="text-sm text-white/50 text-center">
              Enter your email and we'll send a reset code.
            </p>
            <div>
              <label class="block text-xs text-white/40 mb-1.5">Email</label>
              <input
                v-model="resetEmail"
                type="email"
                autocomplete="email"
                placeholder="you@example.com"
                class="login-input"
                :disabled="isLoading"
                @keyup.enter="handleSubmit"
              >
            </div>
          </template>

          <!-- Step 2: Enter code -->
          <template v-else-if="resetStep === 'code'">
            <p class="text-sm text-white/50 text-center">
              We sent a 6-digit code to <span class="text-white/70 font-medium">{{ resetEmail }}</span>
            </p>
            <div>
              <label class="block text-xs text-white/40 mb-1.5">Reset code</label>
              <input
                v-model="resetCode"
                type="text"
                maxlength="6"
                placeholder="000000"
                class="login-input text-center text-lg tracking-[0.3em] font-mono"
                :disabled="isLoading"
                @keyup.enter="handleSubmit"
              >
            </div>
          </template>

          <!-- Step 3: New password -->
          <template v-else-if="resetStep === 'newpass'">
            <div>
              <label class="block text-xs text-white/40 mb-1.5">New password</label>
              <input
                v-model="newPassword"
                type="password"
                placeholder="••••••••"
                class="login-input"
                :disabled="isLoading"
                @keyup.enter="handleSubmit"
              >
            </div>
            <div>
              <label class="block text-xs text-white/40 mb-1.5">Confirm password</label>
              <input
                v-model="newPasswordConfirm"
                type="password"
                placeholder="••••••••"
                class="login-input"
                :disabled="isLoading"
                @keyup.enter="handleSubmit"
              >
            </div>
          </template>

          <button
            class="w-full text-xs text-white/30 hover:text-white/50 transition-colors text-center"
            type="button"
            @click="resetStep = 'idle'"
          >
            Back to sign in
          </button>
        </template>

        <template v-else-if="needsVerification">
          <p class="text-sm text-white/50 text-center">
            We sent a 6-digit code to <span class="text-white/70 font-medium">{{ verificationEmail }}</span>
          </p>

          <div>
            <label class="block text-xs text-white/40 mb-1.5">Verification code</label>
            <input
              v-model="otpCode"
              type="text"
              maxlength="6"
              placeholder="000000"
              class="login-input text-center text-lg tracking-[0.3em] font-mono"
              :disabled="isLoading"
              @keyup.enter="handleSubmit"
            >
          </div>

          <!-- Resend -->
          <button
            class="w-full text-xs text-white/30 hover:text-white/50 transition-colors text-center"
            @click="handleResendCode"
          >
            Didn't receive a code? Resend
          </button>
        </template>

        <!-- Sign In / Sign Up Form -->
        <template v-else>
          <!-- Mode Toggle -->
          <div class="flex rounded-xl bg-white/5 p-0.5 mb-2">
            <button
              :class="['flex-1 py-2 text-xs font-medium rounded-lg transition-all', mode === 'signin' ? 'bg-white/10 text-white/80' : 'text-white/30 hover:text-white/50']"
              @click="mode = 'signin'; error = ''"
            >
              Sign in
            </button>
            <button
              :class="['flex-1 py-2 text-xs font-medium rounded-lg transition-all', mode === 'signup' ? 'bg-white/10 text-white/80' : 'text-white/30 hover:text-white/50']"
              @click="mode = 'signup'; error = ''"
            >
              Sign up
            </button>
          </div>

          <!-- Name (sign up only) -->
          <div v-if="mode === 'signup'">
            <label class="block text-xs text-white/40 mb-1.5">Name</label>
            <input
              v-model="name"
              type="text"
              autocomplete="name"
              placeholder="John Doe"
              class="login-input"
              :disabled="isLoading"
              @keyup.enter="handleSubmit"
            >
          </div>

          <!-- Email -->
          <div>
            <label class="block text-xs text-white/40 mb-1.5">Email</label>
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              class="login-input"
              :disabled="isLoading"
              @keyup.enter="handleSubmit"
            >
          </div>

          <!-- Password -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs text-white/40">Password</label>
              <button
                v-if="mode === 'signin'"
                type="button"
                class="text-xs text-white/30 hover:text-amber-400 transition-colors"
                @click="resetStep = 'email'; resetEmail = email; error = ''"
              >
                Forgot password?
              </button>
            </div>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                class="login-input pr-10"
                :disabled="isLoading"
                @keyup.enter="handleSubmit"
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

          <!-- OAuth -->
          <div class="pt-2 space-y-2">
            <div class="flex items-center gap-3 text-white/20 text-xs">
              <div class="flex-1 border-t border-white/10" />
              or continue with
              <div class="flex-1 border-t border-white/10" />
            </div>
            <div class="flex gap-2">
              <button
                v-for="provider in oauthProviders"
                :key="provider.id"
                class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 transition-colors text-white/60 text-xs font-medium"
                @click="handleOAuth(provider.id)"
              >
                <UIcon :name="provider.icon" class="w-4 h-4" />
                {{ provider.label }}
              </button>
            </div>
          </div>
        </template>

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
          type="submit"
          class="w-full py-2.5 rounded-xl bg-amber-500/80 hover:bg-amber-500 text-white text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
          :disabled="isLoading"
        >
          <UIcon
            v-if="isLoading"
            name="i-lucide-loader-2"
            class="w-4 h-4 animate-spin"
          />
          {{
            isLoading
              ? (resetStep === 'email' ? 'Sending…'
                : resetStep === 'code' ? 'Verifying…'
                  : resetStep === 'newpass' ? 'Resetting…'
                    : needsVerification ? 'Verifying…'
                      : mode === 'signin' ? 'Signing in…'
                        : 'Creating account…')
              : (resetStep === 'email' ? 'Send reset code'
                : resetStep === 'code' ? 'Verify code'
                  : resetStep === 'newpass' ? 'Set new password'
                    : needsVerification ? 'Verify'
                      : mode === 'signin' ? 'Sign in'
                        : 'Create account')
          }}
        </button>
      </form>
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
