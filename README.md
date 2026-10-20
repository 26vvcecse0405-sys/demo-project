# SkillSprint

SkillSprint is a personalized learning companion. A student sets a goal and a weekly time budget, takes a skill check, and gets a roadmap ordered by the gaps in those answers. Lessons, quizzes, and flashcards update XP, streaks, and badges from saved activity.

The app runs without API keys. That path is demo mode and uses a built-in question bank and lesson catalog. It is labeled as built-in content. OpenAI is used only when `OPENAI_API_KEY` is set on the server. Supabase Auth is used only when the public project URL and anon key are set.

## Architecture

- **React + Vite + TypeScript** renders the product. Tailwind styles the interface. Recharts draws the activity, skill, and quiz charts.
- **Shared learning logic** in `shared/` scores assessments, blends attempts, ranks gaps, fits a roadmap to the time budget, and awards XP and badges. The model cannot mark lessons complete or grant XP.
- **Express** exposes `/api/assessment/generate`, `/api/assessment/evaluate`, `/api/roadmap/generate`, `/api/practice/quiz`, `/api/practice/flashcards`, and `/api/recommendations/generate`. Inputs and model JSON are checked with Zod. A bad model response falls back to the catalog.
- **Answer keys stay on the server** for generated sessions. The browser receives them only after an answer is submitted. If the API is offline, the browser uses the same built-in bank locally and says so.
- **Demo progress** is stored in `localStorage` under `skillsprint.demo.v1`. Supabase rows are written only for the signed-in user, with Row Level Security in `supabase/migrations/001_skillsprint.sql`.

Proficiency is an estimate: the latest assessment is 70% of the score and earlier attempts share the other 30%. A listed skill with no assessment stays a self-report at 30% and is ranked below assessed gaps. Targets are 85 for interest or career skills and 70 otherwise.

## Setup

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open http://localhost:5173. The web app runs on port 5173 and the API on port 8787.

```bash
npm test
npm run build
```

Copy `.env.example` to `.env` only when you have credentials. Do not commit `.env`.

| Variable | Where it is read | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Browser | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Browser | Supabase anon key. This is public; RLS limits rows to the signed-in user. |
| `OPENAI_API_KEY` | API server only | Enables live generation |
| `OPENAI_MODEL` | API server only | Defaults to `gpt-4o-mini` |
| `PORT` | API server only | Defaults to `8787` |

Never put the Supabase service role key in a `VITE_` variable.

### Supabase

1. Create a project.
2. Run `supabase/migrations/001_skillsprint.sql` in the SQL editor.
3. Under Authentication, enable email/password. Disable email confirmation if you want to register during a live demo.
4. Put the project URL and anon key in `.env`.

Demo data is not written to Supabase.

## Show it to judges

1. From the landing page, choose **Open the sample student**. This is Aanya Rao, a college student aiming to be an AI product engineer. Her web check is 60%, her AI check is 40%, and Python is only self-reported.
2. Open **Skill Gap Analysis**. AI ranks above web because the assessed gap is larger. Programming stays labeled self-reported.
3. Open **My Roadmap**. One lesson is already complete, which earned First Sprint. Mark the next lesson complete and watch XP increase by 25.
4. Open **Practice Zone**, generate a quiz, and score 80% or higher to unlock Quiz Champion. The set is labeled built-in unless OpenAI is configured.
5. Return to the **Dashboard**. The weekly chart, streak, and activity list use the saved dates. Aanya is on a 2-day streak; one more day of activity makes it 3 and unlocks Consistency Star.
6. Open **Achievements** to see which badges are still locked, and why.
7. **Profile and Settings** can reset the browser demo. That does not affect a Supabase account.

Start a new demo profile from registration if you want to walk through onboarding instead of the sample student.
