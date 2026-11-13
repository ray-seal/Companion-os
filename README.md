# CompanionOS · CLIVE

**C.L.I.V.E. — Companion Living In a Virtual Environment**

A cheeky, expressive digital companion designed as a lightweight, installable PWA. The first target is an 800×480 touchscreen on a Raspberry Pi Zero W, with development and testing on desktop and mobile browsers first.

## Current status

The current prototype includes:
- Expressive CSS-rendered robot face
- Six selectable moods and tap-to-react behaviour
- Basic idle/sleep behaviour
- Hidden starter control panel
- PWA manifest and offline asset caching via Workbox

## Development

Requirements: Node.js 20+

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Planned architecture

- **Frontend:** React + TypeScript + Vite PWA
- **Character:** CSS/vector-style components and animation state machine
- **Backend:** Vercel serverless API (`/api/chat`, `/api/weather`, `/api/search`)
- **Weather:** Open-Meteo forecast endpoint; browser location permission is requested only when weather is asked
- **Quick search:** Wikipedia reference search, with source links
- **AI:** Gemini API, called server-side; the UI falls back to local demo replies until a key is configured
- **Database:** Neon PostgreSQL, accessed only through the API
- **Memory:** Local-first cache plus explicit, user-controlled long-term memories
- **Personality:** Mood, rapport, etiquette signals and adjustable traits
- **Integrations:** GitHub and Vercel project status, added incrementally

The Raspberry Pi is a display client, not the source of truth. It must never contain Neon credentials or privileged API secrets.

## Design principles

1. CLIVE remains usable when offline; cloud features degrade gracefully.
2. Rapport changes tone, never access to ordinary assistance.
3. Memory is inspectable, editable and deletable by the user.
4. Never infer a person's character from a single blunt message.
5. No autonomous external actions without clear permission.
6. Keep the Pi Zero client lightweight; test browser performance before committing to Chromium kiosk mode.

## Identity

CLIVE's name: **Companion Living In a Virtual Environment**.

Repository: `ray-seal/Companion-os`.


## Connecting CLIVE's AI brain

The chat endpoint is ready at `/api/chat`. It keeps the provider key on the server and never sends it to the browser.

1. Create an API key in [Google AI Studio](https://aistudio.google.com/).
2. In Vercel, open the CompanionOS project and go to **Settings → Environment Variables**.
3. Add `GEMINI_API_KEY` with the key as its value. Optionally add `GEMINI_MODEL` (defaults to `gemini-2.5-flash`).
4. Apply it to the Production environment and redeploy.

The endpoint accepts only POST requests, limits conversation context to the latest 12 messages, and caps each message at 3,000 characters. Keep API keys out of GitHub and frontend code. The free provider tier has its own quotas and terms; check those before use.

For local development, copy `.env.example` to `.env.local` and add your key there. Do not commit `.env.local`.


## Free tools currently wired in

- Ask CLIVE about the weather to request browser location permission and fetch current conditions plus today's forecast from Open-Meteo. Location coordinates are sent to the server only for that weather request and are not stored by this app.
- Start a message with `search for ...` or `look up ...` to search Wikipedia and receive source links. This is a lightweight reference search, not a general-purpose web search engine.
- The Gemini conversation endpoint remains separate and works once `GEMINI_API_KEY` is configured in Vercel.


## Local wake-word listening and hardware detection

CLIVE can use an optional Raspberry Pi service for local wake-word detection. It listens for "Hey Clive", "Hi Clive" and "Here Clive" using Vosk, then sends only the recognised request text to the existing chat API. It also reports whether a microphone and webcam device are present. The camera is detected but not yet used for vision.

See [the Raspberry Pi listener setup guide](pi/README.md). Note that the Pi Zero W is ARMv6 and may not support a ready-made Vosk package; a Pi 3B or newer is recommended for always-on local speech recognition.
