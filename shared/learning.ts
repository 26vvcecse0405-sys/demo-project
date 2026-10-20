import { CATALOG, resourceById } from './catalog'
import { addDays, isoDaysAgo, localDate, startOfWeek, weekdayLabel } from './dates'
import { selectQuestions } from './questions'
import { cleanText, normalizeSkillToken } from './text'
import {
  ACHIEVEMENTS,
  type AchievementId,
  type AppData,
  type AssessmentAttempt,
  type ContentSource,
  type Difficulty,
  type ExperienceLevel,
  INTEREST_TO_SKILL,
  type Interest,
  type Lesson,
  type Profile,
  type QuizAttempt,
  type Roadmap,
  type RoadmapModule,
  SKILL_IDS,
  SKILL_LABEL,
  type SkillId,
  type SkillSnapshot,
  type StoredActivity,
  XP,
  emptyData,
  uid,
} from './types'

const KNOWN_ALIASES: Record<SkillId, string[]> = {
  programming: ['programming', 'python', 'javascript', 'typescript', 'java', 'coding', 'c++', 'c#', 'c'],
  web: ['html', 'css', 'react', 'web', 'frontend', 'front-end', 'web development'],
  ai: ['ai', 'machine learning', 'ml', 'deep learning', 'prompting'],
  data: ['data', 'pandas', 'sql', 'excel', 'statistics', 'data science', 'analytics'],
  design: ['design', 'figma', 'ui', 'ux', 'visual design'],
  business: ['business', 'marketing', 'finance', 'product', 'startup'],
  communication: ['communication', 'writing', 'speaking', 'presentation', 'public speaking'],
}

const CAREER_KEYWORDS: Record<SkillId, string[]> = {
  programming: ['engineer', 'developer', 'software', 'programmer'],
  web: ['front', 'web', 'react', 'fullstack', 'full-stack', 'full stack'],
  ai: ['ai', 'machine learning', 'ml', 'artificial'],
  data: ['data', 'analyst', 'analytics', 'scientist'],
  design: ['design', 'ux', 'ui'],
  business: ['product', 'founder', 'business', 'manager', 'startup'],
  communication: ['communication', 'writer', 'teacher', 'advocate'],
}

const DEPENDS_ON_PROGRAMMING: SkillId[] = ['web', 'ai', 'data']

export interface AnswerKey {
  id: string
  correctIndex: number
}

export interface ScoreResult {
  correct: number
  total: number
  scorePercent: number
  answers: { questionId: string; selectedIndex: number; correct: boolean }[]
}

export function scoreAnswers(keys: AnswerKey[], selections: Record<string, number>): ScoreResult {
  const answers = keys.map((key) => {
    const selectedIndex = selections[key.id] ?? -1
    return {
      questionId: key.id,
      selectedIndex,
      correct: selectedIndex === key.correctIndex,
    }
  })
  const correct = answers.filter((answer) => answer.correct).length
  const total = keys.length
  const scorePercent = total === 0 ? 0 : Math.round((correct / total) * 100)
  return { correct, total, scorePercent, answers }
}

export function quizXp(scorePercent: number): number {
  return XP.quizBase + (scorePercent >= 80 ? XP.quizHighBonus : 0)
}

/** Latest attempt counts more than older ones, so a fresh assessment can move the estimate. */
export function blendProficiency(scores: number[]): number {
  if (scores.length === 0) return 0
  if (scores.length === 1) return Math.round(scores[0])
  const latest = scores[scores.length - 1]
  const older = scores.slice(0, -1)
  const average = older.reduce((sum, score) => sum + score, 0) / older.length
  return Math.round(latest * 0.7 + average * 0.3)
}

export function knowsSkill(knownSkills: string[], skill: SkillId): boolean {
  const tokens = knownSkills.map(normalizeSkillToken)
  return KNOWN_ALIASES[skill].some((alias) => tokens.includes(alias))
}

export function careerTouches(goal: string, skill: SkillId): boolean {
  const text = goal.toLowerCase()
  return CAREER_KEYWORDS[skill].some((keyword) => text.includes(keyword))
}

