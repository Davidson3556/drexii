export function useVoiceInput() {
  const isListening = ref(false)
  const transcript = ref('')
  const interimTranscript = ref('')
  const isSupported = ref(false)
  const error = ref<string | null>(null)

  let recognition: any = null
  let shouldRestart = false

  onMounted(() => {
    if (import.meta.client) {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SR) {
        isSupported.value = true
        recognition = new SR()
        recognition.lang = 'en-US'
        recognition.interimResults = true
        recognition.continuous = true
        recognition.maxAlternatives = 1

        recognition.onresult = (event: any) => {
          let interim = ''
          let final = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (result?.isFinal) {
              final += result[0]?.transcript ?? ''
            } else {
              interim += result?.[0]?.transcript ?? ''
            }
          }
          if (final) transcript.value += final
          interimTranscript.value = interim
        }

        recognition.onerror = (event: any) => {
          const errCode = event.error as string
          if (errCode === 'aborted') return
          if (errCode === 'no-speech') {
            // No speech detected — auto-restart if still listening
            if (shouldRestart) {
              tryRestart()
            }
            return
          }
          error.value = errCode === 'not-allowed'
            ? 'Microphone permission denied. Please allow microphone access.'
            : `Speech recognition error: ${errCode}`
          shouldRestart = false
          isListening.value = false
          interimTranscript.value = ''
        }

        recognition.onend = () => {
          interimTranscript.value = ''
          // Auto-restart if the user hasn't explicitly stopped
          if (shouldRestart) {
            tryRestart()
          } else {
            isListening.value = false
          }
        }
      }
    }
  })

  function tryRestart() {
    if (!recognition || !shouldRestart) return
    try {
      recognition.start()
    } catch {
      // Already started or other issue — give up
      shouldRestart = false
      isListening.value = false
    }
  }

  function startListening() {
    if (!recognition || isListening.value) return
    error.value = null
    transcript.value = ''
    interimTranscript.value = ''
    shouldRestart = true
    isListening.value = true
    try {
      recognition.start()
    } catch (e: any) {
      error.value = `Could not start microphone: ${e.message || 'unknown error'}`
      shouldRestart = false
      isListening.value = false
    }
  }

  function stopListening() {
    if (!recognition) return
    shouldRestart = false
    isListening.value = false
    try {
      recognition.stop()
    } catch {
      // Already stopped
    }
  }

  function toggleListening() {
    if (isListening.value) {
      stopListening()
    } else {
      startListening()
    }
  }

  function clearTranscript() {
    transcript.value = ''
    interimTranscript.value = ''
  }

  onUnmounted(() => {
    shouldRestart = false
    try { recognition?.abort() } catch { /* noop */ }
  })

  return {
    isListening: readonly(isListening),
    transcript,
    interimTranscript: readonly(interimTranscript),
    isSupported: readonly(isSupported),
    error: readonly(error),
    startListening,
    stopListening,
    toggleListening,
    clearTranscript
  }
}
