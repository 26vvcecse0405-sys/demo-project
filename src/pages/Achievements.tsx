import { BadgeArt, TrophyArt } from '@/components/art'
import { PageHeader, usePageTitle } from '@/components/ui'
import { useLearning } from '@/context/LearningContext'

export function Achievements() {
  const { view, data } = useLearning()
  usePageTitle('Achievements')
  const bestQuiz = data.quizAttempts.reduce((best, attempt) => Math.max(best, attempt.scorePercent), 0)
  const modulesDone = data.roadmap?.modules.filter((module) => module.lessons.length > 0 && module.lessons.every((lesson) => data.lessonCompletions[lesson.id])).length ?? 0
  const hints: Record<string, string> = {
    'first-sprint': view.badges.find((badge) => badge.id === 'first-sprint')?.earned ? 'Earned from a completed lesson.' : 'Complete any lesson.',
    'quiz-champion': `Best saved quiz: ${bestQuiz}%. Need 80%.`,
    'consistency-star': `Best streak from saved dates: ${view.best} / 3 days.`,
    'skill-builder': `${modulesDone} module${modulesDone === 1 ? '' : 's'} fully complete.`,
    'roadmap-explorer': `Roadmap ${view.progress}% complete.`,
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <PageHeader kicker="Achievements" title="Earned only when the condition is true" text="Badges are recalculated from saved lessons, quiz scores, and activity dates. Resetting demo progress locks them again." />
      <TrophyArt />
      <section className="grid-2">
        {view.badges.map((badge) => (
          <article key={badge.id} className="card card-pad" style={{ opacity: badge.earned ? 1 : 0.72 }}>
            <BadgeArt id={badge.id} title={badge.title} />
            <p className={badge.earned ? 'badge badge-good' : 'badge badge-muted'}>{badge.earned ? 'Earned' : 'Locked'}</p>
            <h2>{badge.title}</h2>
            <p>{badge.description}</p>
            <p className="muted">{hints[badge.id]}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
