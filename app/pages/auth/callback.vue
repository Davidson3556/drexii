<script setup lang="ts">
definePageMeta({ layout: false })

const router = useRouter()
const { checkSession, isAuthenticated } = useAuth()

onMounted(async () => {
  try {
    // getCurrentUser() internally awaits the PKCE code exchange
    await checkSession()
    await router.replace(isAuthenticated.value ? '/chat' : '/login?error=oauth_failed')
  } catch {
    await router.replace('/login?error=oauth_failed')
  }
})
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center"
    style="background: var(--color-drexii-bg);"
  >
    <div class="flex flex-col items-center gap-3">
      <div class="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
        <UIcon
          name="i-lucide-loader-2"
          class="w-5 h-5 text-amber-400 animate-spin"
        />
      </div>
      <p class="text-sm text-white/40">
        Signing you in…
      </p>
    </div>
  </div>
</template>
