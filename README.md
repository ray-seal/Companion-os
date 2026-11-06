# CompanionOS · CLIVE

**C.L.I.V.E. — Computer Living In Virtual Environment**

A cheeky, expressive digital companion designed as a lightweight, installable PWA. The first target is an 800×480 touchscreen on a Raspberry Pi Zero W, with development and testing on desktop and mobile browsers first.

## Current status

Version 0.1 is the visual first-boot prototype:
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
- **Backend:** Vercel serverless API
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

CLIVE's name: **Computer Living In Virtual Environment**.

Repository: `ray-seal/Companion-os`.
