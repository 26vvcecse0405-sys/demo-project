import type { Difficulty, SkillId } from './types'
import { EXTRA_CARDS, EXTRA_QUESTIONS } from './extraBank'

export interface BankQuestion {
  id: string
  skill: SkillId
  topic: string
  difficulty: Difficulty
  prompt: string
  choices: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  explanation: string
}

export interface BankCard {
  id: string
  skill: SkillId
  topic: string
  front: string
  back: string
  /** Missing means beginner, so older cards stay usable. */
  difficulty?: Difficulty
}

const BASE_QUESTIONS: BankQuestion[] = [
  {
    id: 'prog-b-1',
    skill: 'programming',
    topic: 'Variables',
    difficulty: 'beginner',
    prompt: 'What is the job of a variable in a program?',
    choices: [
      'It stores a value the program can use later',
      'It compiles the program into an image',
      'It always sends data to the internet',
      'It prevents every kind of bug',
    ],
    correctIndex: 0,
    explanation: 'A variable is a named place to keep a value, such as a score, a name, or a total.',
  },
  {
    id: 'prog-b-2',
    skill: 'programming',
    topic: 'Control flow',
    difficulty: 'beginner',
    prompt: 'Which statement runs a block of code only when a condition is true?',
    choices: ['A loop that always runs forever', 'An if statement', 'A comment', 'A print statement'],
    correctIndex: 1,
    explanation: 'An if statement checks a condition and runs its block only when that condition is true.',
  },
  {
    id: 'prog-i-1',
    skill: 'programming',
    topic: 'Functions',
    difficulty: 'intermediate',
    prompt: 'Why do programmers put repeated steps inside a function?',
    choices: [
      'So the same steps can be named, reused, and tested',
      'Because functions delete unused files',
      'Because a program may contain only one function',
      'So the computer skips those steps',
    ],
    correctIndex: 0,
    explanation: 'A function gives a chunk of behavior a name. Callers reuse it instead of copying the same lines.',
  },
  {
    id: 'prog-i-2',
    skill: 'programming',
    topic: 'Data structures',
    difficulty: 'intermediate',
    prompt: 'You need to look up a student by an id many times. Which structure fits best?',
    choices: [
      'A dictionary or map from id to student',
      'A single boolean',
      'A comment above the loop',
      'An image file',
    ],
    correctIndex: 0,
    explanation: 'A map stores values under keys, so finding one student by id does not require scanning every record each time.',
  },
  {
    id: 'prog-a-1',
    skill: 'programming',
    topic: 'Debugging',
    difficulty: 'advanced',
    prompt: 'A function returns the right answer for 4 items but the wrong total for 5. What should you inspect first?',
    choices: [
      'The loop boundary and whether the last item is included',
      'The font used in the editor',
      'The computer brand',
      'Whether the file is named main',
    ],
    correctIndex: 0,
    explanation: 'Off-by-one errors often appear only when the collection grows. Check where the loop starts and stops.',
  },
  {
    id: 'web-b-1',
    skill: 'web',
    topic: 'Semantic HTML',
    difficulty: 'beginner',
    prompt: 'Why prefer a <button> element for a clickable action instead of a clickable <div>?',
    choices: [
      'A button is keyboard accessible and announced as an action',
      'A div is required for all links',
      'Buttons cannot be styled',
      'Divs automatically submit forms',
    ],
    correctIndex: 0,
    explanation: 'Native buttons work with keyboard, focus, and screen readers. A div needs extra code to match that behavior.',
  },
  {
    id: 'web-b-2',
    skill: 'web',
    topic: 'CSS layout',
    difficulty: 'beginner',
    prompt: 'What does Flexbox help you do?',
    choices: [
      'Lay out items along a row or column and control their spacing',
      'Replace the HTML file with a database',
      'Encrypt passwords in the browser',
      'Compile TypeScript',
    ],
    correctIndex: 0,
    explanation: 'Flexbox arranges items in one direction and gives you alignment, wrapping, and spacing tools.',
  },
  {
    id: 'web-i-1',
    skill: 'web',
    topic: 'JavaScript',
    difficulty: 'intermediate',
    prompt: 'What does fetch() return before the response arrives?',
    choices: ['A Promise', 'The finished HTML page', 'A CSS file', 'The user password'],
    correctIndex: 0,
    explanation: 'fetch starts the request and returns a Promise that resolves when the response can be read.',
  },
  {
    id: 'web-i-2',
    skill: 'web',
    topic: 'Accessibility',
    difficulty: 'intermediate',
    prompt: 'What is the main purpose of alt text on an informative image?',
    choices: [
      'To describe the image for people who cannot see it',
      'To hide the image from search engines',
      'To set the image width',
      'To store the image in a cookie',
    ],
    correctIndex: 0,
    explanation: 'Alt text is the accessible name and description of an image. Decorative images can use an empty alt.',
  },
  {
    id: 'web-a-1',
    skill: 'web',
    topic: 'React',
    difficulty: 'advanced',
    prompt: 'In React, why should you avoid changing state directly and call the state setter instead?',
    choices: [
      'So React notices the change and can re-render',
      'Because objects cannot be stored in memory',
      'Because setters delete the component',
      'So CSS stops applying',
    ],
    correctIndex: 0,
    explanation: 'React re-renders when you update state through its setter. Mutating an object in place can skip that update.',
  },
  {
    id: 'ai-b-1',
    skill: 'ai',
    topic: 'Models',
    difficulty: 'beginner',
    prompt: 'Which description best fits a machine-learning model?',
    choices: [
      'A program that learned patterns from examples and uses them on new inputs',
      'A folder of handwritten notes',
      'A guarantee that every answer is true',
      'A replacement for all testing',
    ],
    correctIndex: 0,
    explanation: 'A model captures patterns from data. It can be useful and still be wrong, so people still check its output.',
  },
  {
    id: 'ai-b-2',
    skill: 'ai',
    topic: 'Training and inference',
    difficulty: 'beginner',
    prompt: 'What is inference?',
    choices: [
      'Using a trained model to make a prediction on new input',
      'Deleting the training data',
      'Writing only CSS',
      'Printing the model as a poster',
    ],
    correctIndex: 0,
    explanation: 'Training updates the model from examples. Inference is the later step: asking the trained model for an output.',
  },
  {
    id: 'ai-i-1',
    skill: 'ai',
    topic: 'Limits',
    difficulty: 'intermediate',
    prompt: 'A chatbot states a confident fact that is not in its sources. What is the careful response?',
    choices: [
      'Treat it as unverified and check a reliable source',
      'Accept it because the wording sounds fluent',
      'Assume longer answers are always true',
      'Ignore the question topic entirely',
    ],
    correctIndex: 0,
    explanation: 'Fluent text is not evidence. Models can hallucinate, so important claims need an independent check.',
  },
  {
    id: 'ai-i-2',
    skill: 'ai',
    topic: 'Supervised learning',
    difficulty: 'intermediate',
    prompt: 'What does supervised learning require?',
    choices: [
      'Examples paired with labels or target answers',
      'No data of any kind',
      'Only unlabeled photos and no goal',
      'A printed textbook and nothing else',
    ],
    correctIndex: 0,
    explanation: 'Supervised learning uses input-output pairs, such as an email and the label spam or not spam.',
  },
  {
    id: 'ai-a-1',
    skill: 'ai',
    topic: 'Overfitting',
    difficulty: 'advanced',
    prompt: 'A model scores perfectly on training examples and poorly on new examples. What is the likely problem?',
    choices: [
      'Overfitting: it memorized the training set',
      'The new examples use the same alphabet',
      'The screen brightness is too high',
      'It was never shown any examples',
    ],
    correctIndex: 0,
    explanation: 'Overfitting means the model fits the training data too tightly, including noise, and fails to generalize.',
  },
  {
    id: 'data-b-1',
    skill: 'data',
    topic: 'Tables',
    difficulty: 'beginner',
    prompt: 'In a tidy data table, what does one row usually represent?',
    choices: [
      'One observation, such as one student or one order',
      'The title of the chart',
      'The color palette',
      'A programming language',
    ],
    correctIndex: 0,
    explanation: 'Each row is one record. Columns hold the attributes of that record, such as name or score.',
  },
  {
    id: 'data-b-2',
    skill: 'data',
    topic: 'Averages',
    difficulty: 'beginner',
    prompt: 'A class has scores 70, 72, 74, and 100. Why might the median describe the typical student better than the mean?',
    choices: [
      'The 100 pulls the mean up, while the median stays with the middle scores',
      'The median always equals 100',
      'The mean cannot be calculated from numbers',
      'The median ignores the middle values',
    ],
    correctIndex: 0,
    explanation: 'A single high value shifts the mean. The median resists that outlier and stays near the center of the group.',
  },
  {
    id: 'data-i-1',
    skill: 'data',
    topic: 'Correlation',
    difficulty: 'intermediate',
    prompt: 'Ice-cream sales and swimming both rise in summer. What is a sound conclusion?',
    choices: [
      'The two move together, but that alone does not prove one causes the other',
      'Ice cream causes swimming',
      'Swimming causes warm weather',
      'Correlation always proves cause',
    ],
    correctIndex: 0,
    explanation: 'A shared cause, such as hot weather, can move both numbers. Correlation is not causation.',
  },
  {
    id: 'data-i-2',
    skill: 'data',
    topic: 'Validation',
    difficulty: 'intermediate',
    prompt: 'Why keep a test set separate from the data used to build a model?',
    choices: [
      'To estimate how the model does on examples it did not learn from',
      'To make the training file larger',
      'To delete outliers from the charts',
      'To avoid writing any code',
    ],
    correctIndex: 0,
    explanation: 'A held-out test set checks generalization. Scoring only the training data can hide overfitting.',
  },
  {
    id: 'data-a-1',
    skill: 'data',
    topic: 'Missing data',
    difficulty: 'advanced',
    prompt: 'Half of the survey responses are blank for income, mostly from one age group. What is the risk of dropping every blank row?',
    choices: [
      'The remaining data can misrepresent that age group',
      'The average will always become more fair',
      'Blank cells improve every chart',
      'Missing values prove the survey was perfect',
    ],
    correctIndex: 0,
    explanation: 'If missingness is uneven, deleting those rows changes who is represented. Look at why the values are missing first.',
  },
  {
    id: 'design-b-1',
    skill: 'design',
    topic: 'Hierarchy',
    difficulty: 'beginner',
    prompt: 'What is visual hierarchy for?',
    choices: [
      'Helping people see what to read or do first',
      'Making every element the same size and color',
      'Hiding the main action',
      'Replacing the written content',
    ],
    correctIndex: 0,
    explanation: 'Size, contrast, and placement guide attention so the important action or message is obvious.',
  },
  {
    id: 'design-b-2',
    skill: 'design',
    topic: 'Contrast',
    difficulty: 'beginner',
    prompt: 'Why is low-contrast gray text on a gray button a problem?',
    choices: [
      'Many people will struggle to read it',
      'It makes the page load faster',
      'It is required for accessibility',
      'It improves keyboard focus',
    ],
    correctIndex: 0,
    explanation: 'Text needs enough contrast against its background. Low contrast fails people with low vision and in bright light.',
  },
  {
    id: 'design-i-1',
    skill: 'design',
    topic: 'Consistency',
    difficulty: 'intermediate',
    prompt: 'Which choice follows a consistent interface?',
    choices: [
      'Primary actions share one button style across the product',
      'Every page invents a new color for Save',
      'Icons change meaning on each screen',
      'Error text uses a random font each time',
    ],
    correctIndex: 0,
    explanation: 'Consistency lets people reuse what they learned. One primary button style is easier to trust than a new pattern each page.',
  },
  {
    id: 'design-a-1',
    skill: 'design',
    topic: 'Feedback',
    difficulty: 'advanced',
    prompt: 'A form takes several seconds to submit and shows no change. What should the interface do?',
    choices: [
      'Show a pending state and then a success or error result',
      'Disable the whole browser',
      'Clear the answers immediately with no message',
      'Navigate away before the request finishes',
    ],
    correctIndex: 0,
    explanation: 'People need feedback that the system received the action and whether it worked. Silence looks like a failure.',
  },
  {
    id: 'biz-b-1',
    skill: 'business',
    topic: 'Problems',
    difficulty: 'beginner',
    prompt: 'What should a student founder understand before building a feature?',
    choices: [
      'Who has the problem and why it matters to them',
      'Only the logo color',
      'How to avoid talking to any user',
      'The longest possible feature list',
    ],
    correctIndex: 0,
    explanation: 'A feature is a bet that it solves a real problem for a specific person. The problem comes before the build.',
  },
  {
    id: 'biz-b-2',
    skill: 'business',
    topic: 'MVP',
    difficulty: 'beginner',
    prompt: 'What is a minimum viable product?',
    choices: [
      'The smallest version that lets you learn whether people want the idea',
      'A finished product with every idea included',
      'A business plan with no user contact',
      'A name and nothing else',
    ],
    correctIndex: 0,
    explanation: 'An MVP is for learning. It is small on purpose so you can test the riskiest assumption quickly.',
  },
  {
    id: 'biz-i-1',
    skill: 'business',
    topic: 'Metrics',
    difficulty: 'intermediate',
    prompt: 'Which metric tells you whether new users come back, not only whether they signed up?',
    choices: ['Retention', 'A logo download count', 'The number of fonts installed', 'Office temperature'],
    correctIndex: 0,
    explanation: 'Retention tracks return use. Signups alone cannot tell you if the product stayed useful.',
  },
  {
    id: 'biz-a-1',
    skill: 'business',
    topic: 'Tradeoffs',
    difficulty: 'advanced',
    prompt: 'A team can add five features or fix the signup drop-off. Half of visitors leave at signup. What is the stronger first move?',
    choices: [
      'Study and fix the signup drop-off before adding more features',
      'Add all five features and ignore the drop-off',
      'Change the company name only',
      'Remove the ability to sign up',
    ],
    correctIndex: 0,
    explanation: 'If people cannot get in, new features do not reach them. The bottleneck is the higher-leverage problem.',
  },
  {
    id: 'comm-b-1',
    skill: 'communication',
    topic: 'Structure',
    difficulty: 'beginner',
    prompt: 'How should you open a short project update?',
    choices: [
      'Lead with the result, then add the context people need',
      'Start with every detail you collected',
      'Avoid saying what you want the listener to do',
      'Use only abbreviations',
    ],
    correctIndex: 0,
    explanation: 'Busy readers need the point first. Context and details come after they know why the message matters.',
  },
  {
    id: 'comm-b-2',
    skill: 'communication',
    topic: 'Audience',
    difficulty: 'beginner',
    prompt: 'You are explaining an app to a new student user. What should you cut?',
    choices: [
      'Internal code names that the student does not need',
      'The one action you want them to take',
      'A plain example',
      'The name of the screen they will see',
    ],
    correctIndex: 0,
    explanation: 'Match the explanation to the audience. Implementation nicknames add noise for a first-time user.',
  },
  {
    id: 'comm-i-1',
    skill: 'communication',
    topic: 'Examples',
    difficulty: 'intermediate',
    prompt: 'Which explanation of a variable is clearer for a beginner?',
    choices: [
      'A variable is a labeled box that holds a value, like score = 12',
      'A variable is an abstract binding in an environment frame',
      'A variable is obvious and needs no example',
      'A variable is the same thing as a database server',
    ],
    correctIndex: 0,
    explanation: 'A concrete example gives the beginner something to picture. Jargon can wait until the idea is solid.',
  },
  {
    id: 'comm-a-1',
    skill: 'communication',
    topic: 'Feedback',
    difficulty: 'advanced',
    prompt: 'What makes feedback easier to use?',
    choices: [
      'It names the specific behavior and the change you are asking for',
      'It judges the person instead of the work',
      'It lists only “good job” or “bad”',
      'It arrives with no example',
    ],
    correctIndex: 0,
    explanation: 'Specific, behavior-based feedback tells the other person what to repeat or change. Vague praise or blame does not.',
  },
]

