import cors from 'cors'
import dotenv from 'dotenv'
import express, { type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import { resourceById } from '../shared/catalog.js'
import { recommendResources, roadmapFromDrafts, buildRoadmap, createProfile } from '../shared/learning.js'
import { selectFlashcards, selectQuestions } from '../shared/questions.js'
import {
  aiFlashcardSchema,
  aiQuizSchema,
  aiRoadmapSchema,
  difficultySchema,
  generateAssessmentInput,
  generateFlashcardsInput,
  generateQuizInput,
  publicQuestionSchema,
  recommendationInput,
  revealInput,
  roadmapRequestInput,
  skillSchema,
} from '../shared/schemas.js'
import { INTEREST_TO_SKILL, SKILL_LABEL, type Difficulty, type SkillId, type SkillSnapshot } from '../shared/types.js'
import { completeJson, aiConfigured } from './openai.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

const hits = new Map<string, number[]>()

function tooMany(request: Request): boolean {
  const key = request.ip || 'local'
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((stamp) => now - stamp < 60_000)
  if (recent.length >= 30) return true
  recent.push(now)
  hits.set(key, recent)
  return false
}

interface HiddenQuestion {
  id: string
  prompt: string
  choices: string[]
  correctIndex: number
  explanation: string
  topic: string
  difficulty: Difficulty
  skill: SkillId
}

const sessions = new Map<string, { at: number; questions: HiddenQuestion[] }>()

function pruneSessions() {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000
  for (const [id, session] of sessions) {
    if (session.at < cutoff) sessions.delete(id)
  }
}

function publish(questions: HiddenQuestion[]) {
  pruneSessions()
  const sessionId = crypto.randomUUID()
  sessions.set(sessionId, { at: Date.now(), questions })
  return {
    sessionId,
    questions: questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      choices: question.choices,
      topic: question.topic,
      difficulty: question.difficulty,
    })),
  }
}

function bankQuestions(skill: SkillId, difficulty: Difficulty, count: number, topic?: string): HiddenQuestion[] {
  return selectQuestions(skill, difficulty, count, Math.random, topic).map((question) => ({
    ...question,
    choices: [...question.choices],
  }))
}

function guard(request: Request, response: Response): boolean {
  if (!tooMany(request)) return true
  response.status(429).json({ error: 'Too many requests. Wait a minute and try again.' })
  return false
}

function readBody<Schema extends z.ZodTypeAny>(schema: Schema, request: Request, response: Response): z.infer<Schema> | null {
  const result = schema.safeParse(request.body)
  if (result.success) return result.data
  response.status(400).json({ error: result.error.issues[0]?.message ?? 'Check the form and try again.' })
  return null
}

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    ai: aiConfigured(),
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  })
})

app.post('/api/assessment/generate', async (request, response, next) => {
  try {
    if (!guard(request, response)) return
    const input = readBody(generateAssessmentInput, request, response)
    if (!input) return
    const fallback = bankQuestions(input.skill, input.difficulty, input.count)
    if (!aiConfigured()) {
      response.json({ source: 'fallback', notice: 'Built-in question bank. Add an OpenAI API key to generate new questions.', ...publish(fallback) })
      return
    }
    try {
      const raw = await completeJson(
        'You write original formative assessment questions. Return JSON only. Do not include markdown.',
        `Create ${input.count} ${input.difficulty} multiple-choice questions about ${SKILL_LABEL[input.skill]}. Career context: ${input.careerGoal ?? 'student'}. Known skills: ${(input.knownSkills ?? []).join(', ') || 'none listed'}. JSON shape: {"questions":[{"prompt":"","choices":["","","",""],"correctIndex":0,"explanation":"","topic":""}]}`,
      )
      const parsed = aiQuizSchema.parse(raw)
      const questions: HiddenQuestion[] = parsed.questions.map((question, index) => ({
        id: `ai-${index + 1}`,
        skill: input.skill,
        difficulty: input.difficulty,
        prompt: question.prompt,
        choices: question.choices,
        correctIndex: question.correctIndex,
        explanation: question.explanation,
        topic: question.topic,
      }))
      response.json({ source: 'ai', ...publish(questions) })
    } catch (error) {
      console.error('Assessment generation failed:', error instanceof Error ? error.message : 'unknown')
      response.json({
        source: 'fallback',
        notice: 'The model response could not be used. Showing the built-in question bank.',
        ...publish(fallback),
      })
    }
  } catch (error) {
    next(error)
  }
})

