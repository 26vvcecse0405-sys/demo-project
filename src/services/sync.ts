import { project } from '@shared/learning'
import { profileSchema } from '@shared/schemas'
import type { AppData, AssessmentAttempt, ContentSource, Difficulty, GradedQuestion, Profile, QuizAttempt, Roadmap, SkillId, StoredActivity } from '@shared/types'
import { emptyData } from '@shared/types'
import { getSupabase } from '@/lib/supabase'

type Row = Record<string, unknown>

function db() {
  const client = getSupabase()
  if (!client) throw new Error('Supabase is not configured.')
  return client
}

async function insert(table: string, rows: Row | Row[]) {
  const { error } = await db().from(table).insert(rows as never)
  if (error) throw new Error(error.message)
}

async function remove(table: string, column: string, value: string) {
  const { error } = await db().from(table).delete().eq(column, value)
  if (error) throw new Error(error.message)
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback
}

function profileFromRow(row: Row): Profile | null {
  const parsed = profileSchema.safeParse({
    displayName: row.display_name,
    educationLevel: row.education_level,
    interests: row.interests ?? [],
    careerGoal: row.career_goal,
    experienceLevel: row.experience_level,
    knownSkills: row.known_skills ?? [],
    weeklyHours: row.weekly_hours,
    learningStyle: row.learning_style,
    targetWeeks: row.target_weeks,
  })
  if (!parsed.success) return null
  return { ...parsed.data, id: asString(row.id), createdAt: asString(row.created_at, new Date().toISOString()) }
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === 'beginner' || value === 'intermediate' || value === 'advanced'
}

function isSkill(value: unknown): value is SkillId {
  return value === 'programming' || value === 'web' || value === 'ai' || value === 'data' || value === 'design' || value === 'business' || value === 'communication'
}

function isSource(value: unknown): value is ContentSource {
  return value === 'ai' || value === 'fallback' || value === 'demo'
}

