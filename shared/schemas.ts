import { z } from 'zod'
import { EDUCATION_LEVELS, EXPERIENCE_LEVELS, INTERESTS, LEARNING_STYLES, SKILL_IDS } from './types'

export const profileSchema = z.object({
  displayName: z.string().trim().min(2, 'Use at least 2 characters.').max(40),
  educationLevel: z.enum(EDUCATION_LEVELS),
  interests: z.array(z.enum(INTERESTS)).min(1, 'Choose at least one interest.').max(7),
  careerGoal: z.string().trim().min(3, 'Add a short career or learning goal.').max(80),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  knownSkills: z.array(z.string().trim().min(1).max(40)).max(20),
  weeklyHours: z.number().int().min(1).max(40),
  learningStyle: z.enum(LEARNING_STYLES),
  targetWeeks: z.number().int().min(1).max(52),
})

export const skillSchema = z.enum(SKILL_IDS)
export const difficultySchema = z.enum(EXPERIENCE_LEVELS)

export const generateAssessmentInput = z.object({
  skill: skillSchema,
  difficulty: difficultySchema,
  count: z.number().int().min(3).max(5).default(5),
  knownSkills: z.array(z.string().max(40)).max(20).optional(),
  careerGoal: z.string().max(80).optional(),
})

export const generateQuizInput = z.object({
  skill: skillSchema,
  difficulty: difficultySchema,
  count: z.number().int().min(3).max(5).default(4),
  topic: z.string().trim().max(80).optional(),
})

export const generateFlashcardsInput = z.object({
  skill: skillSchema,
  difficulty: difficultySchema.optional(),
  count: z.number().int().min(3).max(8).default(6),
  topic: z.string().trim().max(80).optional(),
})

export const revealInput = z.object({
  sessionId: z.string().min(8).max(80),
  questionId: z.string().min(1).max(80),
  selectedIndex: z.number().int().min(0).max(3),
})

export const publicQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  choices: z.array(z.string()).length(4),
  topic: z.string(),
  difficulty: difficultySchema,
})

export const revealResultSchema = z.object({
  correct: z.boolean(),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
})

export const aiQuizSchema = z.object({
  questions: z
    .array(
      z.object({
        prompt: z.string().min(8).max(400),
        choices: z.array(z.string().min(1).max(200)).length(4),
        correctIndex: z.number().int().min(0).max(3),
        explanation: z.string().min(8).max(700),
        topic: z.string().min(2).max(80),
      }),
    )
    .min(3)
    .max(5),
})

export const aiFlashcardSchema = z.object({
  cards: z
    .array(
      z.object({
        front: z.string().min(8).max(280),
        back: z.string().min(8).max(500),
        topic: z.string().min(2).max(80),
      }),
    )
    .min(3)
    .max(8),
})

export const aiRoadmapSchema = z.object({
  modules: z
    .array(
      z.object({
        skill: skillSchema,
        title: z.string().min(3).max(90),
        summary: z.string().min(8).max(280),
        checkpoint: z.string().min(8).max(220),
        lessons: z
          .array(
            z.object({
              title: z.string().min(3).max(90),
              topics: z.array(z.string().min(2).max(60)).min(1).max(5),
              objectives: z.array(z.string().min(8).max(180)).min(1).max(4),
              exercise: z.string().min(8).max(400),
              resourceIds: z.array(z.string().min(2).max(60)).max(4),
            }),
          )
          .min(1)
          .max(3),
      }),
    )
    .min(1)
    .max(4),
})

export const recommendationInput = z.object({
  careerGoal: z.string().trim().min(3).max(80),
  gaps: z
    .array(
      z.object({
        skill: skillSchema,
        gap: z.number().min(0).max(100),
      }),
    )
    .max(7),
  learningStyle: z.enum(LEARNING_STYLES).optional(),
})

export const roadmapRequestInput = z.object({
  careerGoal: z.string().trim().min(3).max(80),
  experienceLevel: difficultySchema,
  weeklyHours: z.number().int().min(1).max(40),
  targetWeeks: z.number().int().min(1).max(52),
  learningStyle: z.enum(LEARNING_STYLES),
  interests: z.array(z.enum(INTERESTS)).min(1).max(7),
  gaps: z
    .array(
      z.object({
        skill: skillSchema,
        proficiency: z.number().min(0).max(100),
        target: z.number().min(0).max(100),
        gap: z.number().min(0).max(100),
        source: z.enum(['assessment', 'self-report', 'baseline']),
      }),
    )
    .max(7),
})