app.post('/api/assessment/evaluate', (request, response) => {
  if (!guard(request, response)) return
  const input = readBody(revealInput, request, response)
  if (!input) return
  const session = sessions.get(input.sessionId)
  const question = session?.questions.find((item) => item.id === input.questionId)
  if (!question) {
    response.status(404).json({ error: 'This assessment session expired. Start again to score a new set.' })
    return
  }
  response.json({
    correct: question.correctIndex === input.selectedIndex,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
  })
})

app.post('/api/practice/quiz', async (request, response, next) => {
  try {
    if (!guard(request, response)) return
    const input = readBody(generateQuizInput, request, response)
    if (!input) return
    const fallback = bankQuestions(input.skill, input.difficulty, input.count, input.topic)
    if (!aiConfigured()) {
      response.json({ source: 'fallback', notice: 'Built-in practice set. This was not generated by a live model.', ...publish(fallback) })
      return
    }
    try {
      const raw = await completeJson(
        'You write original practice quizzes for students. Return JSON only. One choice must be clearly correct.',
        `Create ${input.count} ${input.difficulty} questions about ${SKILL_LABEL[input.skill]}. Focus: ${input.topic || 'the next foundational ideas'}. JSON shape: {"questions":[{"prompt":"","choices":["","","",""],"correctIndex":0,"explanation":"","topic":""}]}`,
      )
      const parsed = aiQuizSchema.parse(raw)
      const questions: HiddenQuestion[] = parsed.questions.map((question, index) => ({
        id: `quiz-${index + 1}`,
        skill: input.skill,
        difficulty: input.difficulty,
        prompt: question.prompt,
        choices: question.choices,
        correctIndex: question.correctIndex,
        explanation: question.explanation,
        topic: question.topic,
      }))
      response.json({ source: 'ai', ...publish(questions) })
    } catch (error) {
      console.error('Quiz generation failed:', error instanceof Error ? error.message : 'unknown')
      response.json({
        source: 'fallback',
        notice: 'The model response could not be used. Showing the built-in practice set.',
        ...publish(fallback),
      })
    }
  } catch (error) {
    next(error)
  }
})

app.post('/api/practice/flashcards', async (request, response, next) => {
  try {
    if (!guard(request, response)) return
    const input = readBody(generateFlashcardsInput, request, response)
    if (!input) return
    const fallback = selectFlashcards(input.skill, input.count, input.topic, input.difficulty).map((card) => ({
      id: card.id,
      front: card.front,
      back: card.back,
      topic: card.topic,
    }))
    if (!aiConfigured()) {
      response.json({ source: 'fallback', notice: 'Built-in flashcards. This was not generated by a live model.', cards: fallback })
      return
    }
    try {
      const raw = await completeJson(
        'You write concise study flashcards. Return JSON only. Teach one idea per card.',
        `Create ${input.count} flashcards about ${SKILL_LABEL[input.skill]}. Focus: ${input.topic || 'foundations'}. JSON shape: {"cards":[{"front":"","back":"","topic":""}]}`,
      )
      const parsed = aiFlashcardSchema.parse(raw)
      response.json({
        source: 'ai',
        cards: parsed.cards.map((card, index) => ({ id: `card-ai-${index + 1}`, ...card })),
      })
    } catch (error) {
      console.error('Flashcard generation failed:', error instanceof Error ? error.message : 'unknown')
      response.json({
        source: 'fallback',
        notice: 'The model response could not be used. Showing the built-in flashcards.',
        cards: fallback,
      })
    }
  } catch (error) {
    next(error)
  }
})