export function interestSkills(interests: Interest[]): SkillId[] {
  return [...new Set(interests.map((interest) => INTEREST_TO_SKILL[interest]))]
}

export function buildSnapshots(profile: Profile, attempts: AssessmentAttempt[]): SkillSnapshot[] {
  const interests = new Set(interestSkills(profile.interests))
  const assessed = new Set(attempts.map((attempt) => attempt.skill))
  const skills = SKILL_IDS.filter(
    (skill) => interests.has(skill) || assessed.has(skill) || knowsSkill(profile.knownSkills, skill),
  )

  const programmingScores = attempts.filter((attempt) => attempt.skill === 'programming').map((attempt) => attempt.scorePercent)
  const programmingLevel = programmingScores.length ? blendProficiency(programmingScores) : knowsSkill(profile.knownSkills, 'programming') ? 30 : 10

  return skills.map((skill) => {
    const related = attempts.filter((attempt) => attempt.skill === skill)
    const interestMatch = interests.has(skill)
    const careerRelevant = careerTouches(profile.careerGoal, skill) || interestMatch
    const target = careerRelevant ? 85 : 70
    let proficiency = 10
    let source: SkillSnapshot['source'] = 'baseline'
    if (related.length > 0) {
      proficiency = blendProficiency(related.map((attempt) => attempt.scorePercent))
      source = 'assessment'
    } else if (knowsSkill(profile.knownSkills, skill)) {
      proficiency = 30
      source = 'self-report'
    }
    const latest = related[related.length - 1]
    const note =
      DEPENDS_ON_PROGRAMMING.includes(skill) && programmingLevel < 40
        ? 'Programming foundations will make this skill easier. Assess programming before treating this gap as only an advanced topic.'
        : source === 'self-report'
          ? 'This familiarity comes from the skills you listed, not from an assessment.'
          : source === 'baseline'
            ? 'Not assessed yet. This starting point is only a placeholder.'
            : undefined
    return {
      skill,
      label: SKILL_LABEL[skill],
      proficiency,
      target,
      gap: Math.max(0, target - proficiency),
      source,
      interestMatch,
      careerRelevant,
      note,
      evidence: latest
        ? {
            scorePercent: latest.scorePercent,
            completedAt: latest.completedAt,
            difficulty: latest.difficulty,
            correct: latest.correct,
            total: latest.total,
          }
        : undefined,
    }
  })
}

export function priorityScore(snapshot: SkillSnapshot): number {
  const relevance = snapshot.careerRelevant || snapshot.interestMatch ? 1.25 : 1
  const evidence = snapshot.source === 'assessment' ? 1.4 : snapshot.source === 'self-report' ? 0.55 : 0.7
  return snapshot.gap * relevance * evidence
}

export function rankSkills(snapshots: SkillSnapshot[]): SkillSnapshot[] {
  return [...snapshots].sort((a, b) => priorityScore(b) - priorityScore(a) || a.label.localeCompare(b.label))
}

function hydrateLesson(templateId: string, title: string, topics: string[], objectives: string[], exercise: string, resourceIds: string[], durationMin: number): Lesson {
  return {
    id: templateId,
    title,
    topics,
    objectives,
    resources: resourceIds.map((id) => resourceById(id)).filter((item): item is NonNullable<typeof item> => Boolean(item)),
    exercise,
    durationMin,
  }
}

export function lessonCountForBudget(budgetMin: number, available: number): number {
  const safeBudget = Math.max(20, budgetMin)
  let count = available
  if (safeBudget < 135) count = Math.min(available, Math.max(1, Math.floor(safeBudget / 30)))
  else count = Math.min(available, 8, Math.max(4, Math.floor(safeBudget / 60)))
  while (count > 1 && Math.floor(safeBudget / count) < 20) count -= 1
  return Math.max(1, count)
}

