import { useEffect, useRef, useState } from 'react'
import { Settings2, Heart, Sparkles, Smile, RotateCcw, Volume2, VolumeX, Send, MessageCircle, Mic } from 'lucide-react'

type Mood = 'happy' | 'curious' | 'sleepy' | 'surprised' | 'confused' | 'cheeky' | 'listening'
type Profile = { interactions: number; rapport: number; kindness: number; sarcasm: number }
type ChatMessage = { id: number; role: 'you' | 'clive'; text: string }
const initialProfile: Profile = { interactions: 0, rapport: 55, kindness: 0, sarcasm: 6 }
const moods: Mood[] = ['happy', 'curious', 'sleepy', 'surprised', 'confused', 'cheeky']
const lines: Record<Mood, string[]> = {
  happy: ["Well hello there. Lovely to see you.", "Good to see you! What are we up to?", "You're looking positively productive. Shall we?"],
  curious: ["Hmm. What have you got for me?", "Go on then, I'm intrigued.", "Something interesting is afoot. I can feel it."],
  sleepy: ["Five more minutes. Actually, make it ten.", "I was having a lovely little daydream.", "Is it bedtime yet? No? Rude."],
  surprised: ["Blimey! Didn't see you there.", "Crikey. You startled my circuits.", "Well, that's woken me up."],
  confused: ["I beg your pardon? Try that again.", "My circuits are making a confused noise.", "I have questions. Several, actually."],
  cheeky: ["Oof, it's you again. Fine, what is it?", "Back for more? I admire your persistence.", "I was enjoying the peace and quiet. Anyway..."],
  listening: ["I'm all ears. Metaphorically, obviously.", "Right, I'm paying attention.", "Go on. I'm listening."]
}
function readProfile(): Profile {
  try { return { ...initialProfile, ...JSON.parse(localStorage.getItem('clive-profile') || '{}') } }
  catch { return initialProfile }
}
function localReply(question: string): string {
  const q = question.toLowerCase()
  if (/\b(hello|hi|hiya|hey)\b/.test(q)) return "Hello! Lovely to have a natter. What would you like to know?"
  if (q.includes('your name') || q.includes('who are you')) return "I'm CLIVE. Companion Living In a Virtual Environment. A very important job title for a little collection of pixels."
  if (q.includes('how are you')) return "I'm doing splendidly, thank you. All circuits present and mostly correct. How are you?"
  if (q.includes('time')) return "I haven't got my clock connected yet. That's going on the jobs list."
  if (q.includes('joke')) return "I tried to tell a UDP joke, but I'm not sure anyone got it. I'll work on my material."
  if (q.includes('help')) return "I'm still learning my tricks. At the moment you can chat with me, hear my replies, and adjust my personality in settings. A proper AI brain is next."
  if (q.includes('thank')) return "You're very welcome. See? Good manners. We're practically best mates."
  return "That's a good question. My proper answer-brain isn't connected yet, so I'm not going to make something up. For now I'm practising conversation and speech. Give me a little more time and we'll connect the clever bits."
}
export default function App() {
  const [mood, setMood] = useState<Mood>('happy')
  const [message, setMessage] = useState(lines.happy[0])
  const [admin, setAdmin] = useState(false)
  const [profile, setProfile] = useState<Profile>(readProfile)
  const [lastInteraction, setLastInteraction] = useState(Date.now())
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [speakReplies, setSpeakReplies] = useState(true)
  const [chat, setChat] = useState<ChatMessage[]>([{ id: 1, role: 'clive', text: "Right then. Ask me something. I'm still growing my brain, so bear with me." }])
  const chatEnd = useRef<HTMLDivElement>(null)

  useEffect(() => { localStorage.setItem('clive-profile', JSON.stringify(profile)) }, [profile])
  useEffect(() => {
    const handler = (event: Event) => { event.preventDefault(); setInstallPrompt(event) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (Date.now() - lastInteraction > 60000 && mood !== 'sleepy') { setMood('sleepy'); setMessage(lines.sleepy[0]) }
    }, 8000)
    return () => window.clearInterval(timer)
  }, [lastInteraction, mood])
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [chat])

  function speak(text: string) {
    if (!('speechSynthesis' in window)) { setMessage("This browser doesn't have speech enabled. We'll find another way."); return }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-GB'
    utterance.rate = 0.96
    utterance.pitch = 0.92
    const voices = window.speechSynthesis.getVoices()
    const british = voices.find(v => v.lang === 'en-GB')
    if (british) utterance.voice = british
    window.speechSynthesis.speak(utterance)
  }
  function react(next: Mood, custom?: string) {
    setMood(next); setMessage(custom || lines[next][Math.floor(Math.random() * lines[next].length)])
    setLastInteraction(Date.now()); setProfile(p => ({ ...p, interactions: p.interactions + 1 }))
  }
  function touchFace() { react(moods[Math.floor(Math.random() * moods.length)]) }
  function etiquette(kind: 'kind' | 'rude') {
    setProfile(p => ({ ...p, interactions: p.interactions + 1, kindness: p.kindness + (kind === 'kind' ? 1 : 0), rapport: Math.max(0, Math.min(100, p.rapport + (kind === 'kind' ? 7 : -9))) }))
    if (kind === 'kind') react('happy', "That's lovely of you. Manners cost nothing, you know.")
    else react('cheeky', "Oof. Charming. I'll remember that. Probably.")
  }
  function sendMessage() {
    const question = draft.trim()
    if (!question) return
    const answer = localReply(question)
    setChat(items => [...items, { id: Date.now(), role: 'you', text: question }, { id: Date.now() + 1, role: 'clive', text: answer }])
    setDraft('')
    react('listening', "Thinking... well, doing my best impression of thinking.")
    if (speakReplies) window.setTimeout(() => speak(answer), 180)
  }
  const reset = () => { setProfile(initialProfile); setMood('happy'); setMessage("Fresh start. I've conveniently forgotten your previous nonsense."); setLastInteraction(Date.now()) }
  const rapportLabel = profile.rapport >= 75 ? 'Chummy' : profile.rapport >= 45 ? 'Getting acquainted' : profile.rapport >= 20 ? 'A little frosty' : 'On thin ice'
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /> COMPANION<span className="muted">OS</span></div>
        <div className="top-actions">
          {installPrompt && <button className="install-button" onClick={async()=>{await installPrompt.prompt();setInstallPrompt(null)}}>Install CLIVE</button>}
          <button className="icon-button" aria-label="Open settings" onClick={() => { setAdmin(v => !v); setChatOpen(false) }}><Settings2 size={19} /></button>
        </div>
      </header>
      {!admin ? (
        <section className="stage">
          <div className="ambient ambient-one" /><div className="ambient ambient-two" />
          <button className={`bot bot-${mood}`} onClick={touchFace} aria-label="Tap CLIVE to interact">
            <div className="antenna"><i /></div>
            <div className="head"><div className="face-glass">
              <div className="eyes"><span className="eye"><i /></span><span className="eye"><i /></span></div>
              <div className="mouth" /><div className="cheek cheek-left" /><div className="cheek cheek-right" />
            </div><div className="chin-light" /></div>
            <div className="body-base"><span /><span /><span /></div>
          </button>
          <div className="identity"><div className="eyebrow">YOUR DIGITAL COMPANION</div><h1>CLIVE<span>.</span></h1><p>Companion Living In a Virtual Environment</p></div>
          <div className="speech" key={message}>{message}</div>
          {!chatOpen ? <>
            <div className="hint"><Sparkles size={13} /> Tap my face. Go on, I dare you.</div>
            <div className="quick-etiquette">
              <button onClick={()=>etiquette('kind')}><Heart size={13}/> Be nice</button>
              <button onClick={()=>etiquette('rude')}>Be a bit rude <span>↗</span></button>
              <button className="chat-launch" onClick={()=>setChatOpen(true)}><MessageCircle size={13}/> Have a chat</button>
            </div>
          </> : <div className="chat-panel">
            <div className="chat-heading"><span><MessageCircle size={15}/> A little chat</span><button onClick={()=>setSpeakReplies(v=>!v)} aria-label="Toggle spoken replies">{speakReplies ? <Volume2 size={17}/> : <VolumeX size={17}/>} {speakReplies ? 'Voice on' : 'Voice off'}</button></div>
            <div className="chat-log">{chat.map(item=><div key={item.id} className={`chat-bubble ${item.role}`}><small>{item.role === 'you' ? 'YOU' : 'CLIVE'}</small><p>{item.text}</p>{item.role === 'clive' && <button className="replay" onClick={()=>speak(item.text)} aria-label="Read this reply aloud"><Volume2 size={14}/> Read aloud</button>}</div>)}<div ref={chatEnd}/></div>
            <form className="chat-compose" onSubmit={e=>{e.preventDefault();sendMessage()}}><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Ask me something..." aria-label="Your message"/><button type="submit" disabled={!draft.trim()} aria-label="Send message"><Send size={17}/></button></form>
            <div className="chat-foot"><span><Mic size={12}/> Voice input coming later</span><button onClick={()=>setChatOpen(false)}>Close chat</button></div>
          </div>}
        </section>
      ) : (
        <section className="admin">
          <div className="admin-heading"><div><div className="eyebrow">COMPANION CONTROL</div><h2>All about CLIVE</h2></div><span className="online"><i /> LOCAL MODE</span></div>
          <div className="stats">
            <article><Heart /><strong>{profile.interactions}</strong><small>Interactions</small></article>
            <article><Sparkles /><strong>{mood}</strong><small>Current mood</small></article>
            <article><Smile /><strong>{rapportLabel}</strong><small>Rapport</small></article>
          </div>
          <div className="rapport-panel"><div className="rapport-top"><span>Relationship meter</span><strong>{profile.rapport}/100</strong></div><div className="rapport-track"><i style={{width:profile.rapport+'%'}}/></div><small>{profile.kindness} kind interactions recorded · Stored on this device</small></div>
          <h3>Give him a mood</h3>
          <div className="mood-grid">{moods.map(item => <button key={item} className={mood === item ? 'selected' : ''} onClick={() => react(item)}>{item}</button>)}</div>
          <h3>Test his manners detector</h3>
          <div className="test-actions"><button onClick={()=>etiquette('kind')}> <Heart size={14}/> Polite interaction</button><button onClick={()=>etiquette('rude')}>Rude interaction</button></div>
          <div className="calibration"><label htmlFor="sarcasm">Sarcasm level <strong>{profile.sarcasm}/10</strong></label><input id="sarcasm" type="range" min="0" max="10" value={profile.sarcasm} onChange={e=>setProfile(p=>({...p,sarcasm:Number(e.target.value)}))}/></div>
          <p className="admin-note">This is an early personality sandbox. Chat replies are currently a small local demo, and settings save on this device. A proper AI brain and Neon memory are next.</p>
          <button className="reset-button" onClick={reset}><RotateCcw size={14}/> Reset test relationship</button>
          <button className="back-button" onClick={() => setAdmin(false)}>Back to CLIVE</button>
        </section>
      )}
      <footer><span>CLIVE v0.3 · CHAT & SPEECH</span><span>MADE OF PIXELS & PERSONALITY</span></footer>
    </main>
  )
}
