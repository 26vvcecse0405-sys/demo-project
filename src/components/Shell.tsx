import { Award, ClipboardCheck, Flame, LayoutDashboard, Map, Menu, Moon, PieChart, Settings, Sun, Target, X } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { ACHIEVEMENTS } from '@shared/types'
import { useLearning } from '@/context/LearningContext'
import { Dialog, Logo } from './ui'

const links = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/assessment', label: 'Skill Assessment', icon: ClipboardCheck },
  { to: '/app/roadmap', label: 'My Roadmap', icon: Map },
  { to: '/app/practice', label: 'Practice Zone', icon: Target },
  { to: '/app/gaps', label: 'Skill Gap Analysis', icon: PieChart },
  { to: '/app/achievements', label: 'Achievements', icon: Award },
  { to: '/app/profile', label: 'Profile and Settings', icon: Settings },
]

function Item({ to, label, icon: Icon, end, onClick }: { to: string; label: string; icon: typeof Map; end?: boolean; onClick?: () => void }) {
  return (
    <NavLink to={to} end={end} onClick={onClick} className={({ isActive }) => `nav-item${isActive ? ' nav-item-active' : ''}`}>
      <Icon size={18} aria-hidden="true" />
      {label}
    </NavLink>
  )
}

export function Shell() {
  const { view, data, session, aiOnline, setTheme } = useLearning()
  const [more, setMore] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [celebrate, setCelebrate] = useState<string | null>(null)
  const previous = useRef<{ xp: number; badges: string[] } | null>(null)

  useEffect(() => {
    const earned = view.badges.filter((badge) => badge.earned).map((badge) => badge.id)
    if (previous.current) {
      const gain = view.xp - previous.current.xp
      const fresh = earned.filter((id) => !previous.current?.badges.includes(id))
      if (fresh.length) setCelebrate(fresh[0])
      if (gain > 0) setToast(`+${gain} XP`)
    }
    previous.current = { xp: view.xp, badges: earned }
  }, [view.xp, view.badges])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const aiLabel = aiOnline === null ? 'Checking AI' : aiOnline ? 'OpenAI connected' : 'Built-in content'

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/" style={{ textDecoration: 'none', padding: '0.2rem 0.5rem 1rem' }}><Logo /></Link>
        <nav style={{ display: 'grid', gap: 4 }} aria-label="Main">
          {links.map((link) => <Item key={link.to} {...link} />)}
        </nav>
        <div style={{ marginTop: 'auto', display: 'grid', gap: 8, padding: '0.8rem 0.4rem 0' }}>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>{aiLabel}</p>
          <p style={{ margin: 0, fontWeight: 700 }}>{view.xp} XP · {view.streak} day streak</p>
        </div>
      </aside>
      <div className="shell-main">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/" className="mobile-logo"><Logo compact /></Link>
            <strong>{data.profile?.displayName}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge"><Flame size={14} aria-hidden="true" /> {view.streak}</span>
            <span className="badge">{view.xp} XP</span>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setTheme(data.theme === 'dark' ? 'light' : 'dark')} aria-label={data.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
              {data.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>
        <div className="page">
          {data.workspace === 'sample' ? (
            <p className="banner banner-warn">Sample student · {data.profile?.displayName}. Scores, lessons, and badges come from saved demo activity in this browser. They are not live model output.</p>
          ) : session?.kind === 'demo' ? (
            <p className="banner">Demo mode. Progress stays in this browser and is kept separate from signed-in accounts.</p>
          ) : null}
          <div style={{ height: data.workspace === 'empty' ? 0 : 12 }} />
          <div className="page-enter"><Outlet /></div>
        </div>
      </div>
      <nav className="bottom-nav" aria-label="Mobile">
        <NavLink to="/app" end className={({ isActive }) => isActive ? 'nav-item-active' : ''}>Home</NavLink>
        <NavLink to="/app/assessment" className={({ isActive }) => isActive ? 'nav-item-active' : ''}>Assess</NavLink>
        <NavLink to="/app/roadmap" className={({ isActive }) => isActive ? 'nav-item-active' : ''}>Roadmap</NavLink>
        <NavLink to="/app/practice" className={({ isActive }) => isActive ? 'nav-item-active' : ''}>Practice</NavLink>
        <button type="button" onClick={() => setMore(true)}><Menu size={16} aria-hidden="true" />More</button>
      </nav>
      <Dialog open={more} title="More" onClose={() => setMore(false)}>
        <div style={{ display: 'grid', gap: 6 }}>
          <Item to="/app/gaps" label="Skill Gap Analysis" icon={PieChart} onClick={() => setMore(false)} />
          <Item to="/app/achievements" label="Achievements" icon={Award} onClick={() => setMore(false)} />
          <Item to="/app/profile" label="Profile and Settings" icon={Settings} onClick={() => setMore(false)} />
          <Link to="/" onClick={() => setMore(false)} className="nav-item"><X size={18} /> Landing page</Link>
        </div>
      </Dialog>
      {toast ? <div className="toast" role="status">{toast}</div> : null}
      <Dialog open={Boolean(celebrate)} title="Achievement unlocked" onClose={() => setCelebrate(null)}>
        <div className="celebrate" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => <span key={index} style={{ '--i': index } as CSSProperties} />)}
        </div>
        <p>{ACHIEVEMENTS.find((badge) => badge.id === celebrate)?.title}</p>
        <p className="muted">{ACHIEVEMENTS.find((badge) => badge.id === celebrate)?.description}</p>
        <Link to="/app/achievements" className="btn btn-primary" onClick={() => setCelebrate(null)}>View achievements</Link>
      </Dialog>
    </div>
  )
}
