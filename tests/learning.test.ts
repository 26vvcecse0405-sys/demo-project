import { describe, expect, it } from 'vitest'
import { localDate } from '../shared/dates'
import {
  blendProficiency,
  buildRoadmap,
  buildSnapshots,
  createProfile,
  createSampleWorkspace,
  currentStreak,
  bestStreak,
  lessonCountForBudget,
  priorityScore,
  project,
  quizXp,
  reducer,
  roadmapFromDrafts,
  scoreAnswers,
} from '../shared/learning'
import type { AppData, AssessmentAttempt } from '../shared/types'
import { emptyData } from '../shared/types'

describe('assessment scoring', () => {
  const keys = [
    { id: 'a', correctIndex: 1 },
    { id: 'b', correctIndex: 0 },
    { id: 'c', correctIndex: 2 },
    { id: 'd', correctIndex: 3 },
    { id: 'e', correctIndex: 1 },
  ]

  it('scores only the selected answers', () => {
    const result = scoreAnswers(keys, { a: 1, b: 0, c: 2, d: 0, e: 0 })
    expect(result.correct).toBe(3)
    expect(result.total).toBe(5)
    expect(result.scorePercent).toBe(60)
    expect(result.answers.find((answer) => answer.questionId === 'd')?.correct).toBe(false)
  })

  it('treats a missing answer as incorrect', () => {
    const result = scoreAnswers(keys, { a: 1 })
    expect(result.correct).toBe(1)
    expect(result.scorePercent).toBe(20)
  })

  it('blends the latest attempt more heavily than older ones', () => {
    expect(blendProficiency([60])).toBe(60)
    expect(blendProficiency([60, 40])).toBe(46)
  })
})

describe('time budget and roadmap', () => {
  it('keeps lesson counts inside small and large budgets', () => {
    expect(lessonCountForBudget(20, 8)).toBe(1)
    expect(lessonCountForBudget(60, 8)).toBe(2)
    expect(lessonCountForBudget(240, 8)).toBe(4)
    expect(lessonCountForBudget(2880, 12)).toBe(8)
  })

  it('fits every generated plan inside the stated hours', () => {
    const tight = createProfile({
      displayName: 'Sam Lee',
      educationLevel: 'school',
      interests: ['web-development'],
      careerGoal: 'Web developer',
      experienceLevel: 'beginner',
      knownSkills: [],
      weeklyHours: 2,
      learningStyle: 'practice',
      targetWeeks: 2,
    })
    const roomy = createProfile({
      displayName: 'Sam Lee',
      educationLevel: 'college',
      interests: ['ai', 'data-science'],
      careerGoal: 'Data analyst',
      experienceLevel: 'beginner',
      knownSkills: ['Excel'],
      weeklyHours: 6,
      learningStyle: 'examples',
      targetWeeks: 8,
    })
    for (const profile of [tight, roomy]) {
      const roadmap = buildRoadmap(profile, buildSnapshots(profile, []), 'fallback', '2026-10-20T00:00:00.000Z')
      const planned = roadmap.modules.reduce((sum, module) => sum + module.lessons.reduce((inner, lesson) => inner + lesson.durationMin, 0), 0)
      expect(planned).toBe(roadmap.plannedMin)
      expect(roadmap.plannedMin).toBeLessThanOrEqual(roadmap.budgetMin)
      expect(roadmap.budgetMin).toBe(profile.weeklyHours * profile.targetWeeks * 60)
      expect(roadmap.modules.length).toBeGreaterThan(0)
    }
  })

  it('trims model drafts to the time budget and does not mark lessons complete', () => {
    const profile = createProfile({
      displayName: 'Sam Lee',
      educationLevel: 'college',
      interests: ['ai'],
      careerGoal: 'AI engineer',
      experienceLevel: 'beginner',
      knownSkills: [],
      weeklyHours: 1,
      learningStyle: 'reading',
      targetWeeks: 1,
    })
    const drafts = Array.from({ length: 4 }, (_, index) => ({
      skill: 'ai' as const,
      title: `Module ${index + 1}`,
      summary: 'A short module summary for the sprint.',
      checkpoint: 'Explain the idea without notes.',
      lessons: [
        {
          title: `Lesson ${index + 1}a`,
          topics: ['Models'],
          objectives: ['Explain the idea in plain language.'],
          exercise: 'Write a five-sentence explanation.',
          resourceIds: ['elements-ai', 'https://evil.example/not-allowed'],
        },
        {
          title: `Lesson ${index + 1}b`,
          topics: ['Limits'],
          objectives: ['Name one model limitation.'],
          exercise: 'List two claims you would verify.',
          resourceIds: ['elements-ai'],
        },
      ],
    }))
    const roadmap = roadmapFromDrafts(profile, buildSnapshots(profile, []), drafts, '2026-10-20T00:00:00.000Z')
    expect(roadmap.plannedMin).toBeLessThanOrEqual(60)
    expect(roadmap.source).toBe('ai')
    expect(roadmap.modules.flatMap((module) => module.lessons).every((lesson) => lesson.resources.every((resource) => resource.verified))).toBe(true)
  })
})

