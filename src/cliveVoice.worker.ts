import { FilesetResolver, TextToSpeech } from '@mediapipe/tasks-audio'

let tts: TextToSpeech | null = null

self.onmessage = async (event: MessageEvent) => {
  const { type, id, buffer, text } = event.data || {}
  try {
    if (type === 'init') {
      const audio = await FilesetResolver.forAudioTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@1.2.2/wasm'
      )
      const options = {
        baseOptions: { modelAssetBuffer: new Uint8Array(buffer), delegate: 'GPU' as const },
        defaultVoiceId: 'bm_george',
        defaultLocale: 'en-GB',
        speakingRate: 1.0,
        cacheDirectory: ':nocache'
      }
      try {
        tts = await TextToSpeech.createFromOptions(audio, options)
      } catch {
        tts = await TextToSpeech.createFromOptions(audio, {
          ...options,
          baseOptions: { ...options.baseOptions, delegate: 'CPU' }
        })
      }
      self.postMessage({ type: 'ready', id })
    } else if (type === 'speak' && tts) {
      const result = await tts.synthesize(String(text || ''))
      const samples = result.samples
      const audioBuffer = samples.slice().buffer as ArrayBuffer
      ;(self as unknown as { postMessage(message: unknown, transfer?: Transferable[]): void }).postMessage({ type: 'audio', id, samples: audioBuffer, sampleRateHz: result.sampleRateHz }, [audioBuffer])
    }
  } catch (error) {
    self.postMessage({ type: 'error', id, message: error instanceof Error ? error.message : String(error) })
  }
}
