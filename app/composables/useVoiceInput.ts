export function useVoiceInput() {
  const isListening = ref(false)
  const transcript = ref('')
  const interimTranscript = ref('')
  const isSupported = ref(false)
  const error = ref<string | null>(null)

  let recognition: InstanceType<typeof SpeechRecognition> | null = null

  onMounted(() => {
    if (import.meta.client) {
      const SR = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
      if (SR) {
        isSupported.value = true
        recognition = new SR()
        recognition.lang = 'en-US'
        recognition.interimResults = true
        recognition.continuous = false
        recognition.maxAlternatives = 1

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interim = ''
          let final = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (result && result.isFinal) {
              final += result[0]?.transcript ?? ''
            } else {
              interim += result?.[0]?.transcript ?? ''
            }
          }
          if (final) transcript.value += final
          interimTranscript.value = interim
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (event.error !== 'aborted') {
            error.value = event.error === 'not-allowed'
              ? 'Microphone permission denied. Please allow microphone access.'
              : `Speech recognition error: ${event.error}`
          }
          isListening.value = false
          interimTranscript.value = ''
        }

        recognition.onend = () => {
          isListening.value = false
          interimTranscript.value = ''
        }
      }
    }
  })

  function startListening() {
    if (!recognition || isListening.value) return
    error.value = null
    transcript.value = ''
    interimTranscript.value = ''
    isListening.value = true
    recognition.start()
  }

  function stopListening() {
    if (!recognition || !isListening.value) return
    recognition.stop()
    isListening.value = false
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
    recognition?.abort()
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
