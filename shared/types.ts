export const SKILL_IDS = [
  'programming',
  'web',
  'ai',
  'data',
  'design',
  'business',
  'communication',
] as const

export type SkillId = (typeof SKILL_IDS)[number]

export const INTERESTS = [
  'programming',
  'ai',
  'data-science',
  'web-development',
  'business',
  'communication',
  'design',
] as const

export type Interest = (typeof INTERESTS)[number]

export const EDUCATION_LEVELS = ['school', 'college', 'self-taught', 'career-switch'] as const
export type EducationLevel = (typeof EDUCATION_LEVELS)[number]

export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]
export type Difficulty = ExperienceLevel

export const LEARNING_STYLES = ['reading', 'examples', 'videos', 'practice'] as const
export type LearningStyle = (typeof LEARNING_STYLES)[number]

export type ContentSource = 'ai' | 'fallback' | 'demo'

export interface Profile {
  id: string
  displayName: string
  educationLevel: EducationLevel
  interests: Interest[]
  careerGoal: string
  experienceLevel: ExperienceLevel
  knownSkills: string[]
  weeklyHours: number
  learningStyle: LearningStyle
  targetWeeks: number
  createdAt: string
}

export interface Resource {
  id: string
  title: string
  topic: string
  type: 'article' | 'documentation' | 'course' | 'exercise'
  difficulty: Difficulty
  durationMin: number
  why: string
  url?: string
  verified: boolean
}

export interface Lesson {
  id: string
  title: string
  topics: string[]
  objectives: string[]
  resources: Resource[]
  exercise: string
  durationMin: number
}

export interface RoadmapModule {
  id: string
  skill: SkillId
  title: string
  summary: string
  checkpoint: string
  lessons: Lesson[]
}

export interface Roadmap {
  id: string
  goal: string
  level: ExperienceLevel
  gaps: SkillId[]
  modules: RoadmapModule[]
  source: ContentSource
  generatedAt: string
  budgetMin: number
  plannedMin: number
}

export interface GradedQuestion {
  id: string
  skill: SkillId
  topic: string
  difficulty: Difficulty
  prompt: string
  choices: string[]
  correctIndex: number
  explanation: string
  selectedIndex: number
}

export interface AssessmentAttempt {
  id: string
  skill: SkillId
  difficulty: Difficulty
  questions: GradedQuestion[]
  scorePercent: number
  correct: number
  total: number
  completedAt: string
  source: ContentSource
}

export interface QuizAttempt {
  id: string
  topic: string
  skill: SkillId
  difficulty: Difficulty
  scorePercent: number
  correct: number
  total: number
  wrongTopics: string[]
  completedAt: string
  source: ContentSource
}

export interface StoredActivity {
  id: string
  type: 'assessment' | 'quiz' | 'flashcard'
  label: string
  xp: number
  minutes: number
  date: string
  createdAt: string
  ref: string
}

export interface AppData {
  profile: Profile | null
  attempts: AssessmentAttempt[]
  roadmap: Roadmap | null
  quizAttempts: QuizAttempt[]
  cardMarks: Record<string, 'know' | 'review'>
  activities: StoredActivity[]
  lessonCompletions: Record<string, string>
  theme: 'light' | 'dark'
  workspace: 'empty' | 'sample' | 'custom'
}

export interface SkillSnapshot {
  skill: SkillId
  label: string
  proficiency: number
  target: number
  gap: number
  source: 'assessment' | 'self-report' | 'baseline'
  interestMatch: boolean
  careerRelevant: boolean
  note?: string
  evidence?: {
    scorePercent: number
    completedAt: string
    difficulty: Difficulty
    correct: number
    total: number
  }
}

export const SKILL_LABEL: Record<SkillId, string> = {
  programming: 'Programming',
  web: 'Web Development',
  ai: 'Artificial Intelligence',
  data: 'Data Science',
  design: 'Design',
  business: 'Business',
  communication: 'Communication',
}

export const INTEREST_LABEL: Record<Interest, string> = {
  programming: 'Programming',
  ai: 'Artificial Intelligence',
  'data-science': 'Data Science',
  'web-development': 'Web Development',
  business: 'Business',
  communication: 'Communication',
  design: 'Design',
}

export const INTEREST_TO_SKILL: Record<Interest, SkillId> = {
  programming: 'programming',
  ai: 'ai',
  'data-science': 'data',
  'web-development': 'web',
  business: 'business',
  communication: 'communication',
  design: 'design',
}

export const EDUCATION_LABEL: Record<EducationLevel, string> = {
  school: 'School',
  college: 'College',
  'self-taught': 'Self-taught',
  'career-switch': 'Career switch',
}

export const STYLE_LABEL: Record<LearningStyle, string> = {
  reading: 'Reading',
  examples: 'Worked examples',
  videos: 'Videos',
  practice: 'Hands-on practice',
}

export const XP = {
  lesson: 25,
  assessment: 40,
  quizBase: 10,
  quizHighBonus: 20,
  flashcard: 5,
  moduleBonus: 50,
} as const

export const ACHIEVEMENTS = [
  {
    id: 'first-sprint',
    title: 'First Sprint',
    description: 'Complete your first lesson.',
  },
  {
    id: 'quiz-champion',
    title: 'Quiz Champion',
    description: 'Score 80% or higher on a practice quiz.',
  },
  {
    id: 'consistency-star',
    title: 'Consistency Star',
    description: 'Learn on 3 consecutive days.',
  },
  {
    id: 'skill-builder',
    title: 'Skill Builder',
    description: 'Complete every lesson in a module.',
  },
  {
    id: 'roadmap-explorer',
    title: 'Roadmap Explorer',
    description: 'Complete every lesson on your roadmap.',
  },
] as const

export type AchievementId = (typeof ACHIEVEMENTS)[number]['id']

export function uid(prefix = 'id'): string {
  const rand = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${rand}`
}

export function emptyData(theme: 'light' | 'dark' = 'dark'): AppData {
  return {
    profile: null,
    attempts: [],
    roadmap: null,
    quizAttempts: [],
    cardMarks: {},
    activities: [],
    lessonCompletions: {},
    theme,
    workspace: 'empty',
  }
}