export function buildRoadmap(profile: Profile, snapshots: SkillSnapshot[], source: ContentSource, now = new Date().toISOString()): Roadmap {
  const budgetMin = Math.max(20, profile.weeklyHours * profile.targetWeeks * 60)
  const ranked = rankSkills(snapshots)
  const focus = ranked.filter((snapshot) => snapshot.gap > 0).slice(0, 3)
  const rankedSkills = (focus.length ? focus : ranked.slice(0, 1)).map((snapshot) => snapshot.skill)
  const chosen = rankedSkills.length ? rankedSkills : (['programming'] as SkillId[])
  const modules = chosen.flatMap((skill) => CATALOG.filter((module) => module.skill === skill))
  const flat = modules.flatMap((module) => module.lessons.map((lesson) => ({ module, lesson })))
  const count = lessonCountForBudget(budgetMin, Math.max(1, flat.length))
  const durationMin = Math.min(75, Math.floor(budgetMin / count))
  const picked = flat.slice(0, count)
  const grouped: RoadmapModule[] = []
  for (const item of picked) {
    const lesson = hydrateLesson(item.lesson.id, item.lesson.title, item.lesson.topics, item.lesson.objectives, item.lesson.exercise, item.lesson.resourceIds, durationMin)
    const existing = grouped.find((module) => module.id === item.module.id)
    if (existing) existing.lessons.push(lesson)
    else {
      grouped.push({
        id: item.module.id,
        skill: item.module.skill,
        title: item.module.title,
        summary: item.module.summary,
        checkpoint: item.module.checkpoint,
        lessons: [lesson],
      })
    }
  }
  return {
    id: uid('roadmap'),
    goal: profile.careerGoal,
    level: profile.experienceLevel,
    gaps: ranked.filter((snapshot) => snapshot.gap > 0).map((snapshot) => snapshot.skill),
    modules: grouped,
    source,
    generatedAt: now,
    budgetMin,
    plannedMin: durationMin * picked.length,
  }
}

export interface AiLessonDraft {
  title: string
  topics: string[]
  objectives: string[]
  exercise: string
  resourceIds: string[]
}

export interface AiModuleDraft {
  skill: SkillId
  title: string
  summary: string
  checkpoint: string
  lessons: AiLessonDraft[]
}

/** Application code owns duration, order limits, and completion. The model cannot award progress. */
export function roadmapFromDrafts(profile: Profile, snapshots: SkillSnapshot[], drafts: AiModuleDraft[], now = new Date().toISOString()): Roadmap {
  const budgetMin = Math.max(20, profile.weeklyHours * profile.targetWeeks * 60)
  const flat = drafts.flatMap((module, moduleIndex) =>
    module.lessons.map((lesson, lessonIndex) => ({
      module,
      lesson,
      moduleIndex,
      lessonIndex,
    })),
  )
  const count = lessonCountForBudget(budgetMin, Math.max(1, flat.length))
  const durationMin = Math.min(75, Math.floor(budgetMin / count))
  const picked = flat.slice(0, count)
  const grouped: RoadmapModule[] = []
  for (const item of picked) {
    const lesson = hydrateLesson(
      `${item.module.skill}-ai-${item.moduleIndex + 1}-${item.lessonIndex + 1}`,
      cleanText(item.lesson.title, 90),
      item.lesson.topics.map((topic) => cleanText(topic, 60)).slice(0, 5),
      item.lesson.objectives.map((objective) => cleanText(objective, 180)).slice(0, 4),
      cleanText(item.lesson.exercise, 400),
      item.lesson.resourceIds,
      durationMin,
    )
    const moduleId = `${item.module.skill}-ai-module-${item.moduleIndex + 1}`
    const existing = grouped.find((module) => module.id === moduleId)
    if (existing) existing.lessons.push(lesson)
    else {
      grouped.push({
        id: moduleId,
        skill: item.module.skill,
        title: cleanText(item.module.title, 90),
        summary: cleanText(item.module.summary, 280),
        checkpoint: cleanText(item.module.checkpoint, 220),
        lessons: [lesson],
      })
    }
  }
  const ranked = rankSkills(snapshots)
  return {
    id: uid('roadmap'),
    goal: profile.careerGoal,
    level: profile.experienceLevel,
    gaps: ranked.filter((snapshot) => snapshot.gap > 0).map((snapshot) => snapshot.skill),
    modules: grouped,
    source: 'ai',
    generatedAt: now,
    budgetMin,
    plannedMin: grouped.reduce((sum, module) => sum + module.lessons.reduce((inner, lesson) => inner + lesson.durationMin, 0), 0),
  }
}

