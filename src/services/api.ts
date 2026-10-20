import { buildRoadmap, buildSnapshots } from '@shared/learning'
import { selectFlashcards, selectQuestions } from '@shared/questions'
import { difficultySchema, publicQuestionSchema, skillSchema } from '@shared/schemas'
import type { ContentSource, Difficulty, Profile, Roadmap, SkillId, SkillSnapshot } from '@shared/types'
import { z } from 'zod'

const generatedSchema = z.object({
  source: z.enum(['ai', 'fallback']),
  notice: z.string().optional(),
  sessionId: z.string().min(8),
  questions: z.array(publicQuestionSchema).min(1),
})

const revealSchema = z.object({
  correct: z.boolean(),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
})

const resourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  topic: z.string(),
  type: z.enum(['article', 'documentation', 'course', 'exercise']),
  difficulty: difficultySchema,
  durationMin: z.number(),
  why: z.string(),
  url: z.string().optional(),
  verified: z.boolean(),
})

const roadmapSchema = z.object({
  source: z.enum(['ai', 'fallback']),
  notice: z.string().optional(),
  roadmap: z.object({
    id: z.string(),
    goal: z.string(),
    level: difficultySchema,
    gaps: z.array(skillSchema),
    source: z.enum(['ai', 'fallback', 'demo']),
    generatedAt: z.string(),
    budgetMin: z.number(),
    plannedMin: z.number(),
    modules: z.array(z.object({
      id: z.string(),
      skill: skillSchema,
      title: z.string(),
      summary: z.string(),
      checkpoint: z.string(),
      lessons: z.array(z.object({
        id: z.string(),
        title: z.string(),
        topics: z.array(z.string()),
        objectives: z.array(z.string()),
        exercise: z.string(),
        durationMin: z.number().positive(),
        resources: z.array(resourceSchema),
      })).min(1),
    })).min(1),
  }),
})

const flashSchema = z.object({
  source: z.enum(['ai', 'fallback']),
  notice: z.string().optional(),
  cards: z.array(z.object({
    id: z.string(),
    front: z.string(),
    back: z.string(),
    topic: z.string(),
  })).min(1),
})

const recommendationSchema = z.object({
  source: z.enum(['ai', 'fallback']),
  notice: z.string().optional(),
  resources: z.array(resourceSchema.extend({ skill: skillSchema })),
})

export interface PublicQuestion {
  id: string
  prompt: string
  choices: string[]
  topic: string
  difficulty: Difficulty
}

export interface LocalQuestion extends PublicQuestion {
  correctIndex: number
  explanation: string
}

export type PracticeSession =
  | { mode: 'remote'; source: ContentSource; notice?: string; sessionId: string; questions: PublicQuestion[] }
  | { mode: 'local'; source: 'fallback'; notice: string; questions: LocalQuestion[] }

async function postJson(url: string, body: unknown): Promise<unknown> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload: unknown = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
      ? payload.error
      : 'Request failed'
    throw new Error(message)
  }
  return payload
}

export async function fetchHealth(): Promise<{ ok: boolean; ai: boolean } | null> {
  try {
    const response = await fetch('/api/health')
    if (!response.ok) return null
    const payload = z.object({ ok: z.boolean(), ai: z.boolean() }).parse(await response.json())
    return payload
  } catch {
    return null
  }
}

export async function openQuestionSession(kind: 'assessment' | 'quiz', input: { skill: SkillId; difficulty: Difficulty; count: number; topic?: string; careerGoal?: string; knownSkills?: string[] }): Promise<PracticeSession> {
  const path = kind === 'assessment' ? '/api/assessment/generate' : '/api/practice/quiz'
  try {
    const parsed = generatedSchema.parse(await postJson(path, input))
    return { mode: 'remote', source: parsed.source, notice: parsed.notice, sessionId: parsed.sessionId, questions: parsed.questions }
  } catch {
    const questions = selectQuestions(input.skill, input.difficulty, input.count, Math.random, input.topic).map((question) => ({
      ...question,
      choices: [...question.choices],
    }))
    return {
      mode: 'local',
      source: 'fallback',
      notice: 'Built-in question bank. The live model is not available, so these are not AI-generated questions.',
      questions,
    }
  }
}

export async function revealQuestion(session: PracticeSession, questionId: string, selectedIndex: number) {
  if (session.mode === 'local') {
    const question = session.questions.find((item) => item.id === questionId)
    if (!question) throw new Error('That question is no longer available.')
    return {
      correct: question.correctIndex === selectedIndex,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
    }
  }
  return revealSchema.parse(await postJson('/api/assessment/evaluate', {
    sessionId: session.sessionId,
    questionId,
    selectedIndex,
  }))
}

export async function openFlashcards(skill: SkillId, count = 6, topic?: string, difficulty?: Difficulty): Promise<{ source: ContentSource; notice?: string; cards: { id: string; front: string; back: string; topic: string }[] }> {
  try {
    return flashSchema.parse(await postJson('/api/practice/flashcards', { skill, count, topic, difficulty }))
  } catch {
    return {
      source: 'fallback',
      notice: 'Built-in flashcards. The live model is not available.',
      cards: selectFlashcards(skill, count, topic, difficulty),
    }
  }
}

export async function requestRoadmap(profile: Profile, snapshots: SkillSnapshot[]): Promise<{ source: ContentSource; notice?: string; roadmap: Roadmap }> {
  try {
    const parsed = roadmapSchema.parse(await postJson('/api/roadmap/generate', {
      careerGoal: profile.careerGoal,
      experienceLevel: profile.experienceLevel,
      weeklyHours: profile.weeklyHours,
      targetWeeks: profile.targetWeeks,
      learningStyle: profile.learningStyle,
      interests: profile.interests,
      gaps: snapshots.map((snapshot) => ({
        skill: snapshot.skill,
        proficiency: snapshot.proficiency,
        target: snapshot.target,
        gap: snapshot.gap,
        source: snapshot.source,
      })),
    }))
    if (parsed.roadmap.plannedMin > parsed.roadmap.budgetMin) throw new Error('Roadmap exceeded the time budget')
    return { source: parsed.source, notice: parsed.notice, roadmap: parsed.roadmap }
  } catch {
    return {
      source: 'fallback',
      notice: 'Built-in roadmap fitted to your hours. The live model is not available.',
      roadmap: buildRoadmap(profile, snapshots.length ? snapshots : buildSnapshots(profile, []), 'fallback'),
    }
  }
}

export async function requestRecommendations(profile: Profile, snapshots: SkillSnapshot[]) {
  try {
    return recommendationSchema.parse(await postJson('/api/recommendations/generate', {
      careerGoal: profile.careerGoal,
      learningStyle: profile.learningStyle,
      gaps: snapshots.map((snapshot) => ({ skill: snapshot.skill, gap: snapshot.gap })),
    }))
  } catch {
    return null
  }
}
