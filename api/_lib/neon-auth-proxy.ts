const AUTH_BASE = 'https://ep-little-tooth-zaq7ljaz.neonauth.c-2.eu-west-2.aws.neon.tech/clive/auth'

export default async function neonAuthProxy(req: any, res: any) {
  const method = String(req.method || 'GET').toUpperCase()
  if (method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    return res.status(204).end()
  }

  try {
    const incoming = new URL(String(req.url || '/'), 'http://vercel.internal')
    let pathname = incoming.pathname
    if (pathname.startsWith('/api/clive/auth')) pathname = pathname.slice('/api/clive/auth'.length)
    else if (pathname.startsWith('/clive/auth')) pathname = pathname.slice('/clive/auth'.length)
    if (!pathname) pathname = '/'
    const target = new URL(AUTH_BASE + pathname + incoming.search)

    const headers = new Headers()
    const sourceHeaders = req.headers || {}
    const blocked = new Set([
      'host', 'connection', 'content-length', 'accept-encoding',
      'x-forwarded-host', 'x-forwarded-port', 'x-forwarded-proto',
      'x-vercel-id', 'x-vercel-ip-country', 'x-vercel-ip-city'
    ])
    for (const [key, raw] of Object.entries(sourceHeaders)) {
      const name = key.toLowerCase()
      if (blocked.has(name) || raw == null) continue
      if (Array.isArray(raw)) headers.set(name, raw.join(', '))
      else headers.set(name, String(raw))
    }

    // Neon Auth validates the upstream Host header. Let fetch set Host from
    // AUTH_BASE rather than forwarding the browser-facing Vercel hostname.
    const hasBody = !['GET', 'HEAD'].includes(method)
    let body: string | undefined
    if (hasBody && req.body !== undefined) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
      if (!headers.has('content-type')) headers.set('content-type', 'application/json')
    }

    const upstream = await fetch(target, {
      method,
      headers,
      body,
      redirect: 'manual'
    })

    const responseBody = new Uint8Array(await upstream.arrayBuffer())
    if (upstream.status >= 400) {
      let errorCode = 'unknown'
      try {
        const payload = JSON.parse(new TextDecoder().decode(responseBody))
        errorCode = String(payload.code || payload.error || payload.message || 'unknown').slice(0, 100)
      } catch {}
      // Diagnostic only: never log credentials, email addresses, cookies, or request bodies.
      console.warn('Neon Auth upstream error', { method, pathname, status: upstream.status, errorCode })
    }

    res.status(upstream.status)
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') return
      if (['connection', 'transfer-encoding', 'content-encoding', 'content-length'].includes(key.toLowerCase())) return
      res.setHeader(key, value)
    })

    const cookies = upstream.headers.getSetCookie?.() || []
    if (cookies.length) res.setHeader('set-cookie', cookies)

    return res.end(responseBody)
  } catch (error) {
    console.error('Neon Auth proxy failed:', error)
    return res.status(502).json({ error: 'Authentication service is temporarily unavailable.', code: 'AUTH_PROXY_FAILED' })
  }
}