export function allLessons(roadmap: Roadmap | null): Lesson[] {
  if (!roadmap) return []
  return roadmap.modules.flatMap((module) => module.lessons)
}

export function roadmapProgress(roadmap: Roadmap | null, completions: Record<string, string>): number {
  const lessons = allLessons(roadmap)
  if (lessons.length === 0) return 0
  const done = lessons.filter((lesson) => completions[lesson.id]).length
  return Math.round((done / lessons.length) * 100)
}

export interface NextTask {
  moduleId: string
  moduleTitle: string
  lesson: Lesson
}

export function nextTask(roadmap: Roadmap | null, completions: Record<string, string>): NextTask | null {
  if (!roadmap) return null
  for (const roadmapModule of roadmap.modules) {
    for (const lesson of roadmapModule.lessons) {
      if (!completions[lesson.id]) return { moduleId: roadmapModule.id, moduleTitle: roadmapModule.title, lesson }
    }
  }
  return null
}

export function currentStreak(dates: string[], today = localDate()): number {
  const unique = new Set(dates)
  let cursor = today
  if (!unique.has(cursor)) {
    cursor = addDays(today, -1)
    if (!unique.has(cursor)) return 0
  }
  let streak = 0
  while (unique.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

export function bestStreak(dates: string[]): number {
  const unique = [...new Set(dates)].sort()
  let best = 0
  let run = 0
  let previous: string | null = null
  for (const date of unique) {
    run = previous && addDays(previous, 1) === date ? run + 1 : 1
    best = Math.max(best, run)
    previous = date
  }
  return best
}

export interface TimelineActivity {
  id: string
  type: 'lesson' | 'module' | 'assessment' | 'quiz' | 'flashcard'
  label: string
  xp: number
  minutes: number
  date: string
  createdAt: string
}

export interface EarnedBadge {
  id: AchievementId
  title: string
  description: string
  earned: boolean
}

export interface Projection {
  snapshots: SkillSnapshot[]
  ranked: SkillSnapshot[]
  xp: number
  activities: TimelineActivity[]
  streak: number
  best: number
  badges: EarnedBadge[]
  progress: number
  next: NextTask | null
  weeklyMinutes: number
  weeklyGoal: number
  recentAttempt: AssessmentAttempt | null
  mastered: SkillSnapshot[]
  improving: SkillSnapshot[]
  chart: { date: string; label: string; xp: number }[]
}

function lessonActivities(data: AppData): TimelineActivity[] {
  if (!data.roadmap) return []
  const events: TimelineActivity[] = []
  for (const roadmapModule of data.roadmap.modules) {
    const doneAt = roadmapModule.lessons.map((lesson) => data.lessonCompletions[lesson.id]).filter(Boolean)
    for (const lesson of roadmapModule.lessons) {
      const completedAt = data.lessonCompletions[lesson.id]
      if (!completedAt) continue
      events.push({
        id: `lesson:${lesson.id}`,
        type: 'lesson',
        label: `Completed ${lesson.title}`,
        xp: XP.lesson,
        minutes: lesson.durationMin,
        date: localDate(new Date(completedAt)),
        createdAt: completedAt,
      })
    }
    if (roadmapModule.lessons.length > 0 && doneAt.length === roadmapModule.lessons.length) {
      const latest = doneAt.sort().at(-1) as string
      events.push({
        id: `module:${roadmapModule.id}`,
        type: 'module',
        label: `Finished module ${roadmapModule.title}`,
        xp: XP.moduleBonus,
        minutes: 0,
        date: localDate(new Date(latest)),
        createdAt: latest,
      })
    }
  }
  return events
}

export function project(data: AppData, today = localDate()): Projection {
  const snapshots = data.profile ? buildSnapshots(data.profile, data.attempts) : []
  const ranked = rankSkills(snapshots)
  const derived = lessonActivities(data)
  const stored: TimelineActivity[] = data.activities.map((activity) => ({
    id: activity.id,
    type: activity.type,
    label: activity.label,
    xp: activity.xp,
    minutes: activity.minutes,
    date: activity.date,
    createdAt: activity.createdAt,
  }))
  const activities = [...stored, ...derived].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const dates = activities.map((activity) => activity.date)
  const badges = evaluateBadges(data, dates)
  const weekStart = startOfWeek(today)
  const weeklyMinutes = activities.filter((activity) => activity.date >= weekStart && activity.date <= today).reduce((sum, activity) => sum + activity.minutes, 0)
  const chart = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6)
    const xp = activities.filter((activity) => activity.date === date).reduce((sum, activity) => sum + activity.xp, 0)
    return { date, label: weekdayLabel(date), xp }
  })
  return {
    snapshots,
    ranked,
    xp: activities.reduce((sum, activity) => sum + activity.xp, 0),
    activities,
    streak: currentStreak(dates, today),
    best: bestStreak(dates),
    badges,
    progress: roadmapProgress(data.roadmap, data.lessonCompletions),
    next: nextTask(data.roadmap, data.lessonCompletions),
    weeklyMinutes,
    weeklyGoal: (data.profile?.weeklyHours ?? 0) * 60,
    recentAttempt: [...data.attempts].sort((a, b) => a.completedAt.localeCompare(b.completedAt)).at(-1) ?? null,
    mastered: snapshots.filter((snapshot) => snapshot.source === 'assessment' && snapshot.proficiency >= snapshot.target),
    improving: snapshots.filter((snapshot) => snapshot.gap > 0),
    chart,
  }
}

