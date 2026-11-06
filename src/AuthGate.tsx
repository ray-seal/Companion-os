import { FormEvent, useEffect, useState } from 'react'
import { authClient } from './auth'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'signin'|'signup'|'forgot'|'verify'>('signin')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function refreshSession(): Promise<boolean> {
    try {
      const result = await authClient.getSession()
      if (result.error) throw result.error
      const nextSession = result.data?.session ?? null
      setSession(nextSession)
      return Boolean(result.data?.user)
    } catch (error) {
      setSession(null)
      throw error
    } finally {
      setLoading(false)
    }
  }

  function describeAuthError(error: unknown): string {
    const safeDetails: string[] = []
    const seen = new Set<unknown>()

    function inspect(value: unknown, depth = 0) {
      if (!value || typeof value !== 'object' || depth > 2 || seen.has(value)) return
      seen.add(value)
      const item = value as Record<string, unknown>
      for (const key of ['message', 'code', 'status', 'statusText', 'reason', 'field', 'details', 'issues', 'validationErrors', 'body', 'data', 'response', 'statusCode']) {
        const part = item[key]
        if (part === undefined || part === null) continue
        if (typeof part === 'string' || typeof part === 'number') {
          const line = key + ': ' + String(part).slice(0, 240)
          if (!safeDetails.includes(line)) safeDetails.push(line)
        } else if (Array.isArray(part)) {
          const summary = part.slice(0, 4).map(entry => {
            if (typeof entry === 'string') return entry.slice(0, 120)
            if (entry && typeof entry === 'object') {
              const issue = entry as Record<string, unknown>
              return [issue.path, issue.field, issue.message, issue.code].filter(v => typeof v === 'string').join(' ')
            }
            return ''
          }).filter(Boolean).join('; ')
          if (summary) safeDetails.push(key + ': ' + summary)
        } else if (typeof part === 'object') {
          inspect(part, depth + 1)
        }
      }
      if (item.cause) inspect(item.cause, depth + 1)
      if (item.error) inspect(item.error, depth + 1)
    }

    inspect(error)
    if (error instanceof Error && error.message && !safeDetails.some(line => line.startsWith('message:'))) {
      safeDetails.unshift('message: ' + error.message.slice(0, 240))
    }
    return safeDetails.length ? safeDetails.join(' · ') : 'Authentication failed. Please try again.'
  }
  useEffect(() => {
    refreshSession().catch(error => setError(describeAuthError(error)))
    return () => {}
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      if (mode === 'signup') {
        const result = await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
        if (result.error) throw result.error
        setNotice('Check your email and enter the verification code below.')
        setMode('verify')
      } else if (mode === 'verify') {
        const result = await (authClient as any).emailOtp.verifyEmail({ email: email.trim(), otp: otp.trim() })
        if (result.error) throw result.error
        setNotice('Email verified! Signing you in...')
        const verifiedSession = await refreshSession()
        setMode('signin')
        if (!verifiedSession) setNotice('Email verified. Now sign in with the password you created.')
      } else if (mode === 'forgot') {
        const result = await authClient.requestPasswordReset({ email: email.trim(), redirectTo: window.location.origin })
        if (result.error) throw new Error(result.error.message)
        setNotice('If that address has an account, password reset instructions are on their way.')
        setMode('signin')
      } else {
        const result = await authClient.signIn.email({ email: email.trim(), password })
        if (result.error) throw result.error
        const signedIn = await refreshSession()
        if (!signedIn) {
          setNotice('The sign-in request was accepted, but no session was returned. This can happen when the browser blocks the authentication cookie. Try opening CLIVE in Safari or Chrome directly, rather than an in-app browser.')
        }
      }
    } catch (e) {
      setError(describeAuthError(e))
    }
    finally { setBusy(false) }
  }

  if (loading) return <main className="auth-shell"><div className="auth-card"><div className="brand"><span className="brand-dot" /> COMPANION<span className="muted">OS</span></div><p>Checking who's at the door...</p></div></main>
  if (session?.userId) return <>{children}</>
  return <main className="auth-shell"><section className="auth-card">
    <div className="brand"><span className="brand-dot" /> COMPANION<span className="muted">OS</span></div>
    <div className="eyebrow">CLIVE'S PRIVATE SPACE</div>
    <h1>{mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : mode === 'verify' ? 'Verify your email' : 'Welcome back'}</h1>
    <p className="auth-intro">Sign in to keep your memories private and in sync across your devices.</p>
    <form onSubmit={submit} className="auth-form">
      {mode === 'signup' && <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" autoComplete="name" required />}
      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" autoComplete="email" required />
      {mode === 'verify' && <input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Email verification code" inputMode="numeric" autoComplete="one-time-code" required />}
      {(mode === 'signin' || mode === 'signup') && <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" autoComplete={mode==='signup'?'new-password':'current-password'} minLength={8} required />}
      {error && <p className="auth-error">{error}</p>}{notice && <p className="auth-notice">{notice}</p>}
      <button type="submit" disabled={busy}>{busy ? 'One moment...' : mode==='signup'?'Create account':mode==='forgot'?'Send reset instructions':mode==='verify'?'Verify email':'Sign in'}</button>
    </form>
    <div className="auth-links">
      {mode==='signin' ? <><button onClick={()=>setMode('signup')}>Create an account</button><button onClick={()=>setMode('forgot')}>Forgot password?</button></> : <button onClick={()=>{setMode('signin');setError('');setNotice('')}}>Back to sign in</button>}
      {mode==='signin' && <button onClick={()=>{setMode('verify');setError('');setNotice('Enter the code sent to your email.')}}>I have a verification code</button>}
    </div>
  </section></main>
}
