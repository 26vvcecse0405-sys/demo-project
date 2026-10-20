import type { Difficulty, Resource, SkillId } from './types'

export interface LessonTemplate {
  id: string
  title: string
  topics: string[]
  objectives: string[]
  exercise: string
  resourceIds: string[]
}

export interface ModuleTemplate {
  id: string
  skill: SkillId
  title: string
  summary: string
  checkpoint: string
  lessons: LessonTemplate[]
}

const resource = (
  id: string,
  title: string,
  topic: string,
  type: Resource['type'],
  difficulty: Difficulty,
  durationMin: number,
  why: string,
  url?: string,
): Resource => ({
  id,
  title,
  topic,
  type,
  difficulty,
  durationMin,
  why,
  url,
  verified: Boolean(url),
})

export const RESOURCES: Resource[] = [
  resource('mdn-learn', 'MDN Learn Web Development', 'Web foundations', 'documentation', 'beginner', 45, 'A maintained introduction to HTML, CSS, and JavaScript.', 'https://developer.mozilla.org/en-US/docs/Learn'),
  resource('web-dev-learn', 'Learn web development on web.dev', 'Web foundations', 'course', 'beginner', 40, 'Short lessons on HTML, CSS, and accessible interfaces.', 'https://web.dev/learn'),
  resource('react-learn', 'React quick start', 'React', 'documentation', 'intermediate', 50, 'Official guide to components, state, and rendering.', 'https://react.dev/learn'),
  resource('python-tutorial', 'Python tutorial', 'Programming', 'documentation', 'beginner', 60, 'The official tour of Python syntax, functions, and data structures.', 'https://docs.python.org/3/tutorial/'),
  resource('kaggle-python', 'Kaggle Learn Python', 'Programming', 'course', 'beginner', 45, 'Short, exercise-heavy Python lessons.', 'https://www.kaggle.com/learn/python'),
  resource('kaggle-ml', 'Kaggle Intro to Machine Learning', 'Machine learning', 'course', 'intermediate', 60, 'A practical first model-building course with exercises.', 'https://www.kaggle.com/learn/intro-to-machine-learning'),
  resource('google-mlcc', 'Machine Learning Crash Course', 'Machine learning', 'course', 'intermediate', 90, 'Google’s introductory course on ML concepts and pitfalls.', 'https://developers.google.com/machine-learning/crash-course'),
  resource('elements-ai', 'Elements of AI', 'Artificial intelligence', 'course', 'beginner', 60, 'A free introduction to what AI systems can and cannot do.', 'https://www.elementsofai.com/'),
  resource('sklearn-start', 'scikit-learn getting started', 'Machine learning', 'documentation', 'intermediate', 40, 'A concise path into fitting and checking a classical model.', 'https://scikit-learn.org/stable/getting_started.html'),
  resource('pandas-start', 'pandas getting started', 'Data analysis', 'documentation', 'beginner', 40, 'How to load, select, and summarize tabular data.', 'https://pandas.pydata.org/docs/getting_started/index.html'),
  resource('khan-stats', 'Khan Academy statistics', 'Statistics', 'course', 'beginner', 50, 'Clear lessons on averages, spread, and reading data carefully.', 'https://www.khanacademy.org/math/statistics-probability'),
  resource('nng-heuristics', 'Nielsen Norman 10 usability heuristics', 'Interface design', 'article', 'intermediate', 25, 'A stable checklist for judging whether an interface is understandable.', 'https://www.nngroup.com/articles/ten-usability-heuristics/'),
  resource('startup-school', 'Startup School', 'Startups', 'course', 'beginner', 45, 'Y Combinator’s free lectures on building something people want.', 'https://www.startupschool.org/'),
  resource('yc-library', 'Y Combinator library', 'Startups', 'article', 'intermediate', 30, 'Essays on problems, users, and early product decisions.', 'https://www.ycombinator.com/library'),
  resource('figma-help', 'Figma help center', 'Design tools', 'documentation', 'beginner', 25, 'Official help for the editor, frames, and prototypes.', 'https://help.figma.com/hc/en-us'),
]

export function resourceById(id: string): Resource | undefined {
  return RESOURCES.find((item) => item.id === id)
}