export function evaluateBadges(data: AppData, dates: string[]): EarnedBadge[] {
  const lessons = allLessons(data.roadmap)
  const completedLessons = lessons.filter((lesson) => data.lessonCompletions[lesson.id]).length
  const moduleDone = data.roadmap?.modules.some((roadmapModule) => roadmapModule.lessons.length > 0 && roadmapModule.lessons.every((lesson) => data.lessonCompletions[lesson.id])) ?? false
  const roadmapDone = lessons.length > 0 && completedLessons === lessons.length
  const quizChampion = data.quizAttempts.some((attempt) => attempt.scorePercent >= 80)
  const consistent = bestStreak(dates) >= 3
  const flags: Record<AchievementId, boolean> = {
    'first-sprint': completedLessons > 0,
    'quiz-champion': quizChampion,
    'consistency-star': consistent,
    'skill-builder': moduleDone,
    'roadmap-explorer': roadmapDone,
  }
  return ACHIEVEMENTS.map((badge) => ({ ...badge, earned: flags[badge.id] }))
}

export function recommendResources(snapshots: SkillSnapshot[]) {
  const ranked = rankSkills(snapshots).filter((snapshot) => snapshot.gap > 0)
  const seen = new Set<string>()
  const items: { resource: NonNullable<ReturnType<typeof resourceById>>; skill: SkillId; gap: number }[] = []
  for (const snapshot of ranked) {
    const modules = CATALOG.filter((module) => module.skill === snapshot.skill)
    for (const module of modules) {
      for (const lesson of module.lessons) {
        for (const id of lesson.resourceIds) {
          if (seen.has(id)) continue
          const resource = resourceById(id)
          if (!resource) continue
          seen.add(id)
          items.push({ resource, skill: snapshot.skill, gap: snapshot.gap })
        }
      }
    }
  }
  return items.slice(0, 6)
}

export type Action =
  | { type: 'replace'; data: AppData }
  | { type: 'theme'; theme: 'light' | 'dark' }
  | { type: 'profile'; profile: Profile; roadmap: Roadmap }
  | { type: 'update-profile'; patch: Partial<Profile> }
  | { type: 'attempt'; attempt: AssessmentAttempt }
  | { type: 'roadmap'; roadmap: Roadmap }
  | { type: 'toggle-lesson'; lessonId: string; at?: string }
  | { type: 'quiz'; attempt: QuizAttempt }
  | { type: 'card'; cardId: string; mark: 'know' | 'review'; label: string; at?: string }
  | { type: 'reset'; theme: 'light' | 'dark' }

