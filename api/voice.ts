export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Use POST.' }) }
  const env = (globalThis as any).process?.env || {}
  if (!env.ELEVENLABS_API_KEY || !env.ELEVENLABS_VOICE_ID) return res.status(503).json({ error: 'Premium voice is not configured.' })
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const text = typeof body?.text === 'string' ? body.text.trim().slice(0, 1200) : ''
    if (!text) return res.status(400).json({ error: 'Nothing to say.' })
    const voiceId = String(env.ELEVENLABS_VOICE_ID)
    if (!/^[a-zA-Z0-9_-]{10,80}$/.test(voiceId)) return res.status(503).json({ error: 'Voice ID is invalid.' })
    const upstream = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
      method: 'POST',
      headers: { 'xi-api-key': env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5',
        voice_settings: { stability: 0.48, similarity_boost: 0.78, style: 0.22, use_speaker_boost: true }
      })
    })
    if (!upstream.ok) { console.error('Voice provider status', upstream.status); return res.status(502).json({ error: 'Premium voice temporarily unavailable.' }) }
    const bytes = Buffer.from(await upstream.arrayBuffer())
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).send(bytes)
  } catch (error) {
    console.error('Voice error', error)
    return res.status(500).json({ error: 'Speech generation failed.' })
  }
}
