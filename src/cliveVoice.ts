const MODEL_URL = 'https://huggingface.co/litert-community/Kokoro-82M/resolve/main/kokoro_int8_gpu_fp16.litertlm'
const DB_NAME = 'clive-voice-pack'
const STORE_NAME = 'models'
let worker: Worker | null = null
let nextId = 1
const pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>()
let audioContext: AudioContext | null = null
let ready = false

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Could not open local voice storage'))
  })
}
async function readModel(): Promise<Blob | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get('kokoro-bm-george')
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error || new Error('Could not read voice pack'))
  })
}
async function saveModel(blob: Blob): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(blob, 'kokoro-bm-george')
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error || new Error('Could not save voice pack'))
  })
}
function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./cliveVoice.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = event => {
      const data = event.data || {}
      const task = pending.get(data.id)
      if (!task) return
      if (data.type === 'error') task.reject(new Error(data.message || 'Voice engine error'))
      else task.resolve(data)
      pending.delete(data.id)
    }
    worker.onerror = event => {
      for (const task of pending.values()) task.reject(new Error(event.message || 'Voice worker failed'))
      pending.clear()
      ready = false
    }
  }
  return worker
}
function send(message: Record<string, unknown>, transfer: Transferable[] = []): Promise<any> {
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    getWorker().postMessage({ ...message, id }, transfer)
  })
}
export async function hasCliveVoicePack(): Promise<boolean> {
  try { return !!(await readModel()) } catch { return false }
}
export async function initialiseCliveVoice(): Promise<boolean> {
  if (ready) return true
  const blob = await readModel()
  if (!blob) return false
  const buffer = await blob.arrayBuffer()
  await send({ type: 'init', buffer }, [buffer])
  ready = true
  return true
}
export async function downloadCliveVoicePack(onProgress: (percent: number) => void): Promise<void> {
  // A previous attempt may have downloaded and stored the model successfully
  // but failed while starting the speech engine. Reuse that local copy rather
  // than making the user download another 295 MB.
  let blob = await readModel()

  if (!blob) {
    const response = await fetch(MODEL_URL)
    if (!response.ok || !response.body) throw new Error('The voice pack download could not start. Please try again.')
    const total = Number(response.headers.get('content-length')) || 295 * 1024 * 1024
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let received = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        chunks.push(value)
        received += value.length
        onProgress(Math.min(99, Math.round(received / total * 100)))
      }
    }
    blob = new Blob(chunks, { type: 'application/octet-stream' })
    await saveModel(blob)
  }

  onProgress(100)
  await initialiseCliveVoice()
}
export async function speakWithCliveVoice(text: string): Promise<boolean> {
  try {
    if (!ready && !(await initialiseCliveVoice())) return false
    const result = await send({ type: 'speak', text })
    if (!audioContext) audioContext = new AudioContext()
    if (audioContext.state === 'suspended') await audioContext.resume()
    const samples = new Float32Array(result.samples)
    const buffer = audioContext.createBuffer(1, samples.length, result.sampleRateHz)
    buffer.copyToChannel(samples, 0)
    const source = audioContext.createBufferSource()
    source.buffer = buffer
    source.connect(audioContext.destination)
    source.start()
    return true
  } catch {
    return false
  }
}
export function stopCliveVoice(): void {
  if (audioContext) void audioContext.close().catch(() => {})
  audioContext = null
}