function assessmentActivity(attempt: AssessmentAttempt, activities: StoredActivity[]): StoredActivity | null {
  const date = localDate(new Date(attempt.completedAt))
  const already = activities.some((activity) => activity.type === 'assessment' && activity.ref === `assessment:${attempt.skill}` && activity.date === date)
  if (already) return null
  return {
    id: uid('act'),
    type: 'assessment',
    label: `Assessed ${SKILL_LABEL[attempt.skill]} · ${attempt.scorePercent}%`,
    xp: XP.assessment,
    minutes: 15,
    date,
    createdAt: attempt.completedAt,
    ref: `assessment:${attempt.skill}`,
  }
}

export function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'replace':
      return action.data
    case 'theme':
      return { ...state, theme: action.theme }
    case 'profile':
      return {
        ...state,
        profile: action.profile,
        roadmap: action.roadmap,
        workspace: state.workspace === 'sample' ? 'sample' : 'custom',
      }
    case 'update-profile':
      if (!state.profile) return state
      return { ...state, profile: { ...state.profile, ...action.patch } }
    case 'attempt': {
      const activity = assessmentActivity(action.attempt, state.activities)
      return {
        ...state,
        attempts: [...state.attempts, action.attempt],
        activities: activity ? [...state.activities, activity] : state.activities,
      }
    }
    case 'roadmap': {
      const validIds = new Set(allLessons(action.roadmap).map((lesson) => lesson.id))
      const lessonCompletions = Object.fromEntries(Object.entries(state.lessonCompletions).filter(([id]) => validIds.has(id)))
      return { ...state, roadmap: action.roadmap, lessonCompletions }
    }
    case 'toggle-lesson': {
      if (!allLessons(state.roadmap).some((lesson) => lesson.id === action.lessonId)) return state
      if (state.lessonCompletions[action.lessonId]) {
        const rest = { ...state.lessonCompletions }
        delete rest[action.lessonId]
        return { ...state, lessonCompletions: rest }
      }
      return {
        ...state,
        lessonCompletions: { ...state.lessonCompletions, [action.lessonId]: action.at ?? new Date().toISOString() },
      }
    }
    case 'quiz': {
      const activity: StoredActivity = {
        id: uid('act'),
        type: 'quiz',
        label: `${action.attempt.topic} quiz · ${action.attempt.scorePercent}%`,
        xp: quizXp(action.attempt.scorePercent),
        minutes: 10,
        date: localDate(new Date(action.attempt.completedAt)),
        createdAt: action.attempt.completedAt,
        ref: `quiz:${action.attempt.id}`,
      }
      return { ...state, quizAttempts: [...state.quizAttempts, action.attempt], activities: [...state.activities, activity] }
    }
    case 'card': {
      const ref = `flashcard:${action.cardId}`
      const without = state.activities.filter((activity) => activity.ref !== ref)
      const at = action.at ?? new Date().toISOString()
      if (action.mark === 'review') {
        return { ...state, cardMarks: { ...state.cardMarks, [action.cardId]: 'review' }, activities: without }
      }
      if (state.activities.some((activity) => activity.ref === ref)) {
        return { ...state, cardMarks: { ...state.cardMarks, [action.cardId]: 'know' } }
      }
      const activity: StoredActivity = {
        id: uid('act'),
        type: 'flashcard',
        label: `Knew flashcard · ${action.label}`,
        xp: XP.flashcard,
        minutes: 3,
        date: localDate(new Date(at)),
        createdAt: at,
        ref,
      }
      return {
        ...state,
        cardMarks: { ...state.cardMarks, [action.cardId]: 'know' },
        activities: [...without, activity],
      }
    }
    case 'reset':
      return emptyData(action.theme)
    default:
      return state
  }
}

export function createProfile(input: Omit<Profile, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): Profile {
  return {
    ...input,
    displayName: cleanText(input.displayName, 40),
    careerGoal: cleanText(input.careerGoal, 80),
    knownSkills: input.knownSkills.map((skill) => cleanText(skill, 40)).filter(Boolean).slice(0, 20),
    id: input.id ?? uid('student'),
    createdAt: input.createdAt ?? new Date().toISOString(),
  }
}

