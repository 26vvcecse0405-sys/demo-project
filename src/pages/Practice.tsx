import { formatWhen } from '@shared/dates'
import { scoreAnswers } from '@shared/learning'
import { QUIZ_TOPICS } from '@shared/extraBank'
import { FLASHCARDS } from '@shared/questions'
import { SKILL_LABEL, uid, type Difficulty, type SkillId } from '@shared/types'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyArt, FlashArt, QuizArt } from '@/components/art'
import { ScoreChart } from '@/components/Charts'
import { QuestionRunner, type ReviewedQuestion } from '@/components/QuestionRunner'
import { PageHeader, SourceNote, usePageTitle } from '@/components/ui'
import { useLearning } from '@/context/LearningContext'
import { openFlashcards, openQuestionSession, revealQuestion, type PracticeSession } from '@/services/api'

interface Card { id: string; front: string; back: string; topic: string }

const SKILLS = new Set<string>(['programming', 'web', 'ai', 'data', 'design', 'business', 'communication'])

function isSkill(value: string | null): value is SkillId {
  return Boolean(value && SKILLS.has(value))
}

export function Practice() {
  const { data, view, saveQuiz, markCard } = useLearning()
  const [params] = useSearchParams()
  const requested = QUIZ_TOPICS.find((topic) => topic.topic === params.get('topic') || topic.label === params.get('topic') || topic.id === params.get('topic'))
  const [tab, setTab] = useState<'quiz' | 'cards'>(params.get('tab') === 'cards' ? 'cards' : 'quiz')
  const [topicId, setTopicId] = useState(requested?.id ?? 'python')
  const [skill, setSkill] = useState<SkillId>(requested?.skill ?? (isSkill(params.get('skill')) ? params.get('skill') as SkillId : view.snapshots[0]?.skill ?? 'programming'))
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner')
  const [session, setSession] = useState<PracticeSession | null>(null)
  const [result, setResult] = useState<{ score: number; correct: number; total: number; wrong: string[]; source: string } | null>(null)
  const [cards, setCards] = useState<Card[] | null>(null)
  const [cardNote, setCardNote] = useState<string | undefined>()
  const [cardSource, setCardSource] = useState<string | undefined>()
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewOnly, setReviewOnly] = useState(false)
  const [busy, setBusy] = useState(false)
  usePageTitle('Practice Zone')

  const topic = QUIZ_TOPICS.find((item) => item.id === topicId) ?? QUIZ_TOPICS[0]
  const chart = data.quizAttempts.slice(-6).map((attempt, index) => ({ label: `${index + 1}`, score: attempt.scorePercent }))
  const reviewPool = useMemo(
    () => FLASHCARDS.filter((card) => data.cardMarks[card.id] === 'review' && card.skill === skill),
    [data.cardMarks, skill],
  )

  function chooseTopic(id: string) {
    const next = QUIZ_TOPICS.find((item) => item.id === id)
    if (!next) return
    setTopicId(next.id)
    setSkill(next.skill)
    setSession(null)
    setResult(null)
  }

  async function generateQuiz() {
    setBusy(true)
    setResult(null)
    setSession(await openQuestionSession('quiz', { skill: topic.skill, difficulty, count: 4, topic: topic.topic }))
    setBusy(false)
  }

  function finish(reviewed: ReviewedQuestion[]) {
    if (!session) return
    const scored = scoreAnswers(
      reviewed.map((item) => ({ id: item.id, correctIndex: item.correctIndex })),
      Object.fromEntries(reviewed.map((item) => [item.id, item.selectedIndex])),
    )
    const wrongTopics = [...new Set(reviewed.filter((item) => !item.correct).map((item) => item.topic))]
    saveQuiz({
      id: uid('quiz'),
      topic: topic.label,
      skill: topic.skill,
      difficulty,
      scorePercent: scored.scorePercent,
      correct: scored.correct,
      total: scored.total,
      wrongTopics,
      completedAt: new Date().toISOString(),
      source: session.source,
    })
    setResult({ score: scored.scorePercent, correct: scored.correct, total: scored.total, wrong: wrongTopics, source: session.source })
    setSession(null)
  }

  async function generateCards(missedTopics?: string[]) {
    setBusy(true)
    setReviewOnly(false)
    const response = await openFlashcards(topic.skill, 6, topic.topic, difficulty === 'advanced' ? 'intermediate' : difficulty)
    const filtered = missedTopics?.length
      ? response.cards.filter((card) => missedTopics.includes(card.topic))
      : response.cards
    const deck = filtered.length ? filtered : response.cards
    setCards(deck)
    setCardNote(response.notice)
    setCardSource(response.source)
    setCardIndex(0)
    setFlipped(false)
    setTab('cards')
    setBusy(false)
  }

  function openReview() {
    const deck = reviewPool.length ? reviewPool : FLASHCARDS.filter((card) => card.skill === topic.skill && card.topic === topic.topic)
    setCards(deck)
    setCardNote(reviewPool.length ? 'Cards you marked Review again. This set is saved in this browser.' : 'No review cards yet for this skill. Showing the topic set.')
    setCardSource('fallback')
    setCardIndex(0)
    setFlipped(false)
    setReviewOnly(true)
    setTab('cards')
  }

  const card = cards?.[cardIndex]
  const known = cards?.filter((item) => data.cardMarks[item.id] === 'know').length ?? 0

  return (
    <div className="page-enter" style={{ display: 'grid', gap: 16 }}>
      <PageHeader kicker="Practice" title="Quiz and flashcards" text="Pick a topic and a difficulty. Scores come from the answers you submit. Built-in questions are labeled as the question bank, not as a live model." />
      <div className="chip-row">
        <button type="button" className={tab === 'quiz' ? 'chip chip-active' : 'chip'} onClick={() => setTab('quiz')}>Quiz</button>
        <button type="button" className={tab === 'cards' ? 'chip chip-active' : 'chip'} onClick={() => setTab('cards')}>Flashcards</button>
      </div>
      <section className="card card-pad" style={{ display: 'grid', gap: 12 }}>
        <div>
          <span className="field-label">Topic</span>
          <div className="chip-row">
            {QUIZ_TOPICS.map((item) => (
              <button type="button" key={item.id} className={topicId === item.id ? 'chip chip-active' : 'chip'} onClick={() => chooseTopic(item.id)}>{item.label}</button>
            ))}
          </div>
        </div>
        <div>
          <span className="field-label">Difficulty</span>
          <div className="chip-row">
            {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map((item) => (
              <button type="button" key={item} className={difficulty === item ? 'chip chip-active' : 'chip'} onClick={() => setDifficulty(item)}>{item}</button>
            ))}
          </div>
        </div>
        <p className="field-help">Skill focus: {SKILL_LABEL[topic.skill]}. Questions prefer this topic and difficulty, then fill from the same skill.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void (tab === 'quiz' ? generateQuiz() : generateCards())}>
            {busy ? 'Preparing…' : tab === 'quiz' ? 'Start quiz' : 'Start flashcards'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={openReview}>Review missed cards</button>
        </div>
      </section>

      {tab === 'quiz' && session ? (
        <>
          <SourceNote source={session.source} notice={session.notice} />
          <QuestionRunner allowTimer questions={session.questions} onReveal={(id, index) => revealQuestion(session, id, index)} onFinish={finish} />
        </>
      ) : null}

      {tab === 'quiz' && result ? (
        <section className="card card-pad" style={{ display: 'grid', gap: 12 }}>
          <div className="grid-2" style={{ alignItems: 'center' }}>
            <QuizArt />
            <div>
              <h2 style={{ margin: 0 }}>{result.score}% accuracy</h2>
              <p>{result.correct} of {result.total} correct on {topic.label}.</p>
              <p className="muted">{result.source === 'ai' ? 'Scored from an OpenAI set.' : 'Scored from the built-in bank. These questions were not generated by a live model.'}</p>
            </div>
          </div>
          {result.wrong.length ? (
            <div>
              <strong>Review next</strong>
              <div className="chip-row" style={{ marginTop: 8 }}>
                {result.wrong.map((item) => <span key={item} className="badge badge-warn">{item}</span>)}
              </div>
              <p>Practice the ideas you missed before raising the difficulty.</p>
            </div>
          ) : <p>Nothing to restudy from this set. The next step is a harder quiz or the next roadmap lesson.</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" onClick={() => void generateQuiz()}>Retry quiz</button>
            <button type="button" className="btn btn-secondary" onClick={() => void generateCards(result.wrong)}>Practice the misses</button>
          </div>
        </section>
      ) : null}

      {tab === 'quiz' && !session && !result ? (
        <div style={{ maxWidth: 420 }}><QuizArt /></div>
      ) : null}

      {tab === 'cards' && cards && card ? (
        <section style={{ display: 'grid', gap: 12 }}>
          <SourceNote source={cardSource} notice={cardNote} />
          {reviewOnly ? <p className="banner">Review mode. These are cards you asked to see again.</p> : null}
          <div className="flip-scene">
            <button type="button" className={flipped ? 'flip-card is-flipped' : 'flip-card'} onClick={() => setFlipped((value) => !value)} aria-label={flipped ? 'Hide the answer' : 'Reveal the answer'}>
              <article className="card card-pad flip-face">
                <p className="kicker">Question · {card.topic}</p>
                <h2 style={{ margin: 0 }}>{card.front}</h2>
                <p className="muted">Tap the card to reveal the answer.</p>
              </article>
              <article className="card card-pad flip-face flip-back">
                <p className="kicker">Answer · {card.topic}</p>
                <h2 style={{ margin: 0 }}>{card.back}</h2>
              </article>
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-ghost" onClick={() => { setCardIndex((value) => (value - 1 + cards.length) % cards.length); setFlipped(false) }}>Previous</button>
            <span className="muted">{cardIndex + 1} / {cards.length} · {known} known</span>
            <button type="button" className="btn btn-ghost" onClick={() => { setCardIndex((value) => (value + 1) % cards.length); setFlipped(false) }}>Next</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" onClick={() => { markCard(card.id, 'know', card.topic); setCardIndex((value) => (value + 1) % cards.length); setFlipped(false) }}>Know it</button>
            <button type="button" className="btn btn-secondary" onClick={() => { markCard(card.id, 'review', card.topic); setCardIndex((value) => (value + 1) % cards.length); setFlipped(false) }}>Review again</button>
          </div>
          <div className="meter" aria-label="Flashcard progress"><span style={{ width: `${cards.length ? Math.round((known / cards.length) * 100) : 0}%` }} /></div>
        </section>
      ) : null}

      {tab === 'cards' && !cards ? (
        <div style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
          <FlashArt />
          {reviewPool.length === 0 ? <EmptyArt label="No review cards yet" /> : <p className="muted">{reviewPool.length} saved card{reviewPool.length === 1 ? '' : 's'} waiting in review.</p>}
        </div>
      ) : null}

      <section className="card card-pad">
        <h2 style={{ marginTop: 0 }}>Previous quizzes</h2>
        {chart.length ? <ScoreChart rows={chart} /> : <p className="muted">No quiz attempts yet. Start a topic above and the chart will use those saved scores.</p>}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {[...data.quizAttempts].reverse().map((attempt) => (
            <li key={attempt.id} style={{ marginTop: 8 }}>
              <strong>{attempt.topic} · {attempt.scorePercent}%</strong>
              <span className="muted"> · {formatWhen(attempt.completedAt)} · {attempt.source === 'ai' ? 'OpenAI' : attempt.source === 'demo' ? 'sample data' : 'built-in bank'}</span>
              {attempt.wrongTopics.length ? <span className="muted"> · review {attempt.wrongTopics.join(', ')}</span> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
