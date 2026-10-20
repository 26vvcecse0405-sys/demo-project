import { createSampleWorkspace, buildRoadmap, buildSnapshots, createProfile, project, reducer } from '@shared/learning'
import { emptyData, type AppData, type AssessmentAttempt, type Profile, type QuizAttempt, type Roadmap } from '@shared/types'
import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import { applyTheme, demoSessionActive, loadDemo, readTheme, saveDemo, setDemoSession, DEMO_DATA_KEY } from '@/lib/storage'
import { getSupabase } from '@/lib/supabase'
import { fetchHealth } from '@/services/api'
import { loadRemote, scheduleSync } from '@/services/sync'

type Session = { kind: 'demo' } | { kind: 'supabase'; userId: string; email: string } | null

interface LearningValue {
  booted: boolean
  data: AppData
  view: ReturnType<typeof project>
  session: Session
  syncNote: string | null
  aiOnline: boolean | null
  setTheme: (theme: 'light' | 'dark') => void
  enterSample: () => Promise<void>
  startFresh: () => Promise<void>
  resumeDemo: () => void
  saveProfile: (input: Omit<Profile, 'id' | 'createdAt'>) => void
  updateProfile: (patch: Partial<Profile>) => void
  saveAttempt: (attempt: AssessmentAttempt) => void
  setRoadmap: (roadmap: Roadmap) => void
  toggleLesson: (lessonId: string) => void
  saveQuiz: (attempt: QuizAttempt) => void
  markCard: (cardId: string, mark: 'know' | 'review', label: string) => void
  resetDemo: () => void
  logout: () => Promise<void>
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string, name: string) => Promise<string | null>
}

const LearningContext = createContext<LearningValue | null>(null)

