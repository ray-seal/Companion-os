import { useEffect, useState } from 'react'
import { Download, CheckCircle2, X, Volume2, Loader2 } from 'lucide-react'
import { downloadCliveVoicePack, hasCliveVoicePack, initialiseCliveVoice, speakWithCliveVoice } from './cliveVoice'

export default function CliveVoiceSetup() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'checking'|'missing'|'ready'|'downloading'|'error'>('checking')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    ;(async () => {
      const installed = await hasCliveVoicePack()
      if (!active) return
      if (installed) {
        try { await initialiseCliveVoice(); if (active) setStatus('ready') }
        catch { if (active) setStatus('error') }
      } else {
        setStatus('missing')
        if (!localStorage.getItem('clive-voice-setup-choice')) setOpen(true)
      }
    })()
    return () => { active = false }
  }, [])
  async function install() {
    setStatus('downloading'); setProgress(0); setError('')
    try {
      await downloadCliveVoicePack(setProgress)
      setStatus('ready'); setOpen(false)
      localStorage.setItem('clive-voice-setup-choice', 'installed')
      void speakWithCliveVoice("Well, that's better. Proper voice, proper CLIVE. How are we doing?")
    } catch (e) {
      setStatus('error'); setError(e instanceof Error ? e.message : 'Something went wrong')
    }
  }
  function dismiss() {
    setOpen(false)
    localStorage.setItem('clive-voice-setup-choice', 'later')
  }
  return <>
    {open && <div className="voice-setup-backdrop" role="dialog" aria-modal="true" aria-labelledby="voice-setup-title">
      <div className="voice-setup-card">
        <button className="voice-setup-close" onClick={dismiss} aria-label="Not now"><X size={18}/></button>
        <div className="voice-setup-icon"><Volume2 size={25}/></div>
        <div className="eyebrow">A LITTLE UPGRADE FOR CLIVE</div>
        <h2 id="voice-setup-title">Give CLIVE his own voice?</h2>
        <p>Download his British male voice pack so he sounds the same on this device every time. It runs locally after download and doesn't need a subscription.</p>
        <div className="voice-setup-size"><strong>Approximately 295 MB</strong><span>One-time download · Works offline afterwards</span></div>
        {status === 'downloading' ? <><div className="voice-setup-progress"><span style={{width: progress + '%'}}/></div><small>{progress}% downloaded. Keep CLIVE open for a moment.</small></> : status === 'error' ? <p className="voice-setup-error">{error}</p> : null}
        <div className="voice-setup-actions">
          <button className="voice-setup-primary" onClick={install} disabled={status === 'downloading'}>{status === 'downloading' ? <><Loader2 size={16}/> Downloading…</> : <><Download size={16}/> Download voice pack</>}</button>
          <button className="voice-setup-secondary" onClick={dismiss} disabled={status === 'downloading'}>Not now</button>
        </div>
        <small>You can install it later from Settings. CLIVE will keep using the device voice until then.</small>
      </div>
    </div>}
    <div className="voice-pack-status">
      <div><strong>CLIVE voice pack</strong><small>{status === 'ready' ? 'Installed on this device · British male voice' : status === 'downloading' ? 'Downloading voice pack…' : status === 'error' ? 'Could not load voice pack' : 'Optional · About 295 MB'}</small></div>
      {status === 'ready' ? <button onClick={() => void speakWithCliveVoice("Hello there. George here, at your service.")}><Volume2 size={16}/> Test voice</button> : <button onClick={() => setOpen(true)}><Download size={16}/> {status === 'downloading' ? 'Downloading' : 'Set up'}</button>}
      {status === 'ready' && <CheckCircle2 size={17} className="voice-pack-check"/>}
    </div>
  </>
}
