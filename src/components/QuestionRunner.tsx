import { useEffect, useState } from 'react'
import type { PublicQuestion } from '@/services/api'
import { Button } from './ui'

interface Reveal {
  correct: boolean
  correctIndex: number
  explanation: string
}

export interface ReviewedQuestion extends PublicQuestion, Reveal {
  selectedIndex: number
}

function clock(total: number) {
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function QuestionRunner({
  questions,
  onReveal,
  onFinish,
  allowTimer = false,
}: {
  questions: PublicQuestion[]
  onReveal: (questionId: string, selectedIndex: number) => Promise<Reveal>
  onFinish: (results: ReviewedQuestion[]) => void
  allowTimer?: boolean
}) {
  const key = questions.map((question) => question.id).join('|')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, ReviewedQuestion>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [timerOn, setTimerOn] = useState(false)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    setIndex(0)
    setAnswers({})
    setError(null)
    setSeconds(0)
  }, [key])

  useEffect(() => {
    setSeconds(0)
    if (!timerOn) return
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [index, key, timerOn])

  const question = questions[index]
  if (!question) return null
  const saved = answers[question.id]
  const reveal = saved ? { correct: saved.correct, correctIndex: saved.correctIndex, explanation: saved.explanation } : null
  const picked = saved?.selectedIndex ?? null
  const answeredCount = questions.filter((item) => answers[item.id]).length
  const width = Math.round((answeredCount / questions.length) * 100)
  const dots = question.difficulty === 'advanced' ? 3 : question.difficulty === 'intermediate' ? 2 : 1

  async function choose(choice: number) {
    if (reveal || busy) return
    setBusy(true)
    setError(null)
    try {
      const result = await onReveal(question.id, choice)
      setAnswers((current) => ({ ...current, [question.id]: { ...question, selectedIndex: choice, ...result } }))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not check that answer.')
    } finally {
      setBusy(false)
    }
  }

  function finish() {
    const ordered = questions.map((item) => answers[item.id]).filter((item): item is ReviewedQuestion => Boolean(item))
    if (ordered.length === questions.length) onFinish(ordered)
  }

  return (
    <div className="card card-pad glow" style={{ display: 'grid', gap: '1rem' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <p className="kicker" style={{ margin: 0 }}>Question {index + 1} of {questions.length}</p>
          <span className="diff-pips" aria-label={`${question.difficulty} difficulty`}>
            {[1, 2, 3].map((pip) => <span key={pip} className={pip <= dots ? 'diff-pip on' : 'diff-pip'} />)}
            <span className="badge">{question.topic}</span>
          </span>
        </div>
        <div className="meter" style={{ marginTop: 8 }} role="progressbar" aria-valuenow={width} aria-valuemin={0} aria-valuemax={100} aria-label="Assessment progress">
          <span style={{ width: `${width}%` }} />
        </div>
      </div>
      {allowTimer ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
          <button type="button" className={timerOn ? 'chip chip-active' : 'chip'} onClick={() => setTimerOn((value) => !value)}>
            {timerOn ? 'Timer on' : 'Timer off'}
          </button>
          <span className="muted">{timerOn ? clock(seconds) : 'Optional. It does not submit for you.'}</span>
        </div>
      ) : null}
      <h2 style={{ margin: 0, fontSize: '1.35rem' }}>{question.prompt}</h2>
      <div style={{ display: 'grid', gap: 8 }} role="radiogroup" aria-label="Answer choices">
        {question.choices.map((choice, choiceIndex) => {
          const selected = picked === choiceIndex
          const correctChoice = reveal?.correctIndex === choiceIndex
          const className = reveal
            ? correctChoice ? 'option option-correct' : selected ? 'option option-wrong' : 'option'
            : selected ? 'option option-selected' : 'option'
          return (
            <button key={choice} type="button" className={className} onClick={() => choose(choiceIndex)} disabled={Boolean(reveal) || busy} aria-pressed={selected}>
              <strong style={{ width: 24 }}>{String.fromCharCode(65 + choiceIndex)}</strong>
              <span>{choice}</span>
            </button>
          )
        })}
      </div>
      {error ? <p className="field-error">{error}</p> : null}
      {reveal ? (
        <div className={reveal.correct ? 'banner banner-good feedback-pop' : 'banner banner-warn feedback-pop'}>
          <strong>{reveal.correct ? 'Correct.' : `The answer is ${String.fromCharCode(65 + reveal.correctIndex)}.`}</strong>
          <p style={{ margin: '0.35rem 0 0' }}>{reveal.explanation}</p>
        </div>
      ) : null}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <Button variant="ghost" onClick={() => setIndex((value) => value - 1)} disabled={index === 0}>Previous</Button>
        {index === questions.length - 1 ? (
          <Button onClick={finish} disabled={!reveal}>See results</Button>
        ) : (
          <Button onClick={() => setIndex((value) => value + 1)} disabled={!reveal}>Next question</Button>
        )}
      </div>
    </div>
  )
}
