import { useEffect, useState } from 'react'
import { Settings2, Heart, Sparkles, Moon, Sun } from 'lucide-react'

type Mood = 'happy' | 'curious' | 'sleepy' | 'surprised' | 'confused' | 'cheeky' | 'listening'
const greetings: Record<Mood, string> = {
  happy: "Well hello there. Lovely to see you.",
  curious: "Hmm. What have you got for me?",
  sleepy: "Five more minutes. Actually, make it ten.",
  surprised: "Blimey! Didn't see you there.",
  confused: "I beg your pardon? Try that again.",
  cheeky: "Oof, it's you again. Only joking. Mostly.",
  listening: "I'm all ears. Metaphorically, obviously."
}
const moods: Mood[] = ['happy', 'curious', 'sleepy', 'surprised', 'confused', 'cheeky']

export default function App() {
  const [mood, setMood] = useState<Mood>('happy')
  const [message, setMessage] = useState(greetings.happy)
  const [admin, setAdmin] = useState(false)
  const [taps, setTaps] = useState(0)
  const [lastInteraction, setLastInteraction] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (Date.now() - lastInteraction > 45000 && mood !== 'sleepy') {
        setMood('sleepy')
        setMessage(greetings.sleepy)
      }
    }, 5000)
    return () => window.clearInterval(timer)
  }, [lastInteraction, mood])

  function react(next: Mood) {
    setMood(next)
    setMessage(greetings[next])
    setLastInteraction(Date.now())
    setTaps(value => value + 1)
  }

  function touchFace() {
    setLastInteraction(Date.now())
    const next = moods[Math.floor(Math.random() * moods.length)]
    react(next)
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /> COMPANION<span className="muted">OS</span></div>
        <button className="icon-button" aria-label="Open settings" onClick={() => setAdmin(v => !v)}>
          <Settings2 size={19} />
        </button>
      </header>

      {!admin ? (
        <section className="stage">
          <div className="ambient ambient-one" /><div className="ambient ambient-two" />
          <button className={`bot bot-${mood}`} onClick={touchFace} aria-label="Tap CLIVE to interact">
            <div className="antenna"><i /></div>
            <div className="head">
              <div className="face-glass">
                <div className="eyes">
                  <span className="eye"><i /></span>
                  <span className="eye"><i /></span>
                </div>
                <div className="mouth" />
                <div className="cheek cheek-left" /><div className="cheek cheek-right" />
              </div>
              <div className="chin-light" />
            </div>
            <div className="body-base"><span /><span /><span /></div>
          </button>
          <div className="identity">
            <div className="eyebrow">YOUR DIGITAL COMPANION</div>
            <h1>CLIVE<span>.</span></h1>
            <p>Computer Living In Virtual Environment</p>
          </div>
          <div className="speech" key={message}>{message}</div>
          <div className="hint"><Sparkles size={13} /> Tap my face. Go on, I dare you.</div>
        </section>
      ) : (
        <section className="admin">
          <div className="admin-heading"><div><div className="eyebrow">COMPANION CONTROL</div><h2>All about CLIVE</h2></div><span className="online"><i /> ONLINE</span></div>
          <div className="stats">
            <article><Heart /><strong>{taps}</strong><small>Interactions</small></article>
            <article><Sparkles /><strong>{mood}</strong><small>Current mood</small></article>
            <article><Sun /><strong>Cheeky</strong><small>Personality</small></article>
          </div>
          <h3>Give him a mood</h3>
          <div className="mood-grid">{moods.map(item => <button key={item} className={mood === item ? 'selected' : ''} onClick={() => react(item)}>{item}</button>)}</div>
          <p className="admin-note">This is the first control panel. Personality calibration, memory and project tracking will grow here.</p>
          <button className="back-button" onClick={() => setAdmin(false)}>Back to CLIVE</button>
        </section>
      )}
      <footer><span>CLIVE v0.1 · FIRST BOOT</span><span>MADE OF PIXELS & PERSONALITY</span></footer>
    </main>
  )
}