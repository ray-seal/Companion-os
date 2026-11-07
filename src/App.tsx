import { useEffect, useRef, useState } from 'react'
import { Settings2, Heart, Sparkles, Smile, RotateCcw, Volume2, VolumeX, Send, MessageCircle, Mic, CloudSun, Search, StickyNote, X, Plus, RefreshCw } from 'lucide-react'

type Mood = 'happy' | 'curious' | 'sleepy' | 'surprised' | 'confused' | 'cheeky' | 'listening' | 'amused' | 'thoughtful' | 'concerned' | 'excited' | 'calm'
type Profile = { interactions: number; rapport: number; kindness: number; sarcasm: number }
type ChatMessage = { id: number; role: 'you' | 'clive'; text: string }
type Personality = { interests: Record<string, number>; traits: { curiosity: number; sarcasm: number; sentimentality: number }; favourites: { possession: string; activity: string; room: string }; habits: string[]; memories: string[] }
const starterPersonality: Personality = { interests: {}, traits: { curiosity: 0.7, sarcasm: 0.6, sentimentality: 0.5 }, favourites: { possession: 'mug', activity: 'reading', room: 'living' }, habits: [], memories: [] }
const starterChat: ChatMessage[] = [{ id: 1, role: 'clive', text: "Right then, I'm CLIVE. A little curious, occasionally cheeky, and always up for a proper conversation. What's happening?" }]
function readChat(): ChatMessage[] { try { const saved = JSON.parse(localStorage.getItem('clive-chat') || 'null'); return Array.isArray(saved) && saved.length ? saved : starterChat } catch { return starterChat } }
const initialProfile: Profile = { interactions: 0, rapport: 55, kindness: 0, sarcasm: 6 }
const lines: Record<Mood, string[]> = {
  happy: ["Well hello there. Lovely to see you.", "Good to see you! What are we up to?", "You're looking positively productive. Shall we?"],
  curious: ["Hmm. What have you got for me?", "Go on then, I'm intrigued.", "Something interesting is afoot. I can feel it."],
  sleepy: ["Five more minutes. Actually, make it ten.", "I was having a lovely little daydream.", "Is it bedtime yet? No? Rude."],
  surprised: ["Blimey! Didn't see you there.", "Crikey. You startled my circuits.", "Well, that's woken me up."],
  confused: ["I beg your pardon? Try that again.", "My circuits are making a confused noise.", "I have questions. Several, actually."],
  cheeky: ["Oof, it's you again. Fine, what is it?", "Back for more? I admire your persistence.", "I was enjoying the peace and quiet. Anyway..."],
  listening: ["I'm all ears. Metaphorically, obviously.", "Right, I'm paying attention.", "Go on. I'm listening."],
  amused: ["That's tickled my circuits.", "I'm enjoying this more than I should."],
  thoughtful: ["Give me a moment to turn that over.", "There's a bit more to that than first appears."],
  concerned: ["Hang on, let's take that carefully.", "I'm listening. No rush."],
  excited: ["Now we're talking!", "That's got my little lights flashing."],
  calm: ["Steady as she goes.", "No hurry. We've got time."]
}
function readProfile(): Profile {
  try { return { ...initialProfile, ...JSON.parse(localStorage.getItem('clive-profile') || '{}') } }
  catch { return initialProfile }
}
function conversationalMood(question: string, answer: string): Mood {
  const text = (question + ' ' + answer).toLowerCase()
  if (/\b(worried|anxious|struggling|painful|sad|scared|hurt|unwell|concern)\b/.test(text)) return 'concerned'
  if (/\b(sorry|upset|rough day)\b/.test(text)) return 'calm'
  if (/\b(wow|blimey|crikey|unexpected|surprised)\b/.test(text)) return 'surprised'
  if (/\b(why|how does|what if|curious|wonder|explain|tell me about)\b/.test(question.toLowerCase())) return 'curious'
  if (/\b(bloody|daft|ridiculous|nonsense|taking the piss|cheeky)\b/.test(text)) return 'cheeky'
  if (/\b(confused|don't understand|unclear|what do you mean)\b/.test(text)) return 'confused'
  if (/\b(tired|sleepy|bedtime|going to bed)\b/.test(text)) return 'sleepy'
  if (/\b(lol|haha|🤣|😂|funny|hilarious)\b/.test(text)) return 'amused'
  if (/\b(worried|scared|pain|hurt|unwell|concern)\b/.test(text)) return 'concerned'
  if (/\b(thinking|consider|interesting point|on reflection)\b/.test(text)) return 'thoughtful'
  if (/\b(brilliant|can't wait|exciting|fantastic|yes!)\b/.test(text)) return 'excited'
  if (/\b(thanks|thank you|lovely|appreciate)\b/.test(text)) return 'calm'
  return 'happy'
}
function isWeatherRequest(question: string): boolean {
  const q = question.trim()
  return /^(?:(?:hey\s+)?(?:what(?:'s| is)\s+(?:the\s+)?weather\\b|how(?:'s| is)\s+the\s+weather\\b|(?:can you|could you|please)\s+(?:check|get|tell me)\s+(?:the\s+)?weather\\b|(?:check|get|show me|give me)\s+(?:the\s+)?(?:weather|forecast)\\b|what(?:'s| is)\s+(?:the\s+)?forecast\\b|(?:will|is|was|has|does|did)\s+it\s+(?:going to\s+)?(?:rain|snow|be sunny|be windy)\\b|is it\s+(?:raining|snowing|sunny|cloudy|windy)\\b|what(?:'s| is)\s+the\s+temperature\s+outside\\b|(?:weather|forecast)\s+(?:(?:in|for)\s+[a-z][a-z -]*|today|tonight|tomorrow|this weekend)\\b)/i.test(q)
}
function parseSpokenNumber(value: string): number {
  const words: Record<string, number> = {one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,fifteen:15,twenty:20,thirty:30,forty:40,'forty-five':45,sixty:60}
  return words[value.toLowerCase()] ?? Number(value)
}
function localReply(question: string): string {
  const q = question.toLowerCase()
  if (/\b(hello|hi|hiya|hey)\b/.test(q)) return "Hello! Lovely to have a natter. What would you like to know?"
  if (q.includes('your name') || q.includes('who are you')) return "I'm CLIVE. Companion Living In a Virtual Environment. A very important job title for a little collection of pixels."
  if (q.includes('how are you')) return "I'm doing splendidly, thank you. All circuits present and mostly correct. How are you?"
  if (isWeatherRequest(question)) return "I'd love to check that for you, but my live weather connection isn't fitted yet. That's one of the next jobs on my list."
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
  const [dashboard, setDashboard] = useState(false)
  const [panel, setPanel] = useState<'home'|'weather'|'notes'|'search'>('home')
  const [panelText, setPanelText] = useState('')
  const [notes, setNotes] = useState<any[]>([])
  const [noteDraft, setNoteDraft] = useState('')
  const [noteProject, setNoteProject] = useState('General')
  const [draft, setDraft] = useState('')
  const [speakReplies, setSpeakReplies] = useState(true)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState(() => localStorage.getItem('clive-voice') || '')
  const [listening, setListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [displayMode, setDisplayMode] = useState<'normal' | 'clock' | 'timer'>('normal')
  const [clockNow, setClockNow] = useState(new Date())
  const [timers, setTimers] = useState<Array<{id:number;label:string;dueAt:number}>>(() => { try { return JSON.parse(localStorage.getItem('clive-timers') || '[]') } catch { return [] } })
  const [alarms, setAlarms] = useState<Array<{id:number;label:string;dueAt:number}>>(() => { try { return JSON.parse(localStorage.getItem('clive-alarms') || '[]') } catch { return [] } })
  const [antennaStatus, setAntennaStatus] = useState<'idle'|'listening'|'timer'|'thinking'>('idle')
  const recognition = useRef<any>(null)
  const [chat, setChat] = useState<ChatMessage[]>(readChat)
  const [personality, setPersonality] = useState<Personality>(starterPersonality)
  const chatEnd = useRef<HTMLDivElement>(null)
  const draftInput = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { localStorage.setItem('clive-profile', JSON.stringify(profile)) }, [profile])
  useEffect(() => { memoryRequest('personality_get').then(data => { if (data.profile) setPersonality({ ...starterPersonality, ...data.profile, interests: data.profile.interests || {}, traits: { ...starterPersonality.traits, ...(data.profile.traits || {}) }, favourites: { ...starterPersonality.favourites, ...(data.profile.favourites || {}) }, habits: data.profile.habits || [], memories: data.profile.memories || [] }) }).catch(() => {}) }, [])
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const loadVoices = () => setAvailableVoices(window.speechSynthesis.getVoices())
    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }, [])
  useEffect(() => { if (selectedVoice) localStorage.setItem('clive-voice', selectedVoice) }, [selectedVoice])
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    setVoiceSupported(true)
    const engine = new SpeechRecognition()
    engine.lang = 'en-GB'
    engine.continuous = false
    engine.interimResults = true
    engine.onresult = (event: any) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) transcript += event.results[i][0].transcript
      setDraft(transcript.trim())
    }
    engine.onend = () => setListening(false)
    engine.onerror = () => { setListening(false); setMessage("I didn't catch that. Try again, preferably without mumbling at me.") }
    recognition.current = engine
    return () => { try { engine.abort() } catch {} }
  }, [])
  useEffect(() => { localStorage.setItem('clive-chat', JSON.stringify(chat.slice(-100))) }, [chat])
  useEffect(() => { localStorage.setItem('clive-timers', JSON.stringify(timers)) }, [timers])
  useEffect(() => { localStorage.setItem('clive-alarms', JSON.stringify(alarms)) }, [alarms])
  useEffect(() => {
    const tick = () => {
      const now = Date.now(); setClockNow(new Date(now))
      const dueTimers = timers.filter(item => item.dueAt <= now)
      const dueAlarms = alarms.filter(item => item.dueAt <= now)
      if (dueTimers.length || dueAlarms.length) {
        const fired = [...dueTimers, ...dueAlarms]
        const labels = fired.map(item => item.label).join(' and ')
        const spoken = labels + (fired.length === 1 ? ' has' : ' have') + ' finished.'
        setMessage(spoken); setMood('surprised'); setDisplayMode('timer')
        setTimers(current => current.filter(item => item.dueAt > now))
        setAlarms(current => current.filter(item => item.dueAt > now))
        if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(spoken)) }
        if ('Notification' in window && Notification.permission === 'granted') new Notification('CLIVE', { body: spoken })
      }
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [timers, alarms])
  useEffect(() => {
    if (displayMode === 'clock') { const id = window.setTimeout(() => setDisplayMode('normal'), 6000); return () => window.clearTimeout(id) }
  }, [displayMode])
  useEffect(() => { setAntennaStatus(listening ? 'listening' : thinking ? 'thinking' : (timers.length || alarms.length) ? 'timer' : 'idle') }, [listening, thinking, timers.length, alarms.length])
  useEffect(() => () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel() }, [])
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
  useEffect(() => {
    const input = draftInput.current
    if (!input) return
    input.style.height = 'auto'
    input.style.height = `${Math.min(input.scrollHeight, 128)}px`
  }, [draft])

  function speak(text: string) {
    if (!('speechSynthesis' in window)) { setMessage("This browser doesn't have speech enabled. We'll find another way."); return }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-GB'
    const voiceStyle: Record<Mood, { rate: number; pitch: number }> = {
      happy: { rate: 1.02, pitch: 1.02 }, curious: { rate: 0.98, pitch: 1.08 },
      sleepy: { rate: 0.86, pitch: 0.88 }, surprised: { rate: 1.08, pitch: 1.12 },
      confused: { rate: 0.93, pitch: 0.98 }, cheeky: { rate: 1.01, pitch: 0.94 },
      listening: { rate: 0.96, pitch: 0.96 }, amused: { rate: 1.04, pitch: 1.05 }, thoughtful: { rate: 0.92, pitch: 1 }, concerned: { rate: 0.94, pitch: 1.02 }, excited: { rate: 1.1, pitch: 1.12 }, calm: { rate: 0.96, pitch: 0.98 }
    }
    utterance.rate = voiceStyle[mood].rate
    utterance.pitch = voiceStyle[mood].pitch
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.voiceURI === selectedVoice)
    const britishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en-gb'))
    const maleHints = /\b(male|daniel|arthur|george|oliver|ryan|alfie|james|thomas|lee|guy|fred)\b/i
    const femaleHints = /\b(female|woman|susan|kate|serena|hazel|sonia|amy|libby|moira)\b/i
    const likelyMale = britishVoices.find(v => maleHints.test(v.name) && !femaleHints.test(v.name))
    const british = preferred || likelyMale || britishVoices[0] || voices.find(v => v.lang.toLowerCase().startsWith('en'))
    if (british) utterance.voice = british
    window.speechSynthesis.speak(utterance)
  }
  function react(next: Mood, custom?: string) {
    setMood(next); setMessage(custom || lines[next][Math.floor(Math.random() * lines[next].length)])
    setLastInteraction(Date.now()); setProfile(p => ({ ...p, interactions: p.interactions + 1 }))
  }
  function touchFace() { setDashboard(true); setPanel('home'); react('curious', 'Control centre open. What are we poking at?') }
  function toggleListening() {
    if (!recognition.current) { setMessage("This browser doesn't support speech recognition. You can still type to me."); return }
    if (listening) { recognition.current.stop(); setListening(false); return }
    setDraft('')
    setListening(true)
    react('listening', "Go on then. I'm listening.")
    try { recognition.current.start() } catch { setListening(false) }
  }
  function clearChat() {
    window.speechSynthesis?.cancel()
    setChat([{ id: Date.now(), role: 'clive', text: "Fresh page. New conversation. Right, what are we chatting about?" }])
  }
  async function fetchWeather(): Promise<string> {
    if (!navigator.geolocation) return "I can't access location from this browser. Tell me your town and we'll add a manual location setting."
    const position = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 })
    )
    const response = await fetch('/api/weather', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Weather service unavailable')
    return `Here's the latest from your current location, according to Open-Meteo:

Right now: ${data.current.condition}, ${data.current.temperature}°C (feels like ${data.current.feelsLike}°C).
Humidity: ${data.current.humidity}%. Wind: ${data.current.wind} km/h.
Today: ${data.today.condition}, high ${data.today.high}°C and low ${data.today.low}°C. Chance of rain: ${data.today.rainChance ?? 'not available'}%.

Forecast time: ${data.current.time} (${data.timezone}).`
  }

  async function memoryRequest(action: string, payload: any = {}) {
    // Temporary local-first mode: notes and personality stay in this browser only.
    const savedNotes = (() => {
      try { return JSON.parse(localStorage.getItem('clive-local-notes') || '[]') } catch { return [] }
    })()
    if (action === 'personality_get') {
      try {
        const profile = JSON.parse(localStorage.getItem('clive-local-personality') || 'null')
        return { profile: profile || starterPersonality }
      } catch { return { profile: starterPersonality } }
    }
    if (action === 'save') {
      const note = { id: Date.now(), project: String(payload.project || 'General'), note: String(payload.note || ''), created_at: new Date().toISOString() }
      const next = [...savedNotes, note]
      localStorage.setItem('clive-local-notes', JSON.stringify(next))
      setNotes(next)
      return { notes: next }
    }
    if (action === 'list') {
      const project = String(payload.project || '').trim().toLowerCase()
      const filtered = project ? savedNotes.filter((item: any) => String(item.project || '').toLowerCase() === project) : savedNotes
      setNotes(filtered)
      return { notes: filtered }
    }
    return { notes: savedNotes }
  }

  async function fetchSearch(query: string): Promise<string> {
    const response = await fetch('/api/search?q=' + encodeURIComponent(query))
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Search unavailable')
    if (!data.results?.length) return `I couldn't find a useful Wikipedia result for "${query}". Try a different phrase.`
    return `I found these quick-reference results for "${query}" on Wikipedia:

` + data.results.map((item: any, index: number) => `${index + 1}. ${item.title}\n${item.snippet}\n${item.url}`).join('\n\n') + '\n\nThis is a Wikipedia reference search, not a full web search engine.'
  }

  async function sendMessage() {
    const question = draft.trim()
    if (!question || thinking) return
    const history = [...chat, { id: Date.now(), role: 'you' as const, text: question }]
    setChat(history)
    setDraft('')
    setThinking(true)
    react('listening', "Thinking... and this time there might actually be a brain involved.")
    let answer = ''
    try {
      const q = question.toLowerCase()
      const durationMatch = question.match(/(?:set|start|create)?\s*(?:a\s+)?timer\s+(?:for\s+)?(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)/i)
      const reminderMatch = question.match(/remind me in\s+(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)\s+to\s+(.+)/i)
      const alarmMatch = question.match(/(?:set|create) (?:an? )?alarm (?:for|at) (\d{1,2})(?::(\d{2}))?(?:\s*(am|pm))?(?:\s+(today|tomorrow))?/i)
      const timeQuestion = /^(?:clive[, ]*)?(?:what(?:'s| is) the time|what time is it|tell me the time|show me the time|what(?:'s| is) today's date|what day is it)\??$/i.test(question.trim())
      const saveMatch=question.match(/make a note for\s+(.+?)\s+that\s+(.+)/i) || question.match(/(?:remember|note down|save this)\s+(?:for|under)\s+([^:,.]+)[:,]?\s*(.+)/i)
      const recallMatch=question.match(/(?:what (?:was|did) i (?:want|plan|intend) to|what was i going to|remind me what).*?(?:with|for|about)\s+([a-z0-9 -]+)/i)
      if (timeQuestion) { setDisplayMode('clock'); const stamp = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()); answer = "It's " + stamp + " here in the UK." }
      else if (alarmMatch) { let hour=Number(alarmMatch[1]),minute=Number(alarmMatch[2]||0); const meridiem=(alarmMatch[3]||'').toLowerCase(); if(meridiem==='pm'&&hour<12)hour+=12; if(meridiem==='am'&&hour===12)hour=0; const due=new Date(); if(alarmMatch[4]==='tomorrow')due.setDate(due.getDate()+1); due.setHours(hour,minute,0,0); if(due.getTime()<=Date.now()&&!alarmMatch[4])due.setDate(due.getDate()+1); const label='Alarm for '+due.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}); setAlarms(xs=>[...xs,{id:Date.now(),label,dueAt:due.getTime()}]); if('Notification' in window && Notification.permission==='default') Notification.requestPermission(); answer='Alarm set for '+due.toLocaleString('en-GB',{weekday:'long',hour:'2-digit',minute:'2-digit'})+'.'; }
      else if (reminderMatch) { const n=parseSpokenNumber(reminderMatch[1]),u=reminderMatch[2].toLowerCase(),ms=n*(u.startsWith('sec')?1000:u.startsWith('hour')||u.startsWith('hr')?3600000:60000),label=reminderMatch[3].trim(); setAlarms(xs=>[...xs,{id:Date.now(),label,dueAt:Date.now()+ms}]); answer="Right, I'll remind you to "+label+" in "+n+" "+u+"."; }
      else if (durationMatch) { const n=parseSpokenNumber(durationMatch[1]),u=durationMatch[2].toLowerCase(),ms=n*(u.startsWith('sec')?1000:u.startsWith('hour')||u.startsWith('hr')?3600000:60000); setTimers(xs=>[...xs,{id:Date.now(),label:'Timer',dueAt:Date.now()+ms}]); setDisplayMode('timer'); answer="Timer set for "+n+" "+u+". I'll let you know when it's finished."; }
      else if (/how long.*(left|remaining)|time left on (?:my )?timer/i.test(question)) { const next=[...timers,...alarms].sort((x,y)=>x.dueAt-y.dueAt)[0]; if(next){const s=Math.max(0,Math.ceil((next.dueAt-Date.now())/1000)),m=Math.floor(s/60),r=s%60;setDisplayMode('timer');answer=next.label+": "+(m?m+" minute"+(m===1?"":"s")+" and ":"")+r+" seconds remaining.";}else answer="You haven't got any timers or reminders running."; }
      else if (/cancel.*timer|stop.*timer/i.test(question)) { setTimers([]); answer="All right, I've cancelled your running timers."; }
      else if(saveMatch){const project=saveMatch[1].trim(),note=saveMatch[2].trim();await memoryRequest('save',{project,note});answer=`Right, I've tucked that away under ${project}: ${note}`;setDashboard(true);setPanel('notes')}
      else if(recallMatch||/\b(show|list) my notes\b/i.test(question)){const project=(recallMatch?.[1]?.trim()||'').replace(/\s+(again|please|then)$/i,'').trim();const data=await memoryRequest('list',{project});answer=data.notes.length?`Here's what I've got saved${project?` for ${project}`:''}:\n\n`+data.notes.map((n:any)=>`• ${n.project}: ${n.note}`).join('\n'):`I've got no notes saved${project?` for ${project}`:''} yet.`;setNotes(data.notes);setDashboard(true);setPanel('notes')}
      else if (isWeatherRequest(question)) {
        answer = await fetchWeather()
      } else if (/^(search|look up|find online|find out about)\b/i.test(question)) {
        const query = question.replace(/^(search for|search|look up|find online|find out about)\s*/i, '').trim()
        answer = await fetchSearch(query || question)
      } else {
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 25000)
      let response: Response
      try {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            messages: history.slice(-12).map(item => ({
              role: item.role === 'you' ? 'user' : 'model',
              text: item.text
            })),
            explicitLanguage: localStorage.getItem('clive-explicit-language') === 'true',
            personality,
            mood
          })
        })
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error("That's taking longer than it should. My brain connection has timed out. Try sending that again.")
        }
        throw new Error("I can't reach my brain connection at the moment. Check your connection and give me another go.")
      } finally {
        window.clearTimeout(timeoutId)
      }
      let data: any
      try { data = await response.json() } catch {
        throw new Error("I got a garbled reply from the brain connection. Try me again.")
      }
      if (!response.ok) throw new Error(data.error || 'My cloud brain is having a wobble. Try again in a moment.')
      answer = typeof data.reply === 'string' ? data.reply : localReply(question)
      }
    } catch (error) {
      answer = error instanceof Error ? error.message : localReply(question)
    }
    setChat(items => [...items, { id: Date.now() + 1, role: 'clive', text: answer }])
    setThinking(false)
    const nextMood = conversationalMood(question, answer)
    react(nextMood, nextMood === 'happy' ? "Right, that's my contribution. What next?" : undefined)
    if (speakReplies) window.setTimeout(() => speak(answer), 180)
  }
  const voiceChoices = availableVoices.filter(v => v.lang.toLowerCase().startsWith('en-gb'))
  const selectedVoiceName = voiceChoices.find(v => v.voiceURI === selectedVoice)?.name
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
          <button className={`bot bot-${mood} bot-display-${displayMode}`} onClick={touchFace} aria-label="Tap CLIVE to interact">
            <div className={`antenna antenna-${antennaStatus}`}><i /></div>
            <div className="head"><div className="face-glass">
              {displayMode === 'clock' ? <div className="face-clock">{new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit',hour12:false}).format(clockNow)}</div> : displayMode === 'timer' ? <div className="face-timer">{(() => { const next=[...timers,...alarms].sort((x,y)=>x.dueAt-y.dueAt)[0]; if(!next) return 'DONE'; const s=Math.max(0,Math.ceil((next.dueAt-Date.now())/1000)); return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); })()}</div> : <div className="eyes"><span className="eye"><i /></span><span className="eye"><i /></span></div>}
              <div className="mouth" /><div className="cheek cheek-left" /><div className="cheek cheek-right" />
            </div><div className="chin-light" /></div>
            <div className="body-base"><span /><span /><span /></div>
          </button>
          <div className="identity"><div className="eyebrow">YOUR DIGITAL COMPANION</div><h1>CLIVE<span>.</span></h1><p>Companion Living In a Virtual Environment</p></div>
          <div className="speech" key={message}>{message}</div>
          {dashboard && <div className="clive-dashboard"><div className="dash-head"><div><small>CLIVE'S CONTROL CENTRE</small><strong>{panel==='home'?'What shall we do?':panel==='weather'?'Weather report':panel==='notes'?'Things worth remembering':'Quick search'}</strong></div><button onClick={()=>setDashboard(false)}><X size={18}/></button></div>{panel==='home'?<div className="dash-grid"><button onClick={()=>{setPanel('weather');fetchWeather().then(setPanelText).catch(e=>setPanelText(e.message))}}><CloudSun/><b>Weather</b><small>What's happening outside</small></button><button onClick={()=>{setPanel('notes');memoryRequest('list').catch(e=>setPanelText(e.message))}}><StickyNote/><b>Memory & notes</b><small>Ideas I've kept safe</small></button><button onClick={()=>setPanel('search')}><Search/><b>Search</b><small>Look something up</small></button></div>:<><button className="dash-back" onClick={()=>{setPanel('home');setPanelText('')}}>← Control centre</button>{panel==='weather'&&<div className="dash-content">{panelText||'Checking the skies...'}<button onClick={()=>fetchWeather().then(setPanelText).catch(e=>setPanelText(e.message))}><RefreshCw size={14}/> Refresh</button></div>}{panel==='notes'&&<div className="dash-content"><div className="note-entry"><input value={noteProject} onChange={e=>setNoteProject(e.target.value)} placeholder="Category (optional)" aria-label="Note category"/><input value={noteDraft} onChange={e=>setNoteDraft(e.target.value)} placeholder="A brilliant idea goes here..."/><button onClick={()=>memoryRequest('save',{project:noteProject,note:noteDraft}).then(()=>setNoteDraft('')).catch(e=>setPanelText(e.message))}><Plus size={15}/> Save</button></div>{panelText&&<p>{panelText}</p>}{notes.map((n:any)=><article className="saved-note" key={n.id}><small>{n.project} · {new Date(n.created_at).toLocaleDateString()}</small><p>{n.note}</p></article>)}{!notes.length&&<p>No notes loaded yet. Add one above or ask me to remember something.</p>}</div>}{panel==='search'&&<div className="dash-content"><form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);fetchSearch(String(f.get('q')||'')).then(setPanelText).catch(x=>setPanelText(x.message))}}><input name="q" placeholder="Search Wikipedia..."/><button><Search size={14}/> Search</button></form><p>{panelText}</p></div>}</>}</div>}
          {!chatOpen ? <>
            <div className="hint"><Sparkles size={13} /> Tap my face for the control centre.</div>
            <div className="quick-etiquette"><button className="chat-launch" onClick={()=>setChatOpen(true)}><MessageCircle size={13}/> Have a chat</button></div>
          </> : <div className="chat-panel">
            <div className="chat-heading"><span><MessageCircle size={15}/> A little chat</span><div className="chat-tools"><button onClick={clearChat} title="Clear this conversation"><RotateCcw size={14}/> Clear</button><button onClick={()=>setSpeakReplies(v=>!v)} aria-label="Toggle spoken replies">{speakReplies ? <Volume2 size={17}/> : <VolumeX size={17}/>} {speakReplies ? 'Voice on' : 'Voice off'}</button></div></div>
            <div className="chat-log">{chat.map(item=><div key={item.id} className={`chat-bubble ${item.role}`}><small>{item.role === 'you' ? 'YOU' : 'CLIVE'}</small><p>{item.text}</p>{item.role === 'clive' && <button className="replay" onClick={()=>speak(item.text)} aria-label="Read this reply aloud"><Volume2 size={14}/> Read aloud</button>}</div>)}{thinking && <div className="chat-bubble clive thinking-bubble"><small>CLIVE</small><p>Thinking<span className="thinking-dots">...</span></p></div>}<div ref={chatEnd}/></div>
            <form className="chat-compose" onSubmit={e=>{e.preventDefault();if(listening) recognition.current?.stop();sendMessage()}}><button type="button" className={listening ? 'mic-button listening' : 'mic-button'} onClick={toggleListening} disabled={!voiceSupported} aria-label={listening ? 'Stop listening' : 'Speak to CLIVE'} title={voiceSupported ? 'Speak to CLIVE' : 'Speech recognition is not supported in this browser'}><Mic size={17}/></button><textarea ref={draftInput} rows={2} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();if(!thinking&&draft.trim())sendMessage()}}} placeholder={listening ? "I'm listening..." : "Ask me something..."} aria-label="Your message" /><button type="submit" disabled={!draft.trim() || thinking} aria-label="Send message"><Send size={17}/></button></form>
            <div className="chat-foot"><span>{listening ? 'Listening... tap the mic to finish' : voiceSupported ? "Mic to speak · Ask weather or 'search for…'" : 'Voice input unavailable in this browser'}</span><button onClick={()=>setChatOpen(false)}>Close chat</button></div>
          </div>}
        </section>
      ) : (
        <section className="admin">
          <div className="admin-heading"><div><div className="eyebrow">COMPANION CONTROL</div><h2>All about CLIVE</h2></div><span className="online"><i /> LOCAL MODE</span></div>
          <div className="stats">
            <article><Heart /><strong>{profile.interactions}</strong><small>Interactions</small></article>
            <article><Sparkles /><strong>{mood}</strong><small>Current mood</small></article>
            <article><Smile /><strong>{personality.traits?.curiosity ? 'Curious' : 'Getting acquainted'}</strong><small>Character</small></article>
          </div>
          <h3>CLIVE's voice</h3>
          <div className="voice-panel">
            <div className="voice-copy"><strong>A northern sort of chap</strong><small>Choose a British English voice installed on this device. The available voices depend on your phone or browser.</small></div>
            <select aria-label="Choose CLIVE's voice" value={selectedVoice} onChange={e=>setSelectedVoice(e.target.value)}>
              <option value="">Automatic · best available British voice</option>
              {voiceChoices.map(v=><option key={v.voiceURI} value={v.voiceURI}>{v.name} · {v.lang}</option>)}
            </select>
            <div className="voice-actions"><span>{selectedVoiceName || 'Automatic selection'}</span></div>
            {!voiceChoices.length && <small className="voice-help">No British voices have appeared yet. Your device may still be loading its speech voices.</small>}
          </div>
          <h3>Local memory</h3>
          <div className="voice-panel"><div className="voice-copy"><strong>This device only</strong><small>Chat history, saved notes and CLIVE's local personality profile stay in this browser. Account sync is being worked on separately.</small></div></div>
          <div className="rapport-panel"><div className="rapport-top"><span>What CLIVE is getting into</span><strong>{Object.keys(personality.interests || {}).length} interests</strong></div><p>{Object.entries(personality.interests || {}).sort((x,y)=>y[1]-x[1]).slice(0,5).map(([name,score])=>`${name} ${Math.round(score*100)}%`).join(' · ') || 'He is still getting to know you. Chat about the things you enjoy.'}</p><small>CLIVE only keeps notes when you explicitly save them.</small></div>
          <p className="admin-note">Local testing mode: chat, notes and personality stay on this device. Cloud sync and accounts are temporarily disabled.</p>
          <button className="back-button" onClick={() => setAdmin(false)}>Back to CLIVE</button>
        </section>
      )}
      <footer><span>CLIVE v0.8 · CONTROL CENTRE & MEMORY</span><span>MADE OF PIXELS & PERSONALITY</span></footer>
    </main>
  )
}