describe('skill gaps', () => {
  it('uses assessment evidence ahead of self-reported familiarity', () => {
    const data = createSampleWorkspace('dark')
    const view = project(data, localDate())
    const programming = view.snapshots.find((snapshot) => snapshot.skill === 'programming')
    const ai = view.snapshots.find((snapshot) => snapshot.skill === 'ai')
    const web = view.snapshots.find((snapshot) => snapshot.skill === 'web')
    expect(web?.scorePercent ?? web?.evidence?.scorePercent).toBe(60)
    expect(ai?.evidence?.scorePercent).toBe(40)
    expect(ai?.source).toBe('assessment')
    expect(programming?.source).toBe('self-report')
    expect(programming?.proficiency).toBe(30)
    expect(view.ranked.map((snapshot) => snapshot.skill).slice(0, 3)).toEqual(['ai', 'web', 'programming'])
    expect(priorityScore(ai!)).toBeGreaterThan(priorityScore(web!))
    expect(priorityScore(web!)).toBeGreaterThan(priorityScore(programming!))
    expect(data.roadmap?.plannedMin).toBeLessThanOrEqual(data.roadmap?.budgetMin ?? 0)
  })
})

function attempt(partial: Partial<AssessmentAttempt> & Pick<AssessmentAttempt, 'skill' | 'completedAt'>): AssessmentAttempt {
  return {
    id: partial.id ?? `attempt-${partial.skill}-${partial.completedAt}`,
    skill: partial.skill,
    difficulty: 'beginner',
    questions: [],
    scorePercent: partial.scorePercent ?? 50,
    correct: 1,
    total: 2,
    completedAt: partial.completedAt,
    source: 'fallback',
  }
}

