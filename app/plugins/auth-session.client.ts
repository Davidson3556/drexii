export default defineNuxtPlugin({
  name: 'auth-session',
  parallel: true,
  async setup() {
    const { checkSession, isLoading } = useAuth()
    if (isLoading.value) {
      await checkSession()
    }
  }
})
