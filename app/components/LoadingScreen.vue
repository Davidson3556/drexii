<script setup lang="ts">
const props = withDefaults(defineProps<{
  message?: string
  variant?: 'page' | 'inline'
}>(), {
  message: 'Loading…',
  variant: 'inline'
})
</script>

<template>
  <div
    class="loading-screen"
    :class="`loading-screen--${props.variant}`"
  >
    <div class="loading-orb">
      <div class="orb-glow" />
      <div class="orb-clip">
        <div class="orb-spin" />
      </div>
      <div class="orb-plate">
        <img
          src="/logo.png"
          alt=""
          class="w-7 h-7 object-cover rounded-lg opacity-80"
        >
      </div>
    </div>
    <p class="loading-text">
      {{ message }}
    </p>
  </div>
</template>

<style scoped>
.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.loading-screen--page {
  min-height: 100dvh;
  width: 100%;
}

.loading-screen--inline {
  padding: 48px 0;
}

.loading-orb {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 9999px;
}

.orb-glow {
  position: absolute;
  inset: -8px;
  border-radius: 9999px;
  background: #e8af48;
  opacity: 0.2;
  filter: blur(16px);
  animation: pulse-glow 2.6s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.35; }
}

.orb-clip {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  overflow: hidden;
}

.orb-spin {
  position: absolute;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  animation: spin-orb 2.2s linear infinite;
  background: conic-gradient(
    from 0deg,
    #533517 0deg,
    #7a4e1f 20deg,
    #c49746 55deg,
    #e8c574 90deg,
    #feeaa5 120deg,
    #ffffff 140deg,
    #feeaa5 160deg,
    #e8c574 195deg,
    #c49746 230deg,
    #7a4e1f 275deg,
    #533517 330deg,
    #533517 360deg
  );
}

@keyframes spin-orb {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.orb-plate {
  position: absolute;
  inset: 2.5px;
  border-radius: 9999px;
  background: rgba(14, 14, 16, 0.97);
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-text {
  font-size: 12.5px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.42);
  animation: pulse-text 2.2s ease-in-out infinite;
}

@keyframes pulse-text {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

:global(html:not(.dark)) .orb-plate {
  background: rgba(250, 249, 247, 0.97);
}
:global(html:not(.dark)) .loading-text {
  color: rgba(12, 12, 14, 0.5);
}
</style>