export function LearningProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, emptyData(readTheme()))
  const [session, setSession] = useState<Session>(null)
  const [booted, setBooted] = useState(false)
  const [syncNote, setSyncNote] = useState<string | null>(null)
  const [aiOnline, setAiOnline] = useState<boolean | null>(null)
  const view = useMemo(() => project(data), [data])

  useEffect(() => {
    applyTheme(data.theme)
  }, [data.theme])

  useEffect(() => {
    let cancelled = false
    const theme = readTheme()
    ;(async () => {
      const supabase = getSupabase()
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession()
        const user = sessionData.session?.user
        if (user && !cancelled) {
          try {
            const remote = await loadRemote(user.id, theme)
            dispatch({ type: 'replace', data: remote })
          } catch (error) {
            setSyncNote(error instanceof Error ? error.message : 'Could not load your saved progress.')
            dispatch({ type: 'replace', data: emptyData(theme) })
          }
          setSession({ kind: 'supabase', userId: user.id, email: user.email ?? '' })
          setBooted(true)
          return
        }
      }
      if (cancelled) return
      if (demoSessionActive()) {
        const saved = loadDemo()
        dispatch({
          type: 'replace',
          data: saved ?? { ...emptyData(theme), workspace: 'custom' },
        })
        setSession({ kind: 'demo' })
      } else {
        dispatch({ type: 'theme', theme })
      }
      setBooted(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!booted) return
    if (session?.kind === 'demo') saveDemo(data)
    if (session?.kind === 'supabase') scheduleSync(session.userId, data, setSyncNote)
  }, [booted, data, session])

  useEffect(() => {
    fetchHealth().then((health) => setAiOnline(health ? health.ai : false))
  }, [])

  async function leaveRemote() {
    if (session?.kind === 'supabase') await getSupabase()?.auth.signOut()
  }

  const value: LearningValue = {
    booted,
    data,
    view,
    session,
    syncNote,
    aiOnline,
    setTheme: (theme) => dispatch({ type: 'theme', theme }),
    enterSample: async () => {
      await leaveRemote()
      dispatch({ type: 'replace', data: createSampleWorkspace(data.theme) })
      setDemoSession(true)
      setSession({ kind: 'demo' })
    },
    startFresh: async () => {
      await leaveRemote()
      dispatch({ type: 'replace', data: { ...emptyData(data.theme), workspace: 'custom' } })
      setDemoSession(true)
      setSession({ kind: 'demo' })
    },
    resumeDemo: () => {
      const saved = loadDemo()
      if (!saved) return
      dispatch({ type: 'replace', data: { ...saved, theme: data.theme } })
      setDemoSession(true)
      setSession({ kind: 'demo' })
    },
    saveProfile: (input) => {
      const profile = createProfile({ ...input, id: data.profile?.id, createdAt: data.profile?.createdAt })
      const roadmap = buildRoadmap(profile, buildSnapshots(profile, data.attempts), data.workspace === 'sample' ? 'demo' : 'fallback')
      dispatch({ type: 'profile', profile, roadmap })
      if (session?.kind !== 'supabase') {
        setDemoSession(true)
        setSession({ kind: 'demo' })
      }
    },
    updateProfile: (patch) => {
      dispatch({ type: 'update-profile', patch })
      if (!data.profile) return
      const profile = { ...data.profile, ...patch }
      dispatch({
        type: 'roadmap',
        roadmap: buildRoadmap(profile, buildSnapshots(profile, data.attempts), data.workspace === 'sample' ? 'demo' : 'fallback'),
      })
    },
    saveAttempt: (attempt) => {
      dispatch({ type: 'attempt', attempt })
      if (!data.profile) return
      const attempts = [...data.attempts, attempt]
      dispatch({
        type: 'roadmap',
        roadmap: buildRoadmap(data.profile, buildSnapshots(data.profile, attempts), data.workspace === 'sample' ? 'demo' : 'fallback'),
      })
    },
    setRoadmap: (roadmap) => dispatch({ type: 'roadmap', roadmap }),
    toggleLesson: (lessonId) => dispatch({ type: 'toggle-lesson', lessonId }),
    saveQuiz: (attempt) => dispatch({ type: 'quiz', attempt }),
    markCard: (cardId, mark, label) => dispatch({ type: 'card', cardId, mark, label }),
    resetDemo: () => {
      localStorage.removeItem(DEMO_DATA_KEY)
      setDemoSession(false)
      dispatch({ type: 'reset', theme: data.theme })
      setSession(null)
    },
    logout: async () => {
      if (session?.kind === 'supabase') await getSupabase()?.auth.signOut()
      setDemoSession(false)
      dispatch({ type: 'replace', data: emptyData(data.theme) })
      setSession(null)
    },
    signIn: async (email, password) => {
      const supabase = getSupabase()
      if (!supabase) return 'Supabase is not configured. Continue in demo mode.'
      const { data: result, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return error.message
      if (!result.user) return 'Login did not return an account.'
      setDemoSession(false)
      try {
        dispatch({ type: 'replace', data: await loadRemote(result.user.id, data.theme) })
      } catch (loadError) {
        setSyncNote(loadError instanceof Error ? loadError.message : 'Could not load your saved progress.')
        dispatch({ type: 'replace', data: emptyData(data.theme) })
      }
      setSession({ kind: 'supabase', userId: result.user.id, email: result.user.email ?? email })
      return null
    },
    signUp: async (email, password, name) => {
      const supabase = getSupabase()
      if (!supabase) return 'Supabase is not configured. Continue in demo mode.'
      const { data: result, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } },
      })
      if (error) return error.message
      if (!result.session || !result.user) return 'Account created. Confirm your email, then log in. For an offline presentation, use the demo workspace.'
      setDemoSession(false)
      dispatch({ type: 'replace', data: emptyData(data.theme) })
      setSession({ kind: 'supabase', userId: result.user.id, email: result.user.email ?? email })
      return null
    },
  }

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>
}

export function useLearning() {
  const value = useContext(LearningContext)
  if (!value) throw new Error('useLearning must be used inside LearningProvider')
  return value
}
