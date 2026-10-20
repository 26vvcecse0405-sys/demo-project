import { Component, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from '@/components/Shell'
import { LoadingScreen } from '@/components/ui'
import { useLearning } from '@/context/LearningContext'
import { Achievements } from '@/pages/Achievements'
import { Assessment } from '@/pages/Assessment'
import { AuthScreen } from '@/pages/Auth'
import { Dashboard } from '@/pages/Dashboard'
import { Gaps } from '@/pages/Gaps'
import { Landing } from '@/pages/Landing'
import { Onboarding } from '@/pages/Onboarding'
import { Practice } from '@/pages/Practice'
import { Profile } from '@/pages/Profile'
import { LessonPage } from '@/pages/LessonPage'
import { RoadmapPage } from '@/pages/RoadmapPage'

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) {
      return <main className="site-wrap" style={{ padding: '3rem 0' }}><h1>This screen hit an error.</h1><p>Refresh the page. Your demo progress is still in this browser.</p></main>
    }
    return this.props.children
  }
}

function RequireApp() {
  const { session, data } = useLearning()
  if (!session) return <Navigate to="/login" replace />
  if (!data.profile) return <Navigate to="/onboarding" replace />
  return <Shell />
}

export function App() {
  const { booted } = useLearning()
  if (!booted) return <LoadingScreen />
  return (
    <Boundary>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthScreen mode="login" />} />
        <Route path="/register" element={<AuthScreen mode="register" />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/app" element={<RequireApp />}>
          <Route index element={<Dashboard />} />
          <Route path="assessment" element={<Assessment />} />
          <Route path="roadmap" element={<RoadmapPage />} />
          <Route path="roadmap/lesson/:lessonId" element={<LessonPage />} />
          <Route path="practice" element={<Practice />} />
          <Route path="gaps" element={<Gaps />} />
          <Route path="achievements" element={<Achievements />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Boundary>
  )
}