export async function loadRemote(userId: string, theme: 'light' | 'dark'): Promise<AppData> {
  const profileQuery = await db().from('profiles').select('*').eq('id', userId).maybeSingle()
  if (profileQuery.error) throw new Error(profileQuery.error.message)
  if (!profileQuery.data) return emptyData(theme)
  const row = profileQuery.data as Row
  const profile = profileFromRow(row)
  if (!profile) return { ...emptyData(theme), theme: row.theme === 'light' ? 'light' : 'dark' }

  const [attemptsQuery, roadmapQuery, quizQuery, activityQuery, flashQuery, completionQuery] = await Promise.all([
    db().from('assessment_attempts').select('*').eq('user_id', userId).order('completed_at'),
    db().from('roadmaps').select('*').eq('user_id', userId).order('generated_at', { ascending: false }).limit(1),
    db().from('quiz_attempts').select('*').eq('user_id', userId).order('completed_at'),
    db().from('learning_activity').select('*').eq('user_id', userId).order('created_at'),
    db().from('flashcards').select('*').eq('user_id', userId).limit(1),
    db().from('lesson_completions').select('*').eq('user_id', userId),
  ])
  for (const query of [attemptsQuery, roadmapQuery, quizQuery, activityQuery, flashQuery, completionQuery]) {
    if (query.error) throw new Error(query.error.message)
  }

  const attempts: AssessmentAttempt[] = ((attemptsQuery.data ?? []) as Row[]).map((item) => ({
    id: asString(item.id),
    skill: isSkill(item.skill) ? item.skill : 'programming',
    difficulty: isDifficulty(item.difficulty) ? item.difficulty : 'beginner',
    questions: Array.isArray(item.answers) ? item.answers as GradedQuestion[] : [],
    scorePercent: asNumber(item.score_percent),
    correct: asNumber(item.correct_count),
    total: asNumber(item.total_count),
    completedAt: asString(item.completed_at),
    source: isSource(item.source) ? item.source : 'fallback',
  }))

  let roadmap: Roadmap | null = null
  const roadmapRow = ((roadmapQuery.data ?? []) as Row[])[0]
  if (roadmapRow) {
    const modulesQuery = await db().from('roadmap_modules').select('*').eq('roadmap_id', roadmapRow.id).order('order_index')
    if (modulesQuery.error) throw new Error(modulesQuery.error.message)
    const moduleRows = (modulesQuery.data ?? []) as Row[]
    const moduleIds = moduleRows.map((item) => asString(item.id))
    const lessonsQuery = moduleIds.length
      ? await db().from('lessons').select('*').in('module_id', moduleIds).order('order_index')
      : { data: [], error: null }
    if (lessonsQuery.error) throw new Error(lessonsQuery.error.message)
    const lessonRows = (lessonsQuery.data ?? []) as Row[]
    roadmap = {
      id: asString(roadmapRow.id),
      goal: asString(roadmapRow.goal),
      level: isDifficulty(roadmapRow.level) ? roadmapRow.level : profile.experienceLevel,
      gaps: Array.isArray(roadmapRow.gaps) ? roadmapRow.gaps.filter(isSkill) : [],
      source: isSource(roadmapRow.source) ? roadmapRow.source : 'fallback',
      generatedAt: asString(roadmapRow.generated_at),
      budgetMin: asNumber(roadmapRow.budget_min),
      plannedMin: asNumber(roadmapRow.planned_min),
      modules: moduleRows.map((module) => ({
        id: asString(module.module_key, asString(module.id)),
        skill: isSkill(module.skill) ? module.skill : 'programming',
        title: asString(module.title),
        summary: asString(module.summary),
        checkpoint: asString(module.checkpoint),
        lessons: lessonRows.filter((lesson) => lesson.module_id === module.id).map((lesson) => ({
          id: asString(lesson.lesson_key, asString(lesson.id)),
          title: asString(lesson.title),
          topics: Array.isArray(lesson.topics) ? lesson.topics.filter((topic): topic is string => typeof topic === 'string') : [],
          objectives: Array.isArray(lesson.objectives) ? lesson.objectives.filter((topic): topic is string => typeof topic === 'string') : [],
          resources: Array.isArray(lesson.resources) ? lesson.resources as Roadmap['modules'][number]['lessons'][number]['resources'] : [],
          exercise: asString(lesson.exercise),
          durationMin: asNumber(lesson.duration_min, 30),
        })),
      })).filter((module) => module.lessons.length > 0),
    }
  }

  const quizAttempts: QuizAttempt[] = ((quizQuery.data ?? []) as Row[]).map((item) => ({
    id: asString(item.id),
    topic: asString(item.topic),
    skill: isSkill(item.skill) ? item.skill : 'programming',
    difficulty: isDifficulty(item.difficulty) ? item.difficulty : 'beginner',
    scorePercent: asNumber(item.score_percent),
    correct: asNumber(item.correct_count),
    total: asNumber(item.total_count),
    wrongTopics: Array.isArray(item.wrong_topics) ? item.wrong_topics.filter((topic): topic is string => typeof topic === 'string') : [],
    completedAt: asString(item.completed_at),
    source: isSource(item.source) ? item.source : 'fallback',
  }))

  const activities: StoredActivity[] = ((activityQuery.data ?? []) as Row[])
    .filter((item) => item.activity_type === 'assessment' || item.activity_type === 'quiz' || item.activity_type === 'flashcard')
    .map((item) => ({
      id: asString(item.id),
      type: item.activity_type as StoredActivity['type'],
      label: asString(item.label),
      xp: asNumber(item.xp),
      minutes: asNumber(item.minutes),
      date: asString(item.activity_date).slice(0, 10),
      createdAt: asString(item.created_at),
      ref: asString(item.ref),
    }))

  const flash = ((flashQuery.data ?? []) as Row[])[0]
  const marks = flash?.marks && typeof flash.marks === 'object' ? flash.marks as AppData['cardMarks'] : {}
  const lessonCompletions: Record<string, string> = {}
  for (const item of (completionQuery.data ?? []) as Row[]) {
    const key = asString(item.lesson_key)
    if (key) lessonCompletions[key] = asString(item.completed_at)
  }

  return {
    profile,
    attempts,
    roadmap,
    quizAttempts,
    cardMarks: marks,
    activities,
    lessonCompletions,
    theme: row.theme === 'light' ? 'light' : theme,
    workspace: 'custom',
  }
}

