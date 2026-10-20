import { lessonExtra } from '@shared/lessonDetails'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { PageHeader, usePageTitle } from '@/components/ui'
import { useLearning } from '@/context/LearningContext'

function highlight(code: string) {
  const pattern = /(#.*$|\/\/.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:def|return|if|elif|else|for|in|try|except|const|let|function|class|import|from|SELECT|FROM|WHERE)\b)/gm
  const nodes: Array<{ text: string; kind?: string }> = []
  let cursor = 0
  for (const match of code.matchAll(pattern)) {
    const index = match.index ?? 0
    if (index > cursor) nodes.push({ text: code.slice(cursor, index) })
    const token = match[0]
    const kind = token.startsWith('#') || token.startsWith('//') ? 'tok-cmt' : token.startsWith('"') || token.startsWith("'") ? 'tok-str' : 'tok-key'
    nodes.push({ text: token, kind })
    cursor = index + token.length
  }
  if (cursor < code.length) nodes.push({ text: code.slice(cursor) })
  return nodes
}

export function LessonPage() {
  const { lessonId = '' } = useParams()
  const navigate = useNavigate()
  const { data, toggleLesson } = useLearning()
  const [checkChoice, setCheckChoice] = useState<number | null>(null)
  const roadmap = data.roadmap
  const placed = roadmap?.modules.flatMap((module, moduleIndex) => module.lessons.map((lesson) => ({ lesson, module, moduleIndex }))) ?? []
  const current = placed.find((item) => item.lesson.id === lessonId)
  usePageTitle(current?.lesson.title ?? 'Lesson')

  if (!roadmap || !current) return <PageHeader title="Lesson not on this roadmap" text="Open the roadmap and pick a lesson from the current sprint." />

  const previousModule = current.moduleIndex > 0 ? roadmap.modules[current.moduleIndex - 1] : null
  const locked = Boolean(previousModule && previousModule.lessons.some((lesson) => !data.lessonCompletions[lesson.id]))
  if (locked) return <Navigate to="/app/roadmap" replace />

  const extra = lessonExtra(current.lesson, current.module.skill)
  const done = Boolean(data.lessonCompletions[current.lesson.id])
  const order = placed.filter((item) => {
    const prior = item.moduleIndex > 0 ? roadmap.modules[item.moduleIndex - 1] : null
    const itemLocked = Boolean(prior && prior.lessons.some((lesson) => !data.lessonCompletions[lesson.id] && lesson.id !== current.lesson.id))
    return !itemLocked
  })
  const position = placed.findIndex((item) => item.lesson.id === current.lesson.id)
  const following = placed[position + 1]
  const followingLocked = Boolean(following && following.moduleIndex > current.moduleIndex && current.module.lessons.some((lesson) => lesson.id !== current.lesson.id && !data.lessonCompletions[lesson.id]))
  const revealed = checkChoice !== null

  const activeId = current.lesson.id
  const nextId = following?.lesson.id
  function completeAndContinue() {
    if (!done) toggleLesson(activeId)
    if (nextId) navigate(`/app/roadmap/lesson/${nextId}`)
    else navigate('/app/roadmap')
  }

  return (
    <div className="page-enter" style={{ display: 'grid', gap: 16 }}>
      <PageHeader kicker={`${current.module.title} · ${current.lesson.durationMin} min`} title={current.lesson.title} text={extra.overview} />
      <section className="card card-pad" style={{ display: 'grid', gap: 8 }}>
        <h2 style={{ margin: 0 }}>Learning objectives</h2>
        <ul>{current.lesson.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
        <p className="muted" style={{ margin: 0 }}>Topics: {current.lesson.topics.join(', ')}</p>
      </section>
      <section className="card card-pad" style={{ display: 'grid', gap: 10 }}>
        <h2 style={{ margin: 0 }}>{extra.layout === 'code' ? 'Walk through the code' : extra.layout === 'business' ? 'Work the decision' : extra.layout === 'communication' ? 'Shape the message' : 'Follow the idea'}</h2>
        <ol>{extra.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        {extra.code ? (
          <figure style={{ margin: 0 }}>
            <pre className="code"><code>{highlight(extra.code.code).map((part, index) => part.kind ? <span key={index} className={part.kind}>{part.text}</span> : <span key={index}>{part.text}</span>)}</code></pre>
            <figcaption className="field-help">{extra.code.language}. {extra.code.caption}</figcaption>
          </figure>
        ) : null}
        <p><strong>Example.</strong> {extra.example}</p>
      </section>
      <section className="card card-pad" style={{ display: 'grid', gap: 8 }}>
        <h2 style={{ margin: 0 }}>Knowledge check</h2>
        <p style={{ margin: 0 }}>{extra.check.prompt}</p>
        {extra.check.choices.map((choice, index) => {
          const selected = checkChoice === index
          const correct = extra.check.correctIndex === index
          const className = revealed ? correct ? 'option option-correct' : selected ? 'option option-wrong' : 'option' : 'option'
          return (
            <button type="button" key={choice} className={className} disabled={revealed} onClick={() => setCheckChoice(index)}>
              <strong style={{ width: 24 }}>{String.fromCharCode(65 + index)}</strong>
              <span>{choice}</span>
            </button>
          )
        })}
        {revealed ? <p className={checkChoice === extra.check.correctIndex ? 'banner banner-good' : 'banner banner-warn'}>{extra.check.explanation} This check does not award XP.</p> : null}
      </section>
      <section className="card card-pad" style={{ display: 'grid', gap: 8 }}>
        <h2 style={{ margin: 0 }}>Practice task</h2>
        <p style={{ margin: 0 }}>{current.lesson.exercise}</p>
        <p className="field-help">Checkpoint: {current.module.checkpoint}</p>
        <Link className="btn btn-secondary" to={`/app/practice?skill=${current.module.skill}&topic=${encodeURIComponent(current.lesson.topics[0] ?? current.module.skill)}`}>Open a checkpoint quiz</Link>
        {current.lesson.resources.map((resource) => (
          <div key={resource.id} className="banner">
            <strong>{resource.title}</strong>
            <p style={{ margin: '0.25rem 0' }}>{resource.why}</p>
            {resource.verified && resource.url ? <a href={resource.url} target="_blank" rel="noreferrer">Open verified resource</a> : <span className="badge badge-muted">Suggested topic, no external link</span>}
          </div>
        ))}
      </section>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-primary" disabled={done} onClick={() => toggleLesson(current.lesson.id)}>{done ? 'Completed' : 'Mark as complete'}</button>
        {following && !followingLocked ? (
          <button type="button" className="btn btn-secondary" onClick={completeAndContinue}>{done ? 'Next lesson' : 'Complete and continue'}</button>
        ) : following ? (
          <p className="muted">Finish the other lessons in this module to unlock the next one.</p>
        ) : (
          <Link className="btn btn-secondary" to="/app/roadmap">Back to roadmap</Link>
        )}
        {order.length > 1 ? <Link className="btn btn-ghost" to="/app/roadmap">All modules</Link> : null}
      </div>
    </div>
  )
}
