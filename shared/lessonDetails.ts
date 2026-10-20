import type { SkillId } from './types'

export interface LessonCode {
  language: string
  code: string
  caption: string
}

export interface LessonCheck {
  prompt: string
  choices: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  explanation: string
}

export interface LessonExtra {
  overview: string
  steps: string[]
  example: string
  code?: LessonCode
  check: LessonCheck
  layout: 'code' | 'theory' | 'business' | 'communication'
}

const DETAILS: Record<string, LessonExtra> = {
  'prog-variables': {
    layout: 'code',
    overview: 'A variable is a named place to keep a value. A condition chooses which path runs.',
    steps: [
      'Give the value a name you can say out loud, such as score.',
      'Update that name when the situation changes instead of copying the number.',
      'Use if / else so only one message prints for a given score.',
    ],
    example: 'A score of 82 should print “merit”, not “pass” and “merit” together.',
    code: {
      language: 'Python',
      caption: 'One score, one decision, one printed result.',
      code: 'score = 82\nif score >= 85:\n    print("merit")\nelif score >= 50:\n    print("pass")\nelse:\n    print("retry")',
    },
    check: {
      prompt: 'What does the condition in that program decide?',
      choices: ['Which message prints for this score', 'The name of the file', 'How many students are in the class', 'The color of the terminal'],
      correctIndex: 0,
      explanation: 'The conditions choose one message. They do not change the file name or the class size.',
    },
  },
  'prog-functions': {
    layout: 'code',
    overview: 'A function names a repeated job. A dictionary stores a value under a key so you can find it again.',
    steps: [
      'Move the repeated steps into a function with a clear name.',
      'Pass the input in, and return the result instead of printing inside every step.',
      'Use a dictionary when you need to look something up by a key.',
    ],
    example: 'Counting words: “a a plan” becomes {"a": 2, "plan": 1}.',
    code: {
      language: 'Python',
      caption: 'The same function can count any sentence you pass in.',
      code: 'def word_count(text):\n    counts = {}\n    for word in text.split():\n        counts[word] = counts.get(word, 0) + 1\n    return counts',
    },
    check: {
      prompt: 'Why return the dictionary instead of printing it inside the function?',
      choices: ['The caller can test or reuse the result', 'Printing is the only way to store a value', 'A function may not use a dictionary', 'Return deletes the words'],
      correctIndex: 0,
      explanation: 'Returning the result lets another part of the program check it. Printing only shows it once.',
    },
  },
  'prog-debug': {
    layout: 'code',
    overview: 'Read the error from the last call backward, then lock the fix with an example that used to fail.',
    steps: [
      'Read the last line of the traceback first. That is where it broke.',
      'Check the boundary: does the loop stop one item too early?',
      'Write the failing example before you change the code.',
    ],
    example: 'range(len(items) - 1) skips the last item. range(len(items)) includes it.',
    code: {
      language: 'Python',
      caption: 'The second call is the example that used to fail.',
      code: 'def last_item(items):\n    return items[len(items) - 1]\n\nprint(last_item(["plan", "build", "ship"]))',
    },
    check: {
      prompt: 'What should you write before changing a buggy loop?',
      choices: ['An example that fails today', 'A new feature request', 'A longer variable name only', 'A comment that says “fixed”'],
      correctIndex: 0,
      explanation: 'A failing example tells you when the bug is actually gone. A comment cannot prove that.',
    },
  },
  'prog-cli': {
    layout: 'code',
    overview: 'A small tool is a few functions: read input, reject one bad case, and print a total.',
    steps: [
      'Split “read a line”, “add minutes”, and “print the total” into functions.',
      'If the minutes are not a number, say so and continue instead of crashing.',
      'Describe the tool in two sentences before you add another feature.',
    ],
    example: 'Input “python 25” adds 25 minutes. Input “python lots” prints a short error.',
    code: {
      language: 'Python',
      caption: 'One bad line should not erase the minutes already logged.',
      code: 'def add_minutes(total, raw):\n    try:\n        return total + int(raw)\n    except ValueError:\n        print("Enter a whole number of minutes.")\n        return total',
    },
    check: {
      prompt: 'What happens when raw is the word “lots”?',
      choices: ['The function prints a short error and keeps the old total', 'The program deletes every log', 'The word is stored as 25', 'Python skips the function'],
      correctIndex: 0,
      explanation: 'int("lots") raises ValueError. The except branch explains the problem and returns the total unchanged.',
    },
  },
  'web-html': {
    layout: 'code',
    overview: 'HTML describes what each part of the page is. Headings stay in order, and a button is for an action.',
    steps: [
      'Use one h1, then h2 for sections. Do not skip levels to make text bigger.',
      'Use a button for “Save” and a link for “Open the next lesson”.',
      'Write alt text that says what an informative image shows.',
    ],
    example: 'A profile page: header with the name, main with the goal, and a button to start the sprint.',
    code: {
      language: 'HTML',
      caption: 'The button is an action. The heading is not a control.',
      code: '<header>\n  <h1>Aanya Rao</h1>\n</header>\n<main>\n  <h2>Goal</h2>\n  <p>AI Product Engineer</p>\n  <button type="button">Start my sprint</button>\n</main>',
    },
    check: {
      prompt: 'Which element should start the learning sprint?',
      choices: ['A button', 'An h1 styled to look clickable', 'A paragraph', 'An image with no text'],
      correctIndex: 0,
      explanation: 'A button is the control for an on-page action. A heading describes a section.',
    },
  },
  'web-layout': {
    layout: 'code',
    overview: 'Flexbox lines actions up. A narrow screen stacks them so the page stays readable.',
    steps: [
      'Put the actions in a row with a gap.',
      'Allow the row to wrap, or switch to a column under about 700 pixels.',
      'Check that body text stays readable against the background.',
    ],
    example: 'Desktop: name on the left, actions on the right. Phone: name, then each action on its own line.',
    code: {
      language: 'CSS',
      caption: 'The wrap keeps buttons on screen when the card gets narrow.',
      code: '.actions {\n  display: flex;\n  gap: 10px;\n  flex-wrap: wrap;\n}',
    },
    check: {
      prompt: 'What does flex-wrap: wrap do here?',
      choices: ['Moves extra buttons onto the next line', 'Hides the buttons', 'Makes the text the same color as the background', 'Deletes the gap'],
      correctIndex: 0,
      explanation: 'Wrap lets items flow to the next line instead of overflowing the card.',
    },
  },
  'web-dom': {
    layout: 'code',
    overview: 'Keep the selected topic in one value. The list on screen is derived from that value.',
    steps: [
      'Store the current filter in one place.',
      'Render the lessons that match that filter.',
      'Update the stored value from the click, and let the list follow.',
    ],
    example: 'Clicking “AI” shows AI lessons only. Clicking “All” shows every lesson again.',
    code: {
      language: 'JavaScript',
      caption: 'One variable drives the visible list.',
      code: 'let topic = "All"\nfunction visible(lessons) {\n  if (topic === "All") return lessons\n  return lessons.filter((lesson) => lesson.topic === topic)\n}',
    },
    check: {
      prompt: 'Why avoid copying the lesson titles into three click handlers?',
      choices: ['The list can get out of date in one handler and not the others', 'Browsers allow only one handler', 'A filter cannot read an array', 'Titles must live in CSS'],
      correctIndex: 0,
      explanation: 'One source of truth means every handler updates the same value and the screen stays consistent.',
    },
  },
  'web-react': {
    layout: 'code',
    overview: 'Split the tracker into small components. Props carry the lesson in. State carries what is complete.',
    steps: [
      'Make a LessonRow that receives a title and a done flag.',
      'Keep the completed ids in the parent.',
      'Show an empty line before the first lesson is done, and a count after.',
    ],
    example: 'Completing “Semantic structure” changes the label from 0/3 to 1/3 immediately.',
    code: {
      language: 'JavaScript',
      caption: 'The row does not own the data. It receives it.',
      code: 'function LessonRow({ title, done, onDone }) {\n  return (\n    <button onClick={onDone}>\n      {done ? "Done" : "Start"} · {title}\n    </button>\n  )\n}',
    },
    check: {
      prompt: 'Where should the “2 of 3 complete” label read from?',
      choices: ['The same completed list the rows update', 'A second copy typed into the heading', 'The CSS file', 'A comment in the component'],
      correctIndex: 0,
      explanation: 'The label and the rows should share one list, so completing a lesson updates both.',
    },
  },
  'ai-models': {
    layout: 'theory',
    overview: 'A model learns patterns from examples. Training is the learning step. Inference is using the model on a new case.',
    steps: [
      'Name the examples the system learned from.',
      'Separate “it was trained” from “it is answering now”.',
      'State one thing the prediction cannot guarantee.',
    ],
    example: 'A spam filter trained on old mail can still miss a new kind of scam.',
    check: {
      prompt: 'Which sentence describes inference?',
      choices: ['The filter labels a new email', 'The team collects last year’s mail', 'The team chooses which messages were spam', 'The team deletes the model'],
      correctIndex: 0,
      explanation: 'Inference applies a trained model to a new input. Collecting and labeling mail are training preparation.',
    },
  },
  'ai-limits': {
    layout: 'theory',
    overview: 'A fluent answer can still be wrong. Ask what would confirm it before you treat it as a fact.',
    steps: [
      'Underline any claim that has no source.',
      'Ask the same question a second way and compare the specifics.',
      'Keep the claim you would still look up.',
    ],
    example: 'Two prompts about a study technique disagree on a number. The number is the claim to verify.',
    check: {
      prompt: 'Two prompts disagree. What is the careful next step?',
      choices: ['Check the disputed claim against a source', 'Trust the longer answer', 'Trust the answer that matches your guess', 'Average the two numbers and move on'],
      correctIndex: 0,
      explanation: 'Disagreement is a signal to verify. Length and preference are not evidence.',
    },
  },
  'ai-supervised': {
    layout: 'theory',
    overview: 'Supervised learning uses inputs and a known label. A test set is data the model did not train on.',
    steps: [
      'Point at the feature columns and the label column.',
      'Hold out a test set before you celebrate a score.',
      'Treat a perfect training score as a warning, not a trophy.',
    ],
    example: 'Hours studied and subject are features. “Focused or distracted” is the label.',
    check: {
      prompt: 'A model scores 100% on training data and 60% on the test set. What happened?',
      choices: ['It memorized the training examples and did not generalize', 'The test set is always wrong', 'The features were deleted', 'A perfect training score proves the model is ready'],
      correctIndex: 0,
      explanation: 'That gap is overfitting. The training score alone does not show the model works on new rows.',
    },
  },
  'ai-mini': {
    layout: 'theory',
    overview: 'Pick features you can explain, keep a test split, and write down one mistake.',
    steps: [
      'Choose three features a classmate could measure.',
      'Do not score the model on the same rows you trained on.',
      'Describe one wrong prediction in plain language.',
    ],
    example: 'The model called a late-night revision session “distracted” because most late sessions in the training set were.',
    check: {
      prompt: 'Which feature is fair to include?',
      choices: ['Subject, hours, and time of day', 'The student’s password', 'A random id with no meaning', 'The answer you want the model to give, copied into the inputs'],
      correctIndex: 0,
      explanation: 'Use inputs you can explain. The label must not be copied into the features, and secrets do not belong in the table.',
    },
  },
  'data-tables': {
    layout: 'theory',
    overview: 'A row is one observation. A column is one kind of fact. The question decides which column matters.',
    steps: [
      'Say what one row stands for, such as one study session.',
      'Pick the column that can answer the question.',
      'Notice numbers that were stored as text.',
    ],
    example: '“Which subject got the most minutes?” needs the subject column and the minutes column. It cannot tell you why the student was tired.',
    check: {
      prompt: 'A minutes column is stored as the text “25”. What is wrong with averaging it as text?',
      choices: ['Text is not a quantity until you convert it', 'Text averages are always more accurate', 'A table may not contain numbers', 'The row stops existing'],
      correctIndex: 0,
      explanation: 'Averaging text does not compute minutes. Convert the column to numbers first, and record anything that fails to convert.',
    },
  },
  'data-summary': {
    layout: 'theory',
    overview: 'Mean and median answer different questions. Missing rows should be counted before they are dropped.',
    steps: [
      'Look for an outlier before you choose mean or median.',
      'Count missing values and say whether you kept them.',
      'Write the caveat in the same sentence as the number.',
    ],
    example: 'Scores 70, 72, 74, and 100. The mean is pulled up by 100. The median stays near the cluster.',
    check: {
      prompt: 'One score is far above the others. Which summary is less pulled by that score?',
      choices: ['The median', 'The mean', 'The file name', 'The number of columns'],
      correctIndex: 0,
      explanation: 'The median is the middle value. A single extreme score moves the mean more than the median.',
    },
  },
  'biz-problem': {
    layout: 'business',
    overview: 'Name a specific person and the problem they have. The solution comes after the evidence, not before it.',
    steps: [
      'Write who the user is in one sentence.',
      'Write the problem without naming your favorite feature.',
      'List one fact you still need from a real student.',
    ],
    example: '“Second-year students cannot tell which skill to practice next” is a problem. “We should add AI” is a solution.',
    check: {
      prompt: 'Which line is a problem statement?',
      choices: ['Students cannot tell which skill to practice next', 'We should build a chatbot', 'The logo should be blue', 'We will use a new database'],
      correctIndex: 0,
      explanation: 'The first line describes the user’s difficulty. The others jump to a solution or a preference.',
    },
  },
  'biz-metrics': {
    layout: 'business',
    overview: 'Cut the plan to one test and one number that would change your mind.',
    steps: [
      'Keep the smallest version that tests the risky assumption.',
      'Pick completion or return visits, and define how you will count it.',
      'Write the feature you are leaving out this sprint.',
    ],
    example: 'MVP: a five-question skill check and a three-lesson plan. Continue if 4 of 10 classmates finish one lesson this week.',
    check: {
      prompt: 'What makes a metric useful for the MVP?',
      choices: ['It tells you whether to continue', 'It is the largest number you can find', 'It describes the logo', 'It cannot be measured until next year'],
      correctIndex: 0,
      explanation: 'A useful metric is measurable now and would change the decision. A vanity number does not.',
    },
  },
  'comm-structure': {
    layout: 'communication',
    overview: 'Start with the result. Add only the context the reader needs to act.',
    steps: [
      'Write the result in the first sentence.',
      'Cut terms the reader does not need.',
      'End with the action: decide, review, or wait.',
    ],
    example: '“The assessment is 60% on web, so the next lesson is semantic HTML. Please review the roadmap.”',
    check: {
      prompt: 'Where should the result go in a short update?',
      choices: ['In the first sentence', 'After every detail, at the end', 'Only in a footnote', 'It should be implied'],
      correctIndex: 0,
      explanation: 'Busy readers act on the opening. The result has to be there, not implied.',
    },
  },
  'comm-teach': {
    layout: 'communication',
    overview: 'Pair every definition with an example, then ask a question that requires using the idea.',
    steps: [
      'Define the term in one sentence.',
      'Give one example from the learner’s world.',
      'Ask them to apply it, and comment on the work rather than the person.',
    ],
    example: '“A variable stores a value. Your score variable stores 82. If the score changes, which line updates?”',
    check: {
      prompt: 'Which check shows the learner understood a variable?',
      choices: ['They update the right name when the score changes', 'They repeat the word “variable”', 'They say the lesson was easy', 'They copy the definition with no example'],
      correctIndex: 0,
      explanation: 'Using the idea on a new change shows understanding. Repeating the word does not.',
    },
  },
}

function layoutFor(skill: SkillId): LessonExtra['layout'] {
  if (skill === 'programming' || skill === 'web') return 'code'
  if (skill === 'business') return 'business'
  if (skill === 'communication') return 'communication'
  return 'theory'
}

export function lessonExtra(lesson: { id: string; title: string; objectives: string[]; exercise: string }, skill: SkillId): LessonExtra {
  const known = DETAILS[lesson.id]
  if (known) return known
  const first = lesson.objectives[0] ?? `Practice the idea in “${lesson.title}”.`
  return {
    layout: layoutFor(skill),
    overview: first,
    steps: lesson.objectives.length ? lesson.objectives : ['Read the overview.', 'Work the practice task.', 'Answer the check before you mark the lesson complete.'],
    example: lesson.exercise,
    check: {
      prompt: `Which outcome matches “${lesson.title}”?`,
      choices: [
        first,
        'Skip the exercise and memorize a slogan',
        'Treat a self-rating as the score',
        'Add a source link that was not verified',
      ],
      correctIndex: 0,
      explanation: 'The lesson is complete when you can do the objective. A slogan or an invented link does not count.',
    },
  }
}