export function createSampleWorkspace(theme: 'light' | 'dark' = 'dark'): AppData {
  const createdAt = isoDaysAgo(10, 9)
  const profile = createProfile({
    id: 'student-aanya',
    displayName: 'Aanya Rao',
    educationLevel: 'college',
    interests: ['ai', 'web-development', 'programming'],
    careerGoal: 'AI Product Engineer',
    experienceLevel: 'intermediate',
    knownSkills: ['Python', 'HTML', 'CSS'],
    weeklyHours: 6,
    learningStyle: 'practice',
    targetWeeks: 8,
    createdAt,
  })
  const webQuestions = selectQuestions('web', 'beginner', 5, () => 0)
  const aiQuestions = selectQuestions('ai', 'beginner', 5, () => 0)
  const grade = (skill: SkillId, difficulty: Difficulty, questions: typeof webQuestions, wrongIds: string[], completedAt: string, source: ContentSource): AssessmentAttempt => {
    const selections: Record<string, number> = {}
    for (const question of questions) {
      selections[question.id] = wrongIds.includes(question.id) ? (question.correctIndex + 1) % 4 : question.correctIndex
    }
    const scored = scoreAnswers(questions, selections)
    return {
      id: `attempt-${skill}`,
      skill,
      difficulty,
      scorePercent: scored.scorePercent,
      correct: scored.correct,
      total: scored.total,
      completedAt,
      source,
      questions: questions.map((question) => ({
        ...question,
        choices: [...question.choices],
        selectedIndex: selections[question.id],
      })),
    }
  }
  const webAttempt = grade('web', 'beginner', webQuestions, webQuestions.slice(-2).map((question) => question.id), isoDaysAgo(2, 11), 'demo')
  const aiAttempt = grade('ai', 'beginner', aiQuestions, aiQuestions.slice(-3).map((question) => question.id), isoDaysAgo(2, 16), 'demo')
  const attempts = [webAttempt, aiAttempt]
  const roadmap = buildRoadmap(profile, buildSnapshots(profile, attempts), 'demo', isoDaysAgo(2, 17))
  const firstLesson = roadmap.modules[0]?.lessons[0]
  const lessonCompletions = firstLesson ? { [firstLesson.id]: isoDaysAgo(1, 18) } : {}
  const quiz: QuizAttempt = {
    id: 'quiz-sample-ai',
    topic: 'Artificial Intelligence',
    skill: 'ai',
    difficulty: 'beginner',
    scorePercent: 50,
    correct: 2,
    total: 4,
    wrongTopics: ['Limits', 'Overfitting'],
    completedAt: isoDaysAgo(2, 19),
    source: 'demo',
  }
  const activities: StoredActivity[] = [
    {
      id: 'act-web',
      type: 'assessment',
      label: `Assessed ${SKILL_LABEL.web} · ${webAttempt.scorePercent}%`,
      xp: XP.assessment,
      minutes: 15,
      date: localDate(new Date(webAttempt.completedAt)),
      createdAt: webAttempt.completedAt,
      ref: 'assessment:web',
    },
    {
      id: 'act-ai',
      type: 'assessment',
      label: `Assessed ${SKILL_LABEL.ai} · ${aiAttempt.scorePercent}%`,
      xp: XP.assessment,
      minutes: 15,
      date: localDate(new Date(aiAttempt.completedAt)),
      createdAt: aiAttempt.completedAt,
      ref: 'assessment:ai',
    },
    {
      id: 'act-quiz',
      type: 'quiz',
      label: `${quiz.topic} quiz · ${quiz.scorePercent}%`,
      xp: quizXp(quiz.scorePercent),
      minutes: 10,
      date: localDate(new Date(quiz.completedAt)),
      createdAt: quiz.completedAt,
      ref: `quiz:${quiz.id}`,
    },
  ]
  return {
    profile,
    attempts,
    roadmap,
    quizAttempts: [quiz],
    cardMarks: {},
    activities,
    lessonCompletions,
    theme,
    workspace: 'sample',
  }
}

export function levelLabel(level: ExperienceLevel): string {
  return level.slice(0, 1).toUpperCase() + level.slice(1)
}

export function hoursLabel(minutes: number): string {
  const hours = Math.round((minutes / 60) * 10) / 10
  return Number.isInteger(hours) ? `${hours} h` : `${hours} h`
}