export const QUESTIONS: BankQuestion[] = [...BASE_QUESTIONS, ...EXTRA_QUESTIONS]

const BASE_CARDS: BankCard[] = [
  {
    id: 'card-prog-1',
    skill: 'programming',
    topic: 'Functions',
    front: 'What problem does a function solve?',
    back: 'It names a reusable piece of behavior so you do not copy the same steps, and you can test that piece on its own.',
  },
  {
    id: 'card-prog-2',
    skill: 'programming',
    topic: 'Debugging',
    front: 'What is an off-by-one error?',
    back: 'A loop or slice that stops one item too early or continues one item too far. Check the start and end of the range.',
  },
  {
    id: 'card-prog-3',
    skill: 'programming',
    topic: 'Data structures',
    front: 'When is a map more helpful than a list?',
    back: 'When you need to find a value by a key, such as a user id, instead of scanning every item.',
  },
  {
    id: 'card-web-1',
    skill: 'web',
    topic: 'Semantic HTML',
    front: 'Why use <main> and <button> instead of generic divs?',
    back: 'They communicate meaning to browsers and assistive tech, and buttons get keyboard behavior for free.',
  },
  {
    id: 'card-web-2',
    skill: 'web',
    topic: 'CSS layout',
    front: 'When would you reach for Grid instead of Flexbox?',
    back: 'When the layout needs rows and columns together. Flexbox is strongest for one-direction alignment.',
  },
  {
    id: 'card-web-3',
    skill: 'web',
    topic: 'JavaScript',
    front: 'What does a Promise represent?',
    back: 'Work that will finish later with a value or an error, such as a network request started by fetch.',
  },
  {
    id: 'card-ai-1',
    skill: 'ai',
    topic: 'Training and inference',
    front: 'How is training different from inference?',
    back: 'Training updates the model using examples. Inference uses the trained model to produce an output for a new input.',
  },
  {
    id: 'card-ai-2',
    skill: 'ai',
    topic: 'Limits',
    front: 'What is a hallucination in a language model?',
    back: 'A confident statement that is not supported by the source or the facts. Fluency does not make it true.',
  },
  {
    id: 'card-ai-3',
    skill: 'ai',
    topic: 'Overfitting',
    front: 'What does overfitting look like?',
    back: 'Excellent results on the training examples and weak results on new examples because the model memorized noise.',
  },
  {
    id: 'card-data-1',
    skill: 'data',
    topic: 'Averages',
    front: 'When can the median be more honest than the mean?',
    back: 'When a few extreme values pull the mean away from the typical record. The median stays at the middle value.',
  },
  {
    id: 'card-data-2',
    skill: 'data',
    topic: 'Correlation',
    front: 'Does correlation prove that one thing causes another?',
    back: 'No. Two measures can move together because of a third factor, or by chance.',
  },
  {
    id: 'card-data-3',
    skill: 'data',
    topic: 'Validation',
    front: 'Why hold out a test set?',
    back: 'To see how a model performs on examples it was not trained on, which is a better check for generalization.',
  },
  {
    id: 'card-design-1',
    skill: 'design',
    topic: 'Hierarchy',
    front: 'What should visual hierarchy make obvious?',
    back: 'What to read first and what action matters most, using size, contrast, and placement.',
  },
  {
    id: 'card-design-2',
    skill: 'design',
    topic: 'Contrast',
    front: 'What fails when text contrast is too low?',
    back: 'Readability. People with low vision, or anyone in glare, may not be able to read the text.',
  },
  {
    id: 'card-design-3',
    skill: 'design',
    topic: 'Feedback',
    front: 'What feedback does a slow form need?',
    back: 'A pending state while the request runs, then a clear success or error message.',
  },
  {
    id: 'card-biz-1',
    skill: 'business',
    topic: 'Problems',
    front: 'What comes before a feature list?',
    back: 'A specific person, the problem they have, and evidence that the problem is worth solving.',
  },
  {
    id: 'card-biz-2',
    skill: 'business',
    topic: 'MVP',
    front: 'What is an MVP for?',
    back: 'Learning quickly whether the core idea is wanted, using the smallest version that can test that question.',
  },
  {
    id: 'card-biz-3',
    skill: 'business',
    topic: 'Metrics',
    front: 'Why is retention different from signups?',
    back: 'Signups count arrivals. Retention counts whether people come back and get value.',
  },
  {
    id: 'card-comm-1',
    skill: 'communication',
    topic: 'Structure',
    front: 'How should a short update be ordered?',
    back: 'Result first, then the context and details a reader needs to act.',
  },
  {
    id: 'card-comm-2',
    skill: 'communication',
    topic: 'Examples',
    front: 'Why add a concrete example when teaching?',
    back: 'It turns an abstract definition into something a beginner can picture and reuse.',
  },
  {
    id: 'card-comm-3',
    skill: 'communication',
    topic: 'Feedback',
    front: 'What does useful feedback include?',
    back: 'The specific behavior you observed and the change you are asking for.',
  },
]