export async function saveRemote(userId: string, data: AppData) {
  if (!data.profile) return
  const profile = data.profile
  const { error: profileError } = await db().from('profiles').upsert({
    id: userId,
    display_name: profile.displayName,
    education_level: profile.educationLevel,
    interests: profile.interests,
    career_goal: profile.careerGoal,
    experience_level: profile.experienceLevel,
    known_skills: profile.knownSkills,
    weekly_hours: profile.weeklyHours,
    learning_style: profile.learningStyle,
    target_weeks: profile.targetWeeks,
    theme: data.theme,
    workspace: 'custom',
    created_at: profile.createdAt,
    updated_at: new Date().toISOString(),
  } as never, { onConflict: 'id' })
  if (profileError) throw new Error(profileError.message)

  for (const table of ['lesson_completions', 'lessons', 'roadmap_modules', 'roadmaps', 'assessment_questions', 'assessment_attempts', 'assessments', 'quiz_attempts', 'quizzes', 'learning_activity', 'skill_profiles', 'learning_goals', 'flashcards', 'user_achievements']) {
    await remove(table, 'user_id', userId)
  }

  await insert('learning_goals', {
    id: crypto.randomUUID(),
    user_id: userId,
    title: profile.careerGoal,
    target_weeks: profile.targetWeeks,
    created_at: profile.createdAt,
  })

  for (const attempt of data.attempts) {
    const assessmentId = crypto.randomUUID()
    await insert('assessments', {
      id: assessmentId,
      user_id: userId,
      skill: attempt.skill,
      difficulty: attempt.difficulty,
      source: attempt.source,
      created_at: attempt.completedAt,
    })
    if (attempt.questions.length) {
      await insert('assessment_questions', attempt.questions.map((question, index) => ({
        id: crypto.randomUUID(),
        assessment_id: assessmentId,
        user_id: userId,
        prompt: question.prompt,
        choices: question.choices,
        correct_index: question.correctIndex,
        explanation: question.explanation,
        topic: question.topic,
        order_index: index,
      })))
    }
    await insert('assessment_attempts', {
      id: crypto.randomUUID(),
      user_id: userId,
      assessment_id: assessmentId,
      skill: attempt.skill,
      difficulty: attempt.difficulty,
      score_percent: attempt.scorePercent,
      correct_count: attempt.correct,
      total_count: attempt.total,
      answers: attempt.questions,
      source: attempt.source,
      completed_at: attempt.completedAt,
    })
  }

  const view = project(data)
  if (view.snapshots.length) {
    await insert('skill_profiles', view.snapshots.map((snapshot) => ({
      id: crypto.randomUUID(),
      user_id: userId,
      skill: snapshot.skill,
      proficiency: snapshot.proficiency,
      target_level: snapshot.target,
      evidence: snapshot.source,
      updated_at: new Date().toISOString(),
    })))
  }

  if (data.roadmap) {
    const roadmapId = crypto.randomUUID()
    await insert('roadmaps', {
      id: roadmapId,
      user_id: userId,
      goal: data.roadmap.goal,
      level: data.roadmap.level,
      gaps: data.roadmap.gaps,
      source: data.roadmap.source,
      budget_min: data.roadmap.budgetMin,
      planned_min: data.roadmap.plannedMin,
      generated_at: data.roadmap.generatedAt,
    })
    for (const [moduleIndex, module] of data.roadmap.modules.entries()) {
      const moduleId = crypto.randomUUID()
      await insert('roadmap_modules', {
        id: moduleId,
        roadmap_id: roadmapId,
        user_id: userId,
        module_key: module.id,
        skill: module.skill,
        title: module.title,
        summary: module.summary,
        checkpoint: module.checkpoint,
        order_index: moduleIndex,
      })
      const lessonIds = new Map<string, string>()
      await insert('lessons', module.lessons.map((lesson, lessonIndex) => {
        const id = crypto.randomUUID()
        lessonIds.set(lesson.id, id)
        return {
          id,
          module_id: moduleId,
          user_id: userId,
          lesson_key: lesson.id,
          title: lesson.title,
          topics: lesson.topics,
          objectives: lesson.objectives,
          resources: lesson.resources,
          exercise: lesson.exercise,
          duration_min: lesson.durationMin,
          order_index: lessonIndex,
        }
      }))
      const completions = module.lessons.filter((lesson) => data.lessonCompletions[lesson.id])
      if (completions.length) {
        await insert('lesson_completions', completions.map((lesson) => ({
          id: crypto.randomUUID(),
          user_id: userId,
          lesson_id: lessonIds.get(lesson.id),
          lesson_key: lesson.id,
          completed_at: data.lessonCompletions[lesson.id],
        })))
      }
    }
  }

  for (const quiz of data.quizAttempts) {
    const quizId = crypto.randomUUID()
    await insert('quizzes', {
      id: quizId,
      user_id: userId,
      topic: quiz.topic,
      skill: quiz.skill,
      difficulty: quiz.difficulty,
      source: quiz.source,
      created_at: quiz.completedAt,
    })
    await insert('quiz_attempts', {
      id: crypto.randomUUID(),
      user_id: userId,
      quiz_id: quizId,
      topic: quiz.topic,
      skill: quiz.skill,
      difficulty: quiz.difficulty,
      score_percent: quiz.scorePercent,
      correct_count: quiz.correct,
      total_count: quiz.total,
      wrong_topics: quiz.wrongTopics,
      source: quiz.source,
      completed_at: quiz.completedAt,
    })
  }

  await insert('flashcards', {
    id: crypto.randomUUID(),
    user_id: userId,
    topic: 'revision',
    cards: [],
    marks: data.cardMarks,
    updated_at: new Date().toISOString(),
  })

  if (data.activities.length) {
    await insert('learning_activity', data.activities.map((activity) => ({
      id: crypto.randomUUID(),
      user_id: userId,
      activity_type: activity.type,
      label: activity.label,
      xp: activity.xp,
      minutes: activity.minutes,
      activity_date: activity.date,
      ref: activity.ref,
      created_at: activity.createdAt,
    })))
  }

  const earned = view.badges.filter((badge) => badge.earned)
  if (earned.length) {
    await insert('user_achievements', earned.map((badge) => ({
      user_id: userId,
      achievement_id: badge.id,
      earned_at: new Date().toISOString(),
    })))
  }
}

let timer: ReturnType<typeof setTimeout> | null = null
let chain = Promise.resolve()

export function scheduleSync(userId: string, data: AppData, onNote: (message: string | null) => void) {
  if (!getSupabase() || !data.profile) return
  if (timer) clearTimeout(timer)
  const snapshot = data
  timer = setTimeout(() => {
    chain = chain
      .then(() => saveRemote(userId, snapshot))
      .then(() => onNote('Saved to your account.'))
      .catch((error: unknown) => onNote(error instanceof Error ? error.message : 'Could not save to Supabase.'))
  }, 700)
}
