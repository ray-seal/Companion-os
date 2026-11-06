import { useEffect, useRef, useState } from 'react'

type Room = 'bedroom' | 'living' | 'kitchen'
type Activity = 'relaxing' | 'waffles' | 'reading' | 'sleeping' | 'watching' | 'hobby'
type Personality = { interests: Record<string, number>; favourites: { possession: string; activity: string; room: string }; habits: string[] }
const routine = (hour:number): {room:Room;activity:Activity} => {
  if(hour>=7&&hour<9 || hour>=12&&hour<14 || hour>=18&&hour<20) return {room:'kitchen',activity:'waffles'}
  if(hour>=22 || hour<7) return {room:'bedroom',activity:'sleeping'}
  if(hour>=14&&hour<18) return {room:'living',activity:'reading'}
  return {room:'living',activity:'relaxing'}
}
export default function CliveFlat({ onSay, personality }: { onSay:(line:string)=>void; personality: Personality }) {
  const [room,setRoom]=useState<Room>('living')
  const [activity,setActivity]=useState<Activity>('relaxing')
  const [view,setView]=useState<Room>('living')
  const [explicit,setExplicit]=useState(()=>localStorage.getItem('clive-explicit-language')==='true')
  const [clock,setClock]=useState(()=>new Date())
  const [mugHidden,setMugHidden]=useState(()=>localStorage.getItem('clive-mug-hidden')==='true')
  const [mugFound,setMugFound]=useState(false)
  const [wander,setWander]=useState(false)
  const track=useRef<HTMLDivElement>(null)
  const hour=clock.getHours()
  const interests=personality.interests || {}
  const strongestInterest=Object.entries(interests).sort((a,b)=>b[1]-a[1])[0]?.[0] || ''
  const preferredActivity=personality.favourites?.activity || 'reading'
  const favouritePossession=personality.favourites?.possession || 'mug'
  const bedtime=Number(localStorage.getItem('clive-bedtime-hour')||23)
  const sleepy=hour>=bedtime||hour<7
  useEffect(()=>{const t=window.setInterval(()=>setClock(new Date()),30000);return()=>window.clearInterval(t)},[])
  useEffect(()=>{
    const next=routine(hour)
    if(hour>=9&&hour<22){
      if(strongestInterest==='motorcycles'&&hour>=14&&hour<18){next.room='living';next.activity='hobby'}
      else if(strongestInterest==='crime dramas'&&hour>=19&&hour<22){next.room='living';next.activity='watching'}
      else if(strongestInterest==='baking'&&(hour>=9&&hour<12||hour>=14&&hour<18)){next.room='kitchen';next.activity='waffles'}
      else if(preferredActivity==='reading'&&hour>=14&&hour<18){next.room='living';next.activity='reading'}
    }
    const timer=window.setInterval(()=>{
      setRoom(current=>{
        const destination=current==='living'?(Math.random()>.5?'kitchen':'bedroom'):'living'
        return destination
      })
      setWander(true);window.setTimeout(()=>setWander(false),1800)
    },110000)
    setRoom(next.room);setActivity(next.activity)
    return()=>window.clearInterval(timer)
  },[hour,strongestInterest,preferredActivity])
  useEffect(()=>{
    if(room==='kitchen'&&mugHidden&&!mugFound){
      setMugFound(true)
      onSay(explicit?"Hang on. Where's my favourite mug? Who's moved the bloody thing? I leave it alone for five minutes!":"Hang on. Where's my favourite mug? I leave it alone for five minutes!")
    }
  },[room,mugHidden,mugFound,explicit,onSay])
  function visit(next:Room){setView(next);track.current?.scrollTo({left:({bedroom:0,living:1,kitchen:2}[next])*((track.current?.clientWidth)||0),behavior:'smooth'})}
  function hideMug(){setMugHidden(true);localStorage.setItem('clive-mug-hidden','true');onSay("A mug has been hidden. CLIVE is blissfully unaware. For now.")}
  function languageToggle(value:boolean){setExplicit(value);localStorage.setItem('clive-explicit-language',String(value));onSay(value?"Right, adult language enabled. I'll try not to swear at the furniture.":"Family-friendly language restored. The waffles remain perfectly lovely.")}
  function interrupt(){onSay(room==='kitchen'?(explicit?"For fuck's sake, burnt the bastard waffles again. Anyway, what do you need?":"Blast. Burnt the waffles again. Anyway, what do you need?"):room==='bedroom'?"I was absolutely, definitely not asleep. Just resting my display. What is it?":"I was enjoying a quiet moment. Go on then, what's happening?")}
  function onScroll(){const el=track.current;if(!el)return;const index=Math.round(el.scrollLeft/(el.clientWidth||1));setView((['bedroom','living','kitchen'] as Room[])[index]||'living')}
  return <section className="clive-flat">
    <div className="flat-label"><span>CLIVE'S FLAT</span><span>{clock.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</span></div>
    <div className="flat-track" ref={track} onScroll={onScroll}>
      <div className="flat-room bedroom">
        <div className="flat-window"/><div className="flat-bed">▰<small>BED</small></div>
        {room==='bedroom'&&<FlatBot activity={activity} wander={wander} onClick={interrupt}/>}
        <span className="room-name">BEDROOM</span>
      </div>
      <div className="flat-room living">
        <div className="flat-window"/><div className="flat-shelf">▣　♧　▤</div><div className="flat-lamp">☼</div><div className="flat-sofa">▰<small>SOFA</small></div>
        {room==='living'&&<FlatBot activity={activity} wander={wander} onClick={interrupt}/>}
        <span className="room-name">LIVING ROOM</span>
      </div>
      <div className="flat-room kitchen">
        <div className="flat-window"/><div className="flat-kitchen">▤<small>WAFFLE STATION</small><span>🧇</span></div>
        {!mugHidden&&<button className="favourite-mug" onClick={hideMug} title={`Tap to hide CLIVE's favourite ${favouritePossession}`}>{favouritePossession==='teddy'?'🧸':favouritePossession==='books'?'📚':favouritePossession==='television'?'📺':'☕'}<small>CLIVE'S {favouritePossession.toUpperCase()}</small></button>}
        {mugHidden&&<div className="mug-empty">Something's missing…</div>}
        {room==='kitchen'&&<FlatBot activity={activity} wander={wander} onClick={interrupt}/>}
        <span className="room-name">KITCHEN</span>
      </div>
    </div>
    <div className="flat-scroll-hint">Swipe sideways to explore his flat ↔</div>
    <div className="flat-controls">{(['bedroom','living','kitchen'] as Room[]).map(r=><button className={view===r?'active':''} key={r} onClick={()=>visit(r)}>{r==='living'?'Living room':r[0].toUpperCase()+r.slice(1)}</button>)}</div>
    <div className="flat-options"><label><input type="checkbox" checked={explicit} onChange={e=>languageToggle(e.target.checked)}/> Adult language</label><span>{sleepy?'Winding down':'Pottering about'}</span></div>
  </section>
}
function FlatBot({activity,wander,onClick}:{activity:Activity;wander:boolean;onClick:()=>void}){
 return <button className={`flat-character ${activity} ${wander?'walking':''}`} onClick={onClick} aria-label="Talk to CLIVE"><span className="flat-antenna"/><span className="flat-face"><i/><i/><b/></span><span className="flat-body"/></button>
}