describe('xp, streaks, and achievements', () => {
  it('awards lesson, module, quiz, assessment, and flashcard xp once', () => {
    const profile = createProfile({
      displayName: 'Sam Lee',
      educationLevel: 'college',
      interests: ['communication'],
      careerGoal: 'Technical writer',
      experienceLevel: 'beginner',
      knownSkills: [],
      weeklyHours: 3,
      learningStyle: 'reading',
      targetWeeks: 3,
    })
    let data: AppData = {
      ...emptyData(),
      profile,
      roadmap: buildRoadmap(profile, buildSnapshots(profile, []), 'fallback', '2026-10-18T00:00:00.000Z'),
      workspace: 'custom',
    }
    const lessons = data.roadmap!.modules[0].lessons
    expect(lessons.length).toBeGreaterThan(0)
    data = reducer(data, { type: 'toggle-lesson', lessonId: lessons[0].id, at: '2026-10-18T10:00:00.000Z' })
    expect(project(data, '2026-10-20').xp).toBe(25)
    expect(project(data, '2026-10-20').badges.find((badge) => badge.id === 'first-sprint')?.earned).toBe(true)

    data = reducer(data, { type: 'toggle-lesson', lessonId: lessons[0].id })
    expect(project(data, '2026-10-20').xp).toBe(0)

    for (const lesson of data.roadmap!.modules[0].lessons) {
      data = reducer(data, { type: 'toggle-lesson', lessonId: lesson.id, at: '2026-10-18T12:00:00.000Z' })
    }
    const afterModule = project(data, '2026-10-20')
    expect(afterModule.xp).toBe(25 * data.roadmap!.modules[0].lessons.length + 50)
    expect(afterModule.badges.find((badge) => badge.id === 'skill-builder')?.earned).toBe(true)

    data = reducer(data, {
      type: 'quiz',
      attempt: {
        id: 'quiz-1',
        topic: 'Communication',
        skill: 'communication',
        difficulty: 'beginner',
        scorePercent: 80,
        correct: 4,
        total: 5,
        wrongTopics: [],
        completedAt: '2026-10-19T12:00:00.000Z',
        source: 'fallback',
      },
    })
    expect(quizXp(80)).toBe(30)
    expect(quizXp(79)).toBe(10)
    expect(project(data, '2026-10-20').badges.find((badge) => badge.id === 'quiz-champion')?.earned).toBe(true)

    const beforeCards = project(data, '2026-10-20').xp
    data = reducer(data, { type: 'card', cardId: 'card-1', mark: 'know', label: 'Structure', at: '2026-10-20T09:00:00.000Z' })
    data = reducer(data, { type: 'card', cardId: 'card-1', mark: 'know', label: 'Structure', at: '2026-10-20T09:05:00.000Z' })
    expect(project(data, '2026-10-20').xp).toBe(beforeCards + 5)
    data = reducer(data, { type: 'card', cardId: 'card-1', mark: 'review', label: 'Structure' })
    expect(project(data, '2026-10-20').xp).toBe(beforeCards)

    data = reducer(data, { type: 'attempt', attempt: attempt({ skill: 'communication', completedAt: '2026-10-20T11:00:00.000Z' }) })
    data = reducer(data, { type: 'attempt', attempt: attempt({ skill: 'communication', completedAt: '2026-10-20T12:00:00.000Z', id: 'again' }) })
    const assessmentXp = project(data, '2026-10-20').activities.filter((activity) => activity.type === 'assessment')
    expect(assessmentXp).toHaveLength(1)
    expect(assessmentXp[0].xp).toBe(40)
  })

  it('counts streaks from saved activity dates', () => {
    expect(currentStreak(['2026-10-18', '2026-10-19'], '2026-10-20')).toBe(2)
    expect(currentStreak(['2026-10-18'], '2026-10-20')).toBe(0)
    expect(currentStreak(['2026-10-18', '2026-10-19', '2026-10-20'], '2026-10-20')).toBe(3)
    expect(bestStreak(['2026-10-01', '2026-10-02', '2026-10-04', '2026-10-05', '2026-10-06'])).toBe(3)
  })

  it('earns Consistency Star only after three consecutive days', () => {
    const profile = createProfile({
      displayName: 'Sam Lee',
      educationLevel: 'school',
      interests: ['design'],
      careerGoal: 'Product designer',
      experienceLevel: 'beginner',
      knownSkills: [],
      weeklyHours: 4,
      learningStyle: 'examples',
      targetWeeks: 4,
    })
    let data: AppData = {
      ...emptyData(),
      profile,
      roadmap: buildRoadmap(profile, buildSnapshots(profile, []), 'fallback'),
      workspace: 'custom',
    }
    data = reducer(data, { type: 'attempt', attempt: attempt({ skill: 'design', completedAt: '2026-10-18T10:00:00.000Z' }) })
    data = reducer(data, { type: 'attempt', attempt: attempt({ skill: 'web', completedAt: '2026-10-19T10:00:00.000Z' }) })
    expect(project(data, '2026-10-20').badges.find((badge) => badge.id === 'consistency-star')?.earned).toBe(false)
    const lessonId = data.roadmap!.modules[0].lessons[0].id
    data = reducer(data, { type: 'toggle-lesson', lessonId, at: '2026-10-20T10:00:00.000Z' })
    expect(project(data, '2026-10-20').streak).toBe(3)
    expect(project(data, '2026-10-20').badges.find((badge) => badge.id === 'consistency-star')?.earned).toBe(true)
  })

  it('builds the sample workspace from real scores and one completed lesson', () => {
    const data = createSampleWorkspace()
    const view = project(data, localDate())
    expect(data.workspace).toBe('sample')
    expect(data.profile?.displayName).toBe('Aanya Rao')
    expect(view.xp).toBe(115)
    expect(view.progress).toBeGreaterThan(0)
    expect(view.progress).toBeLessThan(100)
    expect(view.badges.filter((badge) => badge.earned).map((badge) => badge.id)).toEqual(['first-sprint'])
    expect(view.streak).toBe(2)
    expect(view.recentAttempt?.skill).toBe('ai')
    expect(view.recentAttempt?.scorePercent).toBe(40)
  })
})
