import { hoursLabel } from '@shared/learning'
import { SKILL_LABEL } from '@shared/types'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PathArt } from '@/components/art'
import { Dialog, PageHeader, SourceNote, usePageTitle } from '@/components/ui'
import { useLearning } from '@/context/LearningContext'
import { requestRoadmap } from '@/services/api'

export function RoadmapPage() {
  const { data, view, toggleLesson, updateProfile, setRoadmap } = useLearning()
  const roadmap = data.roadmap
  const [openId, setOpenId] = useState<string | null>(view.next?.lesson.id ?? null)
  const [hours, setHours] = useState(data.profile?.weeklyHours ?? 5)
  const [weeks, setWeeks] = useState(data.profile?.targetWeeks ?? 6)
  const [notice, setNotice] = useState<string | undefined>(roadmap?.source === 'demo' ? 'Sample roadmap for this demo student. Regenerate to build a new plan.' : undefined)
  const [source, setSource] = useState(roadmap?.source)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)
  usePageTitle('My Roadmap')

  async function regenerate() {
    if (!data.profile) return
    setBusy(true)
    setConfirm(false)
    const profile = { ...data.profile, weeklyHours: hours, targetWeeks: weeks }
    updateProfile({ weeklyHours: hours, targetWeeks: weeks })
    const result = await requestRoadmap(profile, view.snapshots)
    setRoadmap(result.roadmap)
    setSource(result.source)
    setNotice(result.notice)
    setOpenId(result.roadmap.modules[0]?.lessons.find((lesson) => !data.lessonCompletions[lesson.id])?.id ?? result.roadmap.modules[0]?.lessons[0]?.id ?? null)
    setBusy(false)
  }

  if (!roadmap || !data.profile) {
    return <PageHeader title="No roadmap yet" text="Finish onboarding to generate the first plan." />
  }

  const spare = roadmap.budgetMin - roadmap.plannedMin
  const selected = roadmap.modules.flatMap((module) => module.lessons.map((lesson) => ({ lesson, module }))).find((item) => item.lesson.id === openId)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <PageHeader kicker={data.profile.careerGoal} title="Your learning sprint" text={`${roadmap.level} starting point · about ${hoursLabel(roadmap.plannedMin)} estimated of ${hoursLabel(roadmap.budgetMin)} available. Times are estimates, not a promise.`} />
      <SourceNote source={source} notice={notice ?? (roadmap.source === 'demo' ? 'Sample roadmap. It is not a live model response.' : roadmap.source === 'ai' ? 'Generated with OpenAI. Lesson time was fitted by the app.' : 'Built-in catalog roadmap, fitted to your hours.')} />
      {view.snapshots.some((snapshot) => snapshot.source !== 'assessment') ? <p className="banner">Some skills still use a placeholder until you assess them. Regenerate after an assessment to reorder the sprint.</p> : null}
      <section className="card card-pad" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <p className="kicker">Goal · {data.profile.careerGoal}</p>
          <strong>{view.next ? view.next.lesson.title : 'Roadmap complete'}</strong>
          <p className="muted" style={{ margin: 0 }}>{view.progress}% complete · {roadmap.level} level · {spare > 0 ? `${hoursLabel(spare)} left for review and quizzes.` : 'The plan uses the full time budget.'}</p>
        </div>
        {view.next ? <Link className="btn btn-primary" to={`/app/roadmap/lesson/${view.next.lesson.id}`}>Resume lesson</Link> : null}
      </section>
      <section className="card card-pad" style={{ display: 'grid', gap: 10 }}>
        <h2 style={{ margin: 0 }}>Adjust and regenerate</h2>
        <label>{hours} hours / week <input className="input" type="range" min={1} max={20} value={hours} onChange={(event) => setHours(Number(event.target.value))} /></label>
        <label>{weeks} weeks <input className="input" type="range" min={1} max={24} value={weeks} onChange={(event) => setWeeks(Number(event.target.value))} /></label>
        <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => (view.progress > 0 ? setConfirm(true) : void regenerate())}>{busy ? 'Building…' : 'Regenerate roadmap'}</button>
      </section>
      <div className="grid-2">
        <div className="timeline">
          <PathArt />
          {roadmap.modules.map((module, moduleIndex) => {
            const previous = moduleIndex > 0 ? roadmap.modules[moduleIndex - 1] : null
            const locked = Boolean(previous && previous.lessons.some((lesson) => !data.lessonCompletions[lesson.id]))
            const doneCount = module.lessons.filter((lesson) => data.lessonCompletions[lesson.id]).length
            const state = locked ? 'locked' : doneCount === module.lessons.length ? 'done' : doneCount > 0 ? 'progress' : 'available'
            const earlierSameSkill = roadmap.modules.slice(0, moduleIndex).filter((item) => item.skill === module.skill).length
            const stage = earlierSameSkill === 0 ? roadmap.level : roadmap.level === 'beginner' ? 'intermediate' : 'advanced'
            const stateLabel = state === 'locked' ? 'Locked' : state === 'done' ? 'Completed' : state === 'progress' ? 'In progress' : 'Available'
            return (
              <div key={module.id} className="timeline-item">
                <div className="rail"><span className="node" /><span className="line" /></div>
                <article className={`card card-pad journey-${state}`} style={{ marginBottom: 12 }}>
                  <p className="kicker">{SKILL_LABEL[module.skill]} · {stage} stage · {stateLabel}</p>
                  <h2 style={{ margin: '0.15rem 0' }}>{module.title}</h2>
                  <p className="muted">{module.summary}</p>
                  <p className="field-help">{hoursLabel(module.lessons.reduce((sum, lesson) => sum + lesson.durationMin, 0))} · {doneCount}/{module.lessons.length} lessons</p>
                  {locked && previous ? <p className="field-help">Finish {previous.title} to unlock this module.</p> : null}
                  <div style={{ display: 'grid', gap: 8 }}>
                    {module.lessons.map((lesson) => {
                      const done = Boolean(data.lessonCompletions[lesson.id])
                      return (
                        <button type="button" key={lesson.id} className={openId === lesson.id ? 'option option-selected' : 'option'} disabled={locked} onClick={() => setOpenId(lesson.id)}>
                          <span>{locked ? 'Lock' : done ? 'Done' : 'Open'}</span>
                          <span><strong>{lesson.title}</strong><br /><span className="muted">{lesson.durationMin} min · {lesson.topics.join(', ')}</span></span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="field-help">Checkpoint quiz: {module.checkpoint}</p>
                  {!locked ? <Link to={`/app/practice?skill=${module.skill}&topic=${encodeURIComponent(module.skill)}`}>Take the checkpoint</Link> : null}
                </article>
              </div>
            )
          })}
        </div>
        {selected ? (
          <article className="card card-pad" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
            <p className="kicker">{selected.module.title}</p>
            <h2 style={{ margin: 0 }}>{selected.lesson.title}</h2>
            <p><strong>Topics.</strong> {selected.lesson.topics.join(', ')}</p>
            <div>
              <strong>Objectives</strong>
              <ul>{selected.lesson.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
            </div>
            <p><strong>Exercise.</strong> {selected.lesson.exercise}</p>
            <div style={{ display: 'grid', gap: 8 }}>
              {selected.lesson.resources.map((resource) => (
                <div key={resource.id} className="banner">
                  <strong>{resource.title}</strong>
                  <p className="muted" style={{ margin: '0.2rem 0' }}>{resource.type} · {resource.difficulty} · {resource.durationMin} min</p>
                  <p style={{ margin: 0 }}>{resource.why}</p>
                  {resource.verified && resource.url ? <a href={resource.url} target="_blank" rel="noreferrer">Open verified resource</a> : <span className="badge badge-muted">Suggested topic</span>}
                </div>
              ))}
              {selected.lesson.resources.length === 0 ? <p className="muted">No external link for this lesson. Use the exercise as the study task.</p> : null}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link className="btn btn-primary" to={`/app/roadmap/lesson/${selected.lesson.id}`}>Study this lesson</Link>
              <button type="button" className="btn btn-secondary" onClick={() => toggleLesson(selected.lesson.id)}>
                {data.lessonCompletions[selected.lesson.id] ? 'Mark as not done' : 'Mark lesson complete'}
              </button>
            </div>
          </article>
        ) : null}
      </div>
      <Dialog open={confirm} title="Regenerate this roadmap?" onClose={() => setConfirm(false)}>
        <p>Lessons that still exist on the new path stay complete. A model-written plan uses new lesson ids, so those completions will not carry over.</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => setConfirm(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={() => void regenerate()}>Regenerate</button>
        </div>
      </Dialog>
    </div>
  )
}