app.post('/api/roadmap/generate', async (request, response, next) => {
  try {
    if (!guard(request, response)) return
    const input = readBody(roadmapRequestInput, request, response)
    if (!input) return
    const profile = createProfile({
      displayName: 'Student',
      educationLevel: 'college',
      interests: input.interests,
      careerGoal: input.careerGoal,
      experienceLevel: input.experienceLevel,
      knownSkills: [],
      weeklyHours: input.weeklyHours,
      learningStyle: input.learningStyle,
      targetWeeks: input.targetWeeks,
    })
    const snapshots: SkillSnapshot[] = input.gaps.map((gap) => ({
      skill: gap.skill,
      label: SKILL_LABEL[gap.skill],
      proficiency: gap.proficiency,
      target: gap.target,
      gap: gap.gap,
      source: gap.source,
      interestMatch: input.interests.some((interest) => INTEREST_TO_SKILL[interest] === gap.skill),
      careerRelevant: true,
    }))
    const fallback = buildRoadmap(profile, snapshots, 'fallback')
    if (!aiConfigured()) {
      response.json({
        source: 'fallback',
        notice: 'Built-in roadmap fitted to your hours. Add an OpenAI API key for a model-written plan.',
        roadmap: fallback,
      })
      return
    }
    try {
      const ids = ['mdn-learn', 'web-dev-learn', 'react-learn', 'python-tutorial', 'kaggle-python', 'kaggle-ml', 'google-mlcc', 'elements-ai', 'sklearn-start', 'pandas-start', 'khan-stats', 'nng-heuristics', 'startup-school', 'yc-library', 'figma-help']
      const raw = await completeJson(
        'You design practical study roadmaps. Return JSON only. Never invent URLs. Never mark lessons complete. Use only the provided resource ids.',
        `Student goal: ${input.careerGoal}. Level: ${input.experienceLevel}. Style: ${input.learningStyle}. Time: ${input.weeklyHours} hours/week for ${input.targetWeeks} weeks. Gaps: ${input.gaps.map((gap) => `${gap.skill} ${gap.gap} points (${gap.source})`).join('; ')}. Resource ids: ${ids.join(', ')}. JSON shape: {"modules":[{"skill":"programming","title":"","summary":"","checkpoint":"","lessons":[{"title":"","topics":["topic"],"objectives":["A clear objective."],"exercise":"A hands-on task.","resourceIds":["python-tutorial"]}]}]}`,
      )
      const parsed = aiRoadmapSchema.parse(raw)
      const roadmap = roadmapFromDrafts(profile, snapshots, parsed.modules)
      if (roadmap.plannedMin > roadmap.budgetMin || roadmap.modules.length === 0) {
        throw new Error('Roadmap did not fit the time budget')
      }
      response.json({ source: 'ai', notice: 'Generated with OpenAI. SkillSprint fit the lesson time to your weekly hours.', roadmap })
    } catch (error) {
      console.error('Roadmap generation failed:', error instanceof Error ? error.message : 'unknown')
      response.json({
        source: 'fallback',
        notice: 'The model response could not be used. Showing a roadmap from the built-in catalog.',
        roadmap: fallback,
      })
    }
  } catch (error) {
    next(error)
  }
})

app.post('/api/recommendations/generate', async (request, response, next) => {
  try {
    if (!guard(request, response)) return
    const input = readBody(recommendationInput, request, response)
    if (!input) return
    const snapshots: SkillSnapshot[] = input.gaps.map((gap) => ({
      skill: gap.skill,
      label: SKILL_LABEL[gap.skill],
      proficiency: 0,
      target: gap.gap,
      gap: gap.gap,
      source: 'assessment',
      interestMatch: true,
      careerRelevant: true,
    }))
    const items = recommendResources(snapshots)
    let resources = items.map((item) => ({ ...item.resource, skill: item.skill }))
    if (aiConfigured() && resources.length) {
      try {
        const raw = await completeJson(
          'You explain why a study resource is relevant. Return JSON only. Do not invent resources or URLs.',
          `Career goal: ${input.careerGoal}. For each id write one sentence. Ids: ${resources.map((item) => item.id).join(', ')}. JSON shape: {"notes":[{"id":"mdn-learn","why":"One sentence."}]}`,
        )
        const parsed = z.object({
          notes: z.array(z.object({ id: z.string(), why: z.string().min(8).max(220) })).max(8),
        }).parse(raw)
        const notes = new Map(parsed.notes.map((note) => [note.id, note.why]))
        resources = resources.map((item) => ({ ...item, why: notes.get(item.id) ?? item.why }))
        response.json({ source: 'ai', notice: 'Relevance notes were written by OpenAI. Links come only from the verified catalog.', resources })
        return
      } catch (error) {
        console.error('Recommendation notes failed:', error instanceof Error ? error.message : 'unknown')
      }
    }
    response.json({
      source: 'fallback',
      notice: 'Suggested from the verified SkillSprint catalog. Links are included only where the URL is known.',
      resources,
    })
  } catch (error) {
    next(error)
  }
})

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  console.error(error instanceof Error ? error.message : 'Unknown server error')
  response.status(500).json({ error: 'The server could not finish that request.' })
})

const port = Number(process.env.PORT) || 8787
app.listen(port, () => {
  console.log(`SkillSprint API listening on ${port}. AI ${aiConfigured() ? 'configured' : 'off — using built-in content'}.`)
})

export const responseSchemas = { publicQuestionSchema, skillSchema, difficultySchema, resourceById }
