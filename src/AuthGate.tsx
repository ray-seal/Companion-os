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

  async function refreshSession() {
    try { const result = await authClient.getSession(); setSession(result.data?.session ?? null) }
    catch { setSession(null) }
    finally { setLoading(false) }
  }
  useEffect(() => {
    refreshSession()
    return () => {}
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      if (mode === 'signup') {
        const result = await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
        if (result.error) throw new Error(result.error.message)
        setNotice('Check your email and enter the verification code below.')
        setMode('verify')
      } else if (mode === 'verify') {
        const result = await (authClient as any).emailOtp.verifyEmail({ email: email.trim(), otp: otp.trim() })
        if (result.error) throw new Error(result.error.message)
        setNotice('Email verified! Signing you in...')
        await refreshSession()
        setMode('signin')
      } else if (mode === 'forgot') {
        const result = await authClient.requestPasswordReset({ email: email.trim(), redirectTo: window.location.origin })
        if (result.error) throw new Error(result.error.message)
        setNotice('If that address has an account, password reset instructions are on their way.')
        setMode('signin')
      } else {
        const result = await authClient.signIn.email({ email: email.trim(), password })
        if (result.error) throw new Error(result.error.message)
        await refreshSession()
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Authentication failed. Please try again.') }
    finally { setBusy(false) }
  }

  if (loading) return <main className="auth-shell"><div className="auth-card"><div className="brand"><span className="brand-dot" /> COMPANION<span className="muted">OS</span></div><p>Checking who's at the door...</p></div></main>
  if (session?.user) return <>{children}</>
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