export const CATALOG: ModuleTemplate[] = [
  {
    id: 'prog-foundations',
    skill: 'programming',
    title: 'Programming foundations',
    summary: 'Write small programs you can explain line by line.',
    checkpoint: 'Write a function with a condition and a loop, then fix one bug you introduced on purpose.',
    lessons: [
      {
        id: 'prog-variables',
        title: 'Values, variables, and decisions',
        topics: ['Variables', 'Types', 'Conditions'],
        objectives: [
          'Store a value and update it',
          'Choose between two paths with a condition',
          'Explain what your program prints and why',
        ],
        exercise: 'Write a program that reads a score and prints pass, merit, or retry using clear conditions.',
        resourceIds: ['python-tutorial', 'kaggle-python'],
      },
      {
        id: 'prog-functions',
        title: 'Functions and collections',
        topics: ['Functions', 'Lists', 'Dictionaries'],
        objectives: [
          'Move repeated steps into a function',
          'Store many items in a list',
          'Look up one item with a key',
        ],
        exercise: 'Build a word-count function that returns a dictionary of word to frequency.',
        resourceIds: ['python-tutorial', 'kaggle-python'],
      },
    ],
  },
  {
    id: 'prog-practice',
    skill: 'programming',
    title: 'Debugging and a tiny project',
    summary: 'Read errors, trace logic, and ship a small tool.',
    checkpoint: 'Explain a bug you fixed and show a test input that used to fail.',
    lessons: [
      {
        id: 'prog-debug',
        title: 'Reading errors and tracing',
        topics: ['Errors', 'Off-by-one', 'Testing'],
        objectives: [
          'Read a traceback from the last call backward',
          'Spot an off-by-one loop',
          'Add one example that locks the fix in place',
        ],
        exercise: 'Take a loop that skips the last item, write a failing example, then fix the boundary.',
        resourceIds: ['python-tutorial'],
      },
      {
        id: 'prog-cli',
        title: 'Mini project: study timer',
        topics: ['Project structure', 'Input', 'Output'],
        objectives: [
          'Break a tool into functions',
          'Handle one bad input without crashing',
          'Describe what the program does in two sentences',
        ],
        exercise: 'Build a command-line study timer that logs a subject and minutes, then prints today’s total.',
        resourceIds: ['kaggle-python'],
      },
    ],
  },
  {
    id: 'web-foundations',
    skill: 'web',
    title: 'Pages that read clearly',
    summary: 'Structure a page and lay it out so the main action is obvious.',
    checkpoint: 'Publish a one-page profile that is readable on a phone and usable with a keyboard.',
    lessons: [
      {
        id: 'web-html',
        title: 'Semantic structure',
        topics: ['HTML', 'Headings', 'Buttons'],
        objectives: [
          'Use headings in order',
          'Choose a button or a link for the right job',
          'Write alt text for an informative image',
        ],
        exercise: 'Mark up a student profile with header, main, and a real button. Tab through it without a mouse.',
        resourceIds: ['mdn-learn', 'web-dev-learn'],
      },
      {
        id: 'web-layout',
        title: 'Layout and spacing',
        topics: ['Flexbox', 'Spacing', 'Responsive'],
        objectives: [
          'Align a row of actions with Flexbox',
          'Stack the layout on a narrow screen',
          'Keep text contrast readable',
        ],
        exercise: 'Turn the profile into a responsive card: side by side on desktop, stacked on a phone.',
        resourceIds: ['mdn-learn', 'web-dev-learn'],
      },
    ],
  },
  {
    id: 'web-interactive',
    skill: 'web',
    title: 'Interactive interfaces',
    summary: 'Add behavior without losing the structure you already built.',
    checkpoint: 'Ship a page that loads data, shows a pending state, and survives a failed request.',
    lessons: [
      {
        id: 'web-dom',
        title: 'DOM events and state',
        topics: ['DOM', 'Events', 'State'],
        objectives: [
          'Update the page from a user action',
          'Keep the current value in one place',
          'Avoid duplicating the same text in three handlers',
        ],
        exercise: 'Add a topic filter to a list of lessons. One state value should drive the visible list.',
        resourceIds: ['mdn-learn', 'react-learn'],
      },
      {
        id: 'web-react',
        title: 'Mini project: lesson tracker',
        topics: ['Components', 'Props', 'Feedback'],
        objectives: [
          'Split a screen into components',
          'Pass data with props',
          'Show empty, loading, and done states',
        ],
        exercise: 'Build a three-lesson tracker. Completing a lesson updates a progress label immediately.',
        resourceIds: ['react-learn', 'web-dev-learn'],
      },
    ],
  },
  {
    id: 'ai-foundations',
    skill: 'ai',
    title: 'How AI systems behave',
    summary: 'Separate training, inference, and claims a model cannot support.',
    checkpoint: 'Explain training, inference, and one way a model answer can be wrong.',
    lessons: [
      {
        id: 'ai-models',
        title: 'Models, data, and predictions',
        topics: ['Models', 'Examples', 'Predictions'],
        objectives: [
          'Describe what a model learned from',
          'Tell training apart from inference',
          'Name one limit of a prediction',
        ],
        exercise: 'Write a half-page explanation of a spam filter for a classmate who has never trained a model.',
        resourceIds: ['elements-ai', 'google-mlcc'],
      },
      {
        id: 'ai-limits',
        title: 'Checking model output',
        topics: ['Hallucinations', 'Sources', 'Evaluation'],
        objectives: [
          'Flag an unsupported claim',
          'Ask for a source before trusting a fact',
          'Compare two prompts on the same question',
        ],
        exercise: 'Ask the same study question two ways. Record which answer is more specific and which claims you would still verify.',
        resourceIds: ['elements-ai', 'google-mlcc'],
      },
    ],
  },
  {
    id: 'ai-practice',
    skill: 'ai',
    title: 'A first practical model',
    summary: 'Train a small classical model and judge it on data it has not seen.',
    checkpoint: 'Report training and test results, and say whether the model overfit.',
    lessons: [
      {
        id: 'ai-supervised',
        title: 'Supervised learning',
        topics: ['Labels', 'Features', 'Overfitting'],
        objectives: [
          'Point to the inputs and the label',
          'Explain why a test set exists',
          'Recognize a perfect training score as a warning',
        ],
        exercise: 'Fit a simple classifier on a tutorial dataset and write three sentences on the test result.',
        resourceIds: ['kaggle-ml', 'sklearn-start'],
      },
      {
        id: 'ai-mini',
        title: 'Mini project: study-habit classifier',
        topics: ['Features', 'Evaluation', 'Communication'],
        objectives: [
          'Choose three features you can explain',
          'Keep a test split',
          'Describe one mistake the model makes',
        ],
        exercise: 'Predict whether a study session was focused or distracted from hours, time of day, and subject. Document one error.',
        resourceIds: ['kaggle-ml', 'sklearn-start'],
      },
    ],
  },
  {
    id: 'data-foundations',
    skill: 'data',
    title: 'Questions before charts',
    summary: 'Clean a table and choose a summary that matches the question.',
    checkpoint: 'Answer one question from a table and show the rows you used.',
    lessons: [
      {
        id: 'data-tables',
        title: 'Rows, columns, and questions',
        topics: ['Tables', 'Types', 'Questions'],
        objectives: [
          'Say what one row represents',
          'Pick a column that answers a question',
          'Notice a column stored as text that should be numeric',
        ],
        exercise: 'Load a small CSV and list three questions it can answer and one it cannot.',
        resourceIds: ['pandas-start', 'khan-stats'],
      },
      {
        id: 'data-summary',
        title: 'Summaries that stay honest',
        topics: ['Mean', 'Median', 'Missing values'],
        objectives: [
          'Choose mean or median when outliers exist',
          'Count missing values before dropping rows',
          'Write the caveat next to the number',
        ],
        exercise: 'Summarize a score column with and without the top outlier. Explain which number you would show a teacher.',
        resourceIds: ['khan-stats', 'pandas-start'],
      },
    ],
  },
  {
    id: 'data-practice',
    skill: 'data',
    title: 'A small analysis',
    summary: 'Turn a table into a claim you can defend.',
    checkpoint: 'Present one chart, one comparison, and one thing the data cannot prove.',
    lessons: [
      {
        id: 'data-charts',
        title: 'Charts and comparisons',
        topics: ['Charts', 'Comparison', 'Correlation'],
        objectives: [
          'Match a chart type to a comparison',
          'Avoid a cause claim from correlation alone',
          'Label units and the group you included',
        ],
        exercise: 'Compare two subjects’ study minutes. Write the claim and a sentence you are not willing to claim.',
        resourceIds: ['khan-stats', 'pandas-start'],
      },
      {
        id: 'data-mini',
        title: 'Mini project: study log analysis',
        topics: ['Cleaning', 'Grouping', 'Reporting'],
        objectives: [
          'Clean one messy column',
          'Group results by subject',
          'Recommend one change based on the pattern',
        ],
        exercise: 'Analyze a week of study logs and recommend the best one-hour block to protect next week.',
        resourceIds: ['pandas-start'],
      },
    ],
  },
  {
    id: 'design-foundations',
    skill: 'design',
    title: 'Screens people can scan',
    summary: 'Use hierarchy, contrast, and consistency on a real page.',
    checkpoint: 'Critique one screen with three heuristics and redesign the primary action.',
    lessons: [
      {
        id: 'design-hierarchy',
        title: 'Hierarchy and contrast',
        topics: ['Hierarchy', 'Type', 'Contrast'],
        objectives: [
          'Make one action dominant',
          'Check text contrast',
          'Reduce competing headings',
        ],
        exercise: 'Redesign a crowded settings page so Save is the obvious action and destructive actions look different.',
        resourceIds: ['nng-heuristics', 'figma-help'],
      },
      {
        id: 'design-flow',
        title: 'Flow and feedback',
        topics: ['Consistency', 'Empty states', 'Feedback'],
        objectives: [
          'Keep buttons consistent',
          'Design the empty state',
          'Show what happens after a click',
        ],
        exercise: 'Sketch a three-step onboarding flow, including the screen someone sees when they have no data yet.',
        resourceIds: ['nng-heuristics', 'figma-help'],
      },
    ],
  },
  {
    id: 'biz-foundations',
    skill: 'business',
    title: 'A problem worth a sprint',
    summary: 'Define the user, the problem, and the smallest test.',
    checkpoint: 'Write a one-page plan with a user, a problem, and the metric you will watch.',
    lessons: [
      {
        id: 'biz-problem',
        title: 'User and problem',
        topics: ['Users', 'Problems', 'Evidence'],
        objectives: [
          'Name a specific user',
          'Separate the problem from your favorite solution',
          'List one piece of evidence you still need',
        ],
        exercise: 'Interview prompt: write five questions you would ask a student about how they choose what to study.',
        resourceIds: ['startup-school', 'yc-library'],
      },
      {
        id: 'biz-metrics',
        title: 'MVP and metrics',
        topics: ['MVP', 'Retention', 'Tradeoffs'],
        objectives: [
          'Cut a feature list to one test',
          'Pick retention or completion as the signal',
          'Name the tradeoff you are accepting',
        ],
        exercise: 'For a campus study app, choose one MVP and the number that would convince you to continue.',
        resourceIds: ['startup-school', 'yc-library'],
      },
    ],
  },
  {
    id: 'comm-foundations',
    skill: 'communication',
    title: 'Explanations people can use',
    summary: 'Lead with the point and support it with an example.',
    checkpoint: 'Explain one technical idea in under a minute to a non-expert.',
    lessons: [
      {
        id: 'comm-structure',
        title: 'Point, then support',
        topics: ['Structure', 'Audience', 'Editing'],
        objectives: [
          'Open with the result',
          'Cut jargon the audience does not need',
          'End with the action you want',
        ],
        exercise: 'Rewrite a 200-word project update into 80 words that start with the result.',
        resourceIds: [],
      },
      {
        id: 'comm-teach',
        title: 'Teach with an example',
        topics: ['Examples', 'Feedback', 'Clarity'],
        objectives: [
          'Pair a definition with one example',
          'Give feedback on the work, not the person',
          'Ask a question that checks understanding',
        ],
        exercise: 'Explain what a variable is to a school student, then write one check question.',
        resourceIds: [],
      },
    ],
  },
]

export function lessonsForSkill(skill: SkillId): LessonTemplate[] {
  return CATALOG.filter((module) => module.skill === skill).flatMap((module) => module.lessons)
}
