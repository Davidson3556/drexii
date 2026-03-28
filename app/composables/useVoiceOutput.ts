export function useVoiceOutput() {
  const isSpeaking = ref(false)
  const isEnabled = ref(false)
  const isSupported = ref(false)
  const selectedVoice = ref<SpeechSynthesisVoice | null>(null)
  const availableVoices = ref<SpeechSynthesisVoice[]>([])

  let currentUtterance: SpeechSynthesisUtterance | null = null

  onMounted(() => {
    if (import.meta.client && 'speechSynthesis' in window) {
      isSupported.value = true

      function loadVoices() {
        availableVoices.value = window.speechSynthesis.getVoices()
        // Default to a natural English voice if available
        selectedVoice.value = availableVoices.value.find(v =>
          v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Premium') || v.localService)
        ) ?? availableVoices.value.find(v => v.lang.startsWith('en')) ?? null
      }

      loadVoices()
      // Voices load async in some browsers
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  })

  function speak(text: string, onEnd?: () => void) {
    if (!isSupported.value || !isEnabled.value || !text.trim()) return

    // Cancel any ongoing speech
    stop()

    // Strip markdown syntax for cleaner TTS
    const clean = text
      .replace(/```[\s\S]*?```/g, 'code block omitted')
      .replace(/`[^`]+`/g, match => match.slice(1, -1))
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .trim()

    if (!clean) return

    currentUtterance = new SpeechSynthesisUtterance(clean)
    currentUtterance.rate = 1.0
    currentUtterance.pitch = 1.0
    currentUtterance.volume = 1.0
    if (selectedVoice.value) currentUtterance.voice = selectedVoice.value

    currentUtterance.onstart = () => { isSpeaking.value = true }
    currentUtterance.onend = () => {
      isSpeaking.value = false
      onEnd?.()
    }
    currentUtterance.onerror = () => { isSpeaking.value = false }

    window.speechSynthesis.speak(currentUtterance)
  }

  function stop() {
    if (!isSupported.value) return
    window.speechSynthesis.cancel()
    isSpeaking.value = false
    currentUtterance = null
  }

  function toggle() {
    isEnabled.value = !isEnabled.value
    if (!isEnabled.value) stop()
  }

  onUnmounted(() => {
    stop()
  })

  return {
    isSpeaking: readonly(isSpeaking),
    isEnabled,
    isSupported: readonly(isSupported),
    availableVoices: readonly(availableVoices),
    selectedVoice,
    speak,
    stop,
    toggle
  }
}