export const FLASHCARDS: BankCard[] = [...BASE_CARDS, ...EXTRA_CARDS]

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function byDifficulty<T extends { difficulty?: Difficulty }>(items: T[], difficulty: Difficulty, rng: () => number): T[] {
  const exact = shuffle(
    items.filter((item) => (item.difficulty ?? 'beginner') === difficulty),
    rng,
  )
  const nearby = shuffle(
    items.filter((item) => (item.difficulty ?? 'beginner') !== difficulty),
    rng,
  )
  return [...exact, ...nearby]
}

export function selectQuestions(
  skill: SkillId,
  difficulty: Difficulty,
  count: number,
  rng: () => number = Math.random,
  topic?: string,
): BankQuestion[] {
  const sameSkill = QUESTIONS.filter((question) => question.skill === skill)
  if (!topic) return byDifficulty(sameSkill, difficulty, rng).slice(0, count)
  const exactTopic = sameSkill.filter((question) => question.topic === topic)
  const filler = sameSkill.filter((question) => question.topic !== topic)
  return [...byDifficulty(exactTopic, difficulty, rng), ...byDifficulty(filler, difficulty, rng)].slice(0, count)
}

export function selectFlashcards(skill: SkillId, count: number, topic?: string, difficulty?: Difficulty): BankCard[] {
  const sameSkill = FLASHCARDS.filter((card) => card.skill === skill)
  const topicFirst = topic
    ? [...sameSkill.filter((card) => card.topic === topic), ...sameSkill.filter((card) => card.topic !== topic)]
    : sameSkill
  const ordered = difficulty
    ? [
        ...topicFirst.filter((card) => (card.difficulty ?? 'beginner') === difficulty),
        ...topicFirst.filter((card) => (card.difficulty ?? 'beginner') !== difficulty),
      ]
    : topicFirst
  return ordered.slice(0, count)
}

export function questionById(id: string): BankQuestion | undefined {
  return QUESTIONS.find((question) => question.id === id)
}
