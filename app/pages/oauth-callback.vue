<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()

onMounted(() => {
  const connected = route.query.connected as string | undefined
  const error = route.query.error as string | undefined
  const provider = route.query.provider as string | undefined

  // Send result back to the opener window, then close the popup
  if (window.opener) {
    window.opener.postMessage(
      { oauthConnected: connected ?? null, oauthError: error ?? null, oauthProvider: provider ?? null },
      window.location.origin
    )
  }

  // Small delay so the message has time to dispatch before the window closes
  setTimeout(() => window.close(), 300)
})
</script>

<template>
  <div class="oauth-wrap">
    <div class="oauth-card">
      <div
        v-if="$route.query.error"
        class="oauth-icon oauth-icon--error"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
          /><line
            x1="15"
            y1="9"
            x2="9"
            y2="15"
          /><line
            x1="9"
            y1="9"
            x2="15"
            y2="15"
          />
        </svg>
      </div>
      <div
        v-else
        class="oauth-icon oauth-icon--success"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <p class="oauth-msg">
        {{ $route.query.error ? 'Connection failed. Closing...' : 'Connected! Closing...' }}
      </p>
    </div>
  </div>
</template>

<style scoped>
body { margin: 0; }

.oauth-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0e0e12;
}

.oauth-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.oauth-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.oauth-icon--success {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

.oauth-icon--error {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.oauth-msg {
  font-size: 13px;
  color: rgba(255,255,255,0.4);
  font-family: system-ui, sans-serif;
  margin: 0;
}
</style>
