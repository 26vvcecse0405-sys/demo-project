import { scoreAnswers } from '@shared/learning'
import { SKILL_LABEL, type Difficulty, type SkillId } from '@shared/types'
import { uid } from '@shared/types'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CompleteArt } from '@/components/art'
import { QuestionRunner, type ReviewedQuestion } from '@/components/QuestionRunner'
import { PageHeader, ProgressRing, SourceNote, usePageTitle } from '@/components/ui'
import { useLearning } from '@/context/LearningContext'
import { formatWhen } from '@shared/dates'
import { localDate } from '@shared/dates'
import { openQuestionSession, revealQuestion, type PracticeSession } from '@/services/api'

export function Assessment() {
  const { data, view, saveAttempt, updateProfile } = useLearning()
  const skills = view.snapshots.map((snapshot) => snapshot.skill)
  const [skill, setSkill] = useState<SkillId>(skills[0] ?? 'programming')
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner')
  const [goal, setGoal] = useState(data.profile?.careerGoal ?? '')
  const [session, setSession] = useState<PracticeSession | null>(null)
  const [results, setResults] = useState<ReviewedQuestion[] | null>(null)
  const [busy, setBusy] = useState(false)
  usePageTitle('Skill Assessment')

  async function start() {
    const careerGoal = goal.trim()
    if (careerGoal && careerGoal !== data.profile?.careerGoal) updateProfile({ careerGoal })
    setBusy(true)
    setResults(null)
    const next = await openQuestionSession('assessment', {
      skill,
      difficulty,
      count: 5,
      careerGoal: careerGoal || data.profile?.careerGoal,
      knownSkills: data.profile?.knownSkills,
    })
    setSession(next)
    setBusy(false)
  }

  function finish(reviewed: ReviewedQuestion[]) {
    if (!session) return
    const scored = scoreAnswers(reviewed.map((item) => ({ id: item.id, correctIndex: item.correctIndex })), Object.fromEntries(reviewed.map((item) => [item.id, item.selectedIndex])))
    saveAttempt({
      id: uid('attempt'),
      skill,
      difficulty,
      scorePercent: scored.scorePercent,
      correct: scored.correct,
      total: scored.total,
      completedAt: new Date().toISOString(),
      source: session.source,
      questions: reviewed.map((item) => ({
        id: item.id,
        skill,
        topic: item.topic,
        difficulty,
        prompt: item.prompt,
        choices: item.choices,
        correctIndex: item.correctIndex,
        explanation: item.explanation,
        selectedIndex: item.selectedIndex,
      })),
    })
    setResults(reviewed)
    setSession(null)
  }

  const alreadyToday = data.activities.some((activity) => activity.ref === `assessment:${skill}` && activity.date === localDate())
  const topicMap = new Map<string, { correct: number; total: number }>()
  for (const item of results ?? []) {
    const current = topicMap.get(item.topic) ?? { correct: 0, total: 0 }
    current.total += 1
    if (item.correct) current.correct += 1
    topicMap.set(item.topic, current)
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <PageHeader kicker="Assessment" title="Check a skill with real questions" text="Proficiency is estimated from these answers. Your self-reported level does not set the score." />
      {!session && !results ? (
        <section className="card card-pad" style={{ display: 'grid', gap: 12 }}>
          <div>
            <span className="field-label">Skill</span>
            <div className="chip-row">
              {(skills.length ? skills : ['programming' as SkillId]).map((item) => (
                <button type="button" key={item} className={skill === item ? 'chip chip-active' : 'chip'} onClick={() => setSkill(item)}>{SKILL_LABEL[item]}</button>
              ))}
            </div>
          </div>
          <label>
            <span className="field-label">Career goal</span>
            <input className="input" value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="AI product engineer" />
          </label>
          <div>
            <span className="field-label">Difficulty</span>
            <div className="chip-row">
              {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map((item) => (
                <button type="button" key={item} className={difficulty === item ? 'chip chip-active' : 'chip'} onClick={() => setDifficulty(item)}>{item}</button>
              ))}
            </div>
          </div>
          {alreadyToday ? <p className="field-help">You already earned assessment XP for this skill today. A retry still saves the new score.</p> : null}
          {busy ? (
            <div style={{ display: 'grid', gap: 8 }} aria-hidden="true">
              <div className="skeleton" />
              <div className="skeleton" style={{ width: '80%' }} />
              <div className="skeleton" style={{ width: '62%' }} />
            </div>
          ) : null}
          <button type="button" className="btn btn-primary" onClick={() => void start()} disabled={busy || goal.trim().length < 2}>{busy ? 'Preparing questions…' : 'Start assessment'}</button>
        </section>
      ) : null}
      {session ? (
        <>
          <SourceNote source={session.source} notice={session.notice} />
          <QuestionRunner questions={session.questions} onReveal={(id, index) => revealQuestion(session, id, index)} onFinish={finish} />
        </>
      ) : null}
      {results ? (
        <section className="card card-pad" style={{ display: 'grid', gap: 12 }}>
          <div className="grid-2" style={{ alignItems: 'center' }}>
            <CompleteArt />
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <ProgressRing value={Math.round((results.filter((item) => item.correct).length / results.length) * 100)} label="Score" />
              <div>
                <h2 style={{ margin: 0 }}>{results.filter((item) => item.correct).length} of {results.length} correct</h2>
                <p className="muted">Strong topics are at 70% or above. Everything else is a practice target.</p>
              </div>
            </div>
          </div>
          <div className="grid-2">
            <div>
              <h3 style={{ marginTop: 0 }}>Strengths</h3>
              <div className="chip-row">
                {[...topicMap.entries()].filter(([, stats]) => stats.correct / stats.total >= 0.7).map(([topic, stats]) => (
                  <span key={topic} className="badge badge-good">{topic} · {Math.round((stats.correct / stats.total) * 100)}%</span>
                ))}
                {[...topicMap.values()].every((stats) => stats.correct / stats.total < 0.7) ? <span className="muted">No topic reached 70% on this check.</span> : null}
              </div>
            </div>
            <div>
              <h3 style={{ marginTop: 0 }}>Practice next</h3>
              <div className="chip-row">
                {[...topicMap.entries()].filter(([, stats]) => stats.correct / stats.total < 0.7).map(([topic, stats]) => (
                  <span key={topic} className="badge badge-warn">{topic} · {Math.round((stats.correct / stats.total) * 100)}%</span>
                ))}
                {[...topicMap.values()].every((stats) => stats.correct / stats.total >= 0.7) ? <span className="muted">Every topic on this check was strong.</span> : null}
              </div>
            </div>
          </div>
          <p className="field-help">Saving this score refits the catalog roadmap to your latest evidence. If a live model is configured, use Regenerate on the roadmap for a model-written plan.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link to="/app/gaps" className="btn btn-primary">See skill gaps</Link>
            <Link to="/app/roadmap" className="btn btn-secondary">Open roadmap</Link>
            {[...topicMap.entries()].sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total).slice(0, 1).map(([topic]) => (
              <Link key={topic} to={`/app/practice?skill=${skill}&topic=${encodeURIComponent(topic)}`} className="btn btn-secondary">Practice {topic}</Link>
            ))}
            <button type="button" className="btn btn-ghost" onClick={() => setResults(null)}>Retake assessment</button>
          </div>
        </section>
      ) : null}
      <section className="card card-pad">
        <h2 style={{ marginTop: 0 }}>Saved attempts</h2>
        {data.attempts.length === 0 ? <p className="muted">No assessment has been saved yet.</p> : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {[...data.attempts].reverse().map((attempt) => (
              <li key={attempt.id}>
                <strong>{SKILL_LABEL[attempt.skill]} · {attempt.scorePercent}%</strong>
                <span className="muted"> · {attempt.difficulty} · {formatWhen(attempt.completedAt)} · {attempt.source === 'ai' ? 'OpenAI' : attempt.source === 'demo' ? 'sample data' : 'built-in bank'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
