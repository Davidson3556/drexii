interface AuthState {
  user: {
    id: string
    email: string
    name?: string
    avatar_url?: string
  } | null
  isAuthenticated: boolean
  isLoading: boolean
}

export function useAuth() {
  const { $insforge: _insforge } = useNuxtApp()
  const $insforge = _insforge as import('@insforge/sdk').InsForgeClient
  const state = useState<AuthState>('auth', () => ({
    user: null,
    isAuthenticated: false,
    isLoading: true
  }))

  const user = computed(() => state.value.user)
  const isAuthenticated = computed(() => state.value.isAuthenticated)
  const isLoading = computed(() => state.value.isLoading)

  async function checkSession() {
    state.value.isLoading = true
    try {
      const { data, error } = await $insforge.auth.getCurrentUser()
      if (error || !data?.user) {
        state.value.user = null
        state.value.isAuthenticated = false
      } else {
        state.value.user = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          avatar_url: data.user.avatar_url
        }
        state.value.isAuthenticated = true
      }
    } catch (e) {
      console.error('[useAuth] Session check failed:', (e as Error).message)
      state.value.user = null
      state.value.isAuthenticated = false
    } finally {
      state.value.isLoading = false
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await $insforge.auth.signInWithPassword({ email, password })
    if (error) throw error
    state.value.user = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      avatar_url: data.user.avatar_url
    }
    state.value.isAuthenticated = true
    return data
  }

  async function signUp(email: string, password: string, name: string) {
    const { data, error } = await $insforge.auth.signUp({ email, password, name })
    if (error) throw error
    return data
  }

  async function verifyEmail(email: string, otp: string) {
    const { data, error } = await $insforge.auth.verifyEmail({ email, otp })
    if (error) throw error
    state.value.user = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      avatar_url: data.user.avatar_url
    }
    state.value.isAuthenticated = true
    return data
  }

  async function resendVerification(email: string) {
    await $insforge.auth.resendVerificationEmail({ email })
  }

  async function signInWithOAuth(provider: string) {
    await $insforge.auth.signInWithOAuth({
      provider,
      redirectTo: `${window.location.origin}/chat`
    })
  }

  async function signOut() {
    await $insforge.auth.signOut()
    state.value.user = null
    state.value.isAuthenticated = false
  }

  async function sendPasswordReset(email: string) {
    const { error } = await $insforge.auth.sendResetPasswordEmail({ email })
    if (error) throw error
  }

  async function exchangeResetToken(email: string, code: string) {
    const { data, error } = await $insforge.auth.exchangeResetPasswordToken({ email, code })
    if (error) throw error
    return data
  }

  async function resetPassword(newPassword: string, otp: string) {
    const { error } = await $insforge.auth.resetPassword({ newPassword, otp })
    if (error) throw error
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    checkSession,
    signIn,
    signUp,
    verifyEmail,
    resendVerification,
    signInWithOAuth,
    signOut,
    sendPasswordReset,
    exchangeResetToken,
    resetPassword
  }
}
