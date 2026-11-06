import { useEffect, useState } from 'react'

type Room = 'living' | 'kitchen' | 'bedroom'
type Activity = 'relaxing' | 'waffles' | 'reading' | 'sleeping' | 'wandering'
const routines: { from: number; to: number; room: Room; activity: Activity }[] = [
  { from: 7, to: 9, room: 'kitchen', activity: 'waffles' },
  { from: 9, to: 12, room: 'living', activity: 'relaxing' },
  { from: 12, to: 14, room: 'kitchen', activity: 'waffles' },
  { from: 14, to: 18, room: 'living', activity: 'reading' },
  { from: 18, to: 21, room: 'kitchen', activity: 'waffles' },
  { from: 21, to: 22, room: 'living', activity: 'relaxing' },
  { from: 22, to: 24, room: 'bedroom', activity: 'sleeping' },
  { from: 0, to: 7, room: 'bedroom', activity: 'sleeping' },
]
export default function CliveFlat({ onSay }: { onSay: (line: string) => void }) {
  const [room, setRoom] = useState<Room>('living')
  const [activity, setActivity] = useState<Activity>('relaxing')
  const [explicit, setExplicit] = useState(() => localStorage.getItem('clive-explicit-language') === 'true')
  const [clock, setClock] = useState(() => new Date())
  const [wander, setWander] = useState(false)
  const hour = clock.getHours()
  const minute = clock.getMinutes()
  const bedtime = Number(localStorage.getItem('clive-bedtime-hour') || 23)
  const sleepy = hour >= bedtime || hour < 7
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    const routine = routines.find(r => hour >= r.from && hour < r.to) || routines[0]
    setRoom(routine.room); setActivity(routine.activity)
    const timer = window.setInterval(() => {
      if (Math.random() > 0.48) {
        setWander(true)
        window.setTimeout(() => { setRoom(current => current === 'living' ? (Math.random() > .5 ? 'kitchen' : 'bedroom') : 'living'); setWander(false) }, 1700)
      }
    }, 95000)
    return () => window.clearInterval(timer)
  }, [hour])
  function languageToggle(value: boolean) {
    setExplicit(value)
    localStorage.setItem('clive-explicit-language', String(value))
    onSay(value ? "Right, adult language enabled. I'll try not to swear at the furniture." : "Family-friendly language restored. The waffles remain bloody... I mean, perfectly lovely.")
  }
  function interrupt() {
    if (room === 'kitchen') onSay(explicit ? "For fuck's sake, burnt the bastard waffles again. Anyway, what do you need?" : "Blast. Burnt the waffles again. Anyway, what do you need?")
    else if (room === 'bedroom') onSay("I was absolutely, definitely not asleep. Just resting my display. What is it?")
    else onSay("I was enjoying a quiet moment. Go on then, what's happening?")
  }
  function move(next: Room) { setRoom(next); setActivity(next === 'kitchen' ? 'waffles' : next === 'bedroom' ? 'sleeping' : 'relaxing') }
  return <section className={`clive-flat ${room} ${sleepy ? 'flat-sleepy' : ''}`}>
    <div className="flat-sky"><span>✦</span><span>✧</span><span>☾</span></div>
    <div className="flat-label"><span>CLIVE'S FLAT</span><span>{clock.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</span></div>
    <div className="flat-room">
      <div className="flat-window"><i/><i/><i/></div>
      <div className="flat-shelf"><b>▣</b><b>♧</b><b>▤</b></div>
      <div className="flat-lamp">☼</div>
      <div className="flat-character-wrap">
        <button className={`flat-character ${activity} ${wander ? 'walking' : ''}`} onClick={interrupt} aria-label="Talk to CLIVE">
          <span className="flat-antenna"/><span className="flat-face"><i/><i/><b/></span><span className="flat-body"/>
        </button>
        <span className="flat-thought">{room === 'kitchen' ? 'Waffles. Obviously.' : room === 'bedroom' ? 'Five more minutes…' : 'Lovely bit of peace.'}</span>
      </div>
      <div className="flat-sofa">▰<small>SOFA</small></div>
      <div className="flat-kitchen">▤<small>WAFFLE STATION</small><span>🧇</span></div>
      <div className="flat-bed">▰<small>BED</small></div>
      <div className="flat-floor"/>
    </div>
    <div className="flat-controls">
      <button onClick={() => move('bedroom')}>Bedroom</button><button onClick={() => move('living')}>Living room</button><button onClick={() => move('kitchen')}>Kitchen</button>
    </div>
    <div className="flat-options"><label><input type="checkbox" checked={explicit} onChange={e=>languageToggle(e.target.checked)}/> Adult language</label><span>{sleepy ? 'Winding down' : 'Pottering about'}</span></div>
  </section>
}
