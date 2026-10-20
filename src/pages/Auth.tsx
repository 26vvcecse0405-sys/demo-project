import { FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Logo, usePageTitle } from '@/components/ui'
import { useLearning } from '@/context/LearningContext'
import { loadDemo } from '@/lib/storage'
import { isSupabaseConfigured } from '@/lib/supabase'

const credentials = z.object({
  email: z.string().trim().email('Enter a valid email.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
  name: z.string().trim().min(2, 'Add your name.').max(40).optional(),
})

export function AuthScreen({ mode }: { mode: 'login' | 'register' }) {
  const { session, data, signIn, signUp, enterSample, startFresh, resumeDemo } = useLearning()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  usePageTitle(mode === 'login' ? 'Log in' : 'Create your sprint')
  const saved = loadDemo()

  if (session && data.profile) return <Navigate to="/app" replace />
  if (session && !data.profile) return <Navigate to="/onboarding" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = credentials.safeParse({ email, password, name: mode === 'register' ? name : undefined })
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? 'Check the form.')
      return
    }
    setBusy(true)
    const result = mode === 'login'
      ? await signIn(parsed.data.email, parsed.data.password)
      : await signUp(parsed.data.email, parsed.data.password, parsed.data.name ?? name)
    setBusy(false)
    setMessage(result)
    if (!result) navigate(mode === 'login' ? '/app' : '/onboarding')
  }

  return (
    <main className="site-wrap" style={{ padding: '1.5rem 0 3rem', display: 'grid', gap: 18, maxWidth: 860 }}>
      <Link to="/" style={{ textDecoration: 'none' }}><Logo /></Link>
      <div className="grid-2">
        <section className="card card-pad" style={{ display: 'grid', gap: 12 }}>
          <p className="kicker">{mode === 'login' ? 'Welcome back' : 'Start your sprint'}</p>
          <h1 style={{ margin: 0 }}>{mode === 'login' ? 'Log in' : 'Create an account'}</h1>
          {isSupabaseConfigured() ? (
            <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
              {mode === 'register' ? (
                <label>
                  <span className="field-label">Name</span>
                  <input className="input" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
                </label>
              ) : null}
              <label>
                <span className="field-label">Email</span>
                <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
              </label>
              <label>
                <span className="field-label">Password</span>
                <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
              </label>
              <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button>
            </form>
          ) : (
            <p className="banner banner-warn">Supabase is not configured, so email login is off. Use the demo paths. Nothing here pretends to be a signed-in cloud account.</p>
          )}
          {message ? <p className="banner">{message}</p> : null}
          <p className="muted" style={{ margin: 0 }}>{mode === 'login' ? <Link to="/register">Need an account?</Link> : <Link to="/login">Already registered?</Link>}</p>
        </section>
        <section className="card card-pad" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
          <h2 style={{ margin: 0 }}>Present without credentials</h2>
          <p className="muted" style={{ margin: 0 }}>Demo progress is stored in this browser and never mixed with a Supabase account.</p>
          <button type="button" className="btn btn-primary" onClick={() => { void enterSample().then(() => navigate('/app')) }}>Open Aanya’s sample workspace</button>
          <button type="button" className="btn btn-secondary" onClick={() => { void startFresh().then(() => navigate('/onboarding')) }}>Start a new demo profile</button>
          {saved?.profile ? <button type="button" className="btn btn-ghost" onClick={() => { resumeDemo(); navigate(saved.profile ? '/app' : '/onboarding') }}>Resume saved demo · {saved.profile.displayName}</button> : null}
          <p className="field-help">Sample data includes a finished assessment, a roadmap, one completed lesson, and a quiz below the champion line so you can earn the next badge yourself.</p>
        </section>
      </div>
    </main>
  )
}
