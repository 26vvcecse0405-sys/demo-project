import { formatWhen } from '@shared/dates'
import { hoursLabel } from '@shared/learning'
import { SKILL_LABEL, type SkillId } from '@shared/types'
import { Brain, Briefcase, Code2, Globe, LineChart, Megaphone, Palette } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AvatarArt, EmptyArt } from '@/components/art'
import { ActivityChart, SkillRadar } from '@/components/Charts'
import { PageHeader, ProgressRing, usePageTitle } from '@/components/ui'
import { useLearning } from '@/context/LearningContext'

export function Dashboard() {
  const { data, view } = useLearning()
  usePageTitle('Dashboard')
  const profile = data.profile
  if (!profile) return null
  const weekly = view.weeklyGoal === 0 ? 0 : Math.min(100, Math.round((view.weeklyMinutes / view.weeklyGoal) * 100))
  const activity = [...view.activities].reverse().slice(0, 6)
  const level = 1 + Math.floor(view.xp / 100)
  const intoLevel = view.xp % 100
  const icons: Record<SkillId, typeof Code2> = {
    programming: Code2,
    web: Globe,
    ai: Brain,
    data: LineChart,
    design: Palette,
    business: Briefcase,
    communication: Megaphone,
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <PageHeader kicker="Dashboard" title={`Welcome back, ${profile.displayName.split(' ')[0]}.`} text={`Current goal: ${profile.careerGoal}`} />
      <section className="card card-pad glow" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <AvatarArt label={`${profile.displayName} profile illustration`} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <p className="kicker">Continue learning</p>
          {view.next ? (
            <>
              <h2 style={{ margin: '0.2rem 0' }}>{view.next.lesson.title}</h2>
              <p className="muted" style={{ margin: 0 }}>{view.next.moduleTitle} · {view.next.lesson.durationMin} min · Level {level}</p>
              <div className="meter" style={{ marginTop: 8 }} aria-label={`Level progress ${intoLevel}%`}><span style={{ width: `${intoLevel}%` }} /></div>
              <p className="field-help">{intoLevel} / 100 XP toward level {level + 1}. Sample and live numbers both come from saved activity.</p>
            </>
          ) : <p>Your current roadmap is complete.</p>}
        </div>
        {view.next ? <Link className="btn btn-primary" to={`/app/roadmap/lesson/${view.next.lesson.id}`}>Continue</Link> : <Link className="btn btn-secondary" to="/app/roadmap">Review roadmap</Link>}
      </section>
      <section className="grid-4">
        <article className="card card-pad" style={{ display: 'grid', justifyItems: 'center' }}>
          <ProgressRing value={view.progress} label="Roadmap" />
        </article>
        <article className="card card-pad">
          <p className="kicker">Level {level}</p>
          <p className="stat-value">{view.xp} XP</p>
          <p className="muted">From saved lessons, quizzes, and assessments.</p>
        </article>
        <article className="card card-pad">
          <p className="kicker">Streak</p>
          <p className="stat-value">{view.streak} days</p>
          <p className="muted">Best run {view.best} days. A day counts when activity was saved.</p>
        </article>
        <article className="card card-pad">
          <p className="kicker">Latest assessment</p>
          <p className="stat-value">{view.recentAttempt ? `${view.recentAttempt.scorePercent}%` : '—'}</p>
          <p className="muted">{view.recentAttempt ? `${SKILL_LABEL[view.recentAttempt.skill]} · ${view.recentAttempt.source === 'demo' ? 'sample' : view.recentAttempt.source}` : 'No assessment saved yet.'}</p>
        </article>
      </section>
      <section className="grid-2">
        <article className="card card-pad">
          <h2 style={{ marginTop: 0 }}>This week</h2>
          <p className="muted">{hoursLabel(view.weeklyMinutes)} of {profile.weeklyHours} h planned</p>
          <div className="meter" aria-label={`Weekly goal ${weekly}%`}><span style={{ width: `${weekly}%` }} /></div>
          <ActivityChart data={view.chart} />
        </article>
        <article className="card card-pad" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
          <h2 style={{ margin: 0 }}>Next recommended task</h2>
          {view.next ? (
            <>
              <p style={{ margin: 0 }}>{view.next.lesson.title}</p>
              <p className="muted" style={{ margin: 0 }}>{view.next.moduleTitle} · {view.next.lesson.durationMin} min</p>
              <Link to={`/app/roadmap/lesson/${view.next.lesson.id}`} className="btn btn-primary">Open lesson</Link>
            </>
          ) : (
            <p className="muted">Your current roadmap is complete. Regenerate it or take another assessment.</p>
          )}
          <h3 style={{ marginBottom: 0 }}>Skills</h3>
          <p style={{ margin: 0 }}><strong>{view.mastered.length}</strong> mastered from assessments · <strong>{view.improving.length}</strong> still open</p>
          <div className="chip-row">
            {view.snapshots.map((snapshot) => {
              const Icon = icons[snapshot.skill]
              return (
                <span key={snapshot.skill} className={snapshot.source === 'assessment' ? 'badge' : 'badge badge-muted'} title={snapshot.source === 'assessment' ? 'From a saved assessment' : 'Not yet assessed'}>
                  <Icon size={14} aria-hidden="true" /> {snapshot.label} {snapshot.proficiency}%
                </span>
              )
            })}
          </div>
          {view.snapshots.length ? <SkillRadar rows={view.snapshots.map((snapshot) => ({ skill: snapshot.skill, current: snapshot.proficiency, target: snapshot.target }))} /> : <p className="muted">Assess a skill to draw the gap chart.</p>}
        </article>
      </section>
      <section className="grid-2">
        <article className="card card-pad">
          <h2 style={{ marginTop: 0 }}>Badges</h2>
          <div className="chip-row">
            {view.badges.map((badge) => (
              <span key={badge.id} className={badge.earned ? 'badge badge-good' : 'badge badge-muted'}>{badge.title}</span>
            ))}
          </div>
          <Link to="/app/achievements" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>Open collection</Link>
        </article>
        <article className="card card-pad">
          <h2 style={{ marginTop: 0 }}>Milestones</h2>
          {data.roadmap ? data.roadmap.modules.map((module) => {
            const done = module.lessons.filter((lesson) => data.lessonCompletions[lesson.id]).length
            return (
              <div key={module.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{module.title}</strong><span className="muted">{done}/{module.lessons.length}</span></div>
                <p className="muted" style={{ margin: '0.15rem 0 0' }}>{module.checkpoint}</p>
              </div>
            )
          }) : <p className="muted">No roadmap yet.</p>}
        </article>
      </section>
      <section className="card card-pad">
        <h2 style={{ marginTop: 0 }}>Recent activity</h2>
        {activity.length === 0 ? (
          <div style={{ maxWidth: 360 }}>
            <EmptyArt label="No learning activity yet" />
            <p className="muted">Finish a lesson or assessment and it will show up here.</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {activity.map((item) => (
              <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span>{item.label}</span>
                <span className="muted">{formatWhen(item.date)} · {item.xp} XP</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
