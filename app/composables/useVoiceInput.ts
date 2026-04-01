interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  [index: number]: { readonly transcript: string, readonly confidence: number }
}

interface SpeechRecognitionResultList {
  readonly length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent {
  readonly error: string
  readonly message: string
}

interface SpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

export function useVoiceInput() {
  const isListening = ref(false)
  const transcript = ref('')
  const interimTranscript = ref('')
  const isSupported = ref(false)
  const error = ref<string | null>(null)

  let recognition: SpeechRecognition | null = null
  let shouldRestart = false

  onMounted(() => {
    if (import.meta.client) {
      const w = window as unknown as Record<string, unknown>
      const SR = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as SpeechRecognitionConstructor | undefined
      if (SR) {
        isSupported.value = true
        recognition = new SR()
        recognition.lang = 'en-US'
        recognition.interimResults = true
        recognition.continuous = true
        recognition.maxAlternatives = 1

        recognition.onresult = (event: SpeechRecognitionEvent) => {
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

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          const errCode = event.error
          if (errCode === 'aborted') return
          if (errCode === 'no-speech') {
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'unknown error'
      error.value = `Could not start microphone: ${msg}`
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
    try {
      recognition?.abort()
    } catch { /* noop */ }
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
