-- SkillSprint schema
-- Run this in the Supabase SQL editor, or with the Supabase CLI:
-- supabase db push
-- Then set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
-- Never put the service role key in frontend env files.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  education_level text not null,
  interests text[] not null default '{}',
  career_goal text not null,
  experience_level text not null,
  known_skills text[] not null default '{}',
  weekly_hours integer not null check (weekly_hours between 1 and 40),
  learning_style text not null,
  target_weeks integer not null check (target_weeks between 1 and 52),
  theme text not null default 'dark',
  workspace text not null default 'custom',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  target_weeks integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  skill text not null,
  difficulty text not null,
  source text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  prompt text not null,
  choices jsonb not null,
  correct_index integer not null check (correct_index between 0 and 3),
  explanation text not null,
  topic text not null,
  order_index integer not null
);

create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  skill text not null,
  difficulty text not null,
  score_percent integer not null check (score_percent between 0 and 100),
  correct_count integer not null,
  total_count integer not null,
  answers jsonb not null default '[]',
  source text not null,
  completed_at timestamptz not null default now()
);

create table if not exists public.skill_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  skill text not null,
  proficiency integer not null check (proficiency between 0 and 100),
  target_level integer not null check (target_level between 0 and 100),
  evidence text not null,
  updated_at timestamptz not null default now(),
  unique (user_id, skill)
);

create table if not exists public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  goal text not null,
  level text not null,
  gaps text[] not null default '{}',
  source text not null,
  budget_min integer not null,
  planned_min integer not null,
  generated_at timestamptz not null default now()
);

create table if not exists public.roadmap_modules (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmaps (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  module_key text not null,
  skill text not null,
  title text not null,
  summary text not null,
  checkpoint text not null,
  order_index integer not null
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.roadmap_modules (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_key text not null,
  title text not null,
  topics jsonb not null default '[]',
  objectives jsonb not null default '[]',
  resources jsonb not null default '[]',
  exercise text not null,
  duration_min integer not null,
  order_index integer not null
);

create table if not exists public.lesson_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  lesson_key text not null,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_key)
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  topic text not null,
  skill text not null,
  difficulty text not null,
  source text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  topic text not null,
  skill text not null,
  difficulty text not null,
  score_percent integer not null check (score_percent between 0 and 100),
  correct_count integer not null,
  total_count integer not null,
  wrong_topics text[] not null default '{}',
  source text not null,
  completed_at timestamptz not null default now()
);

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  topic text not null,
  cards jsonb not null default '[]',
  marks jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id text primary key,
  title text not null,
  description text not null
);

create table if not exists public.user_achievements (
  user_id uuid not null references public.profiles (id) on delete cascade,
  achievement_id text not null references public.achievements (id),
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table if not exists public.learning_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  activity_type text not null,
  label text not null,
  xp integer not null default 0,
  minutes integer not null default 0,
  activity_date date not null,
  ref text,
  created_at timestamptz not null default now()
);

create index if not exists assessment_attempts_user_idx on public.assessment_attempts (user_id, completed_at desc);
create index if not exists learning_activity_user_idx on public.learning_activity (user_id, activity_date);
create index if not exists lessons_module_idx on public.lessons (module_id, order_index);
create index if not exists roadmap_modules_roadmap_idx on public.roadmap_modules (roadmap_id, order_index);
create index if not exists skill_profiles_user_idx on public.skill_profiles (user_id, skill);

insert into public.achievements (id, title, description) values
  ('first-sprint', 'First Sprint', 'Complete your first lesson.'),
  ('quiz-champion', 'Quiz Champion', 'Score 80% or higher on a practice quiz.'),
  ('consistency-star', 'Consistency Star', 'Learn on 3 consecutive days.'),
  ('skill-builder', 'Skill Builder', 'Complete every lesson in a module.'),
  ('roadmap-explorer', 'Roadmap Explorer', 'Complete every lesson on your roadmap.')
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.learning_goals enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.skill_profiles enable row level security;
alter table public.roadmaps enable row level security;
alter table public.roadmap_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_completions enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.flashcards enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.learning_activity enable row level security;

create policy "own profile" on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "own learning goals" on public.learning_goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own assessments" on public.assessments for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own assessment questions" on public.assessment_questions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own assessment attempts" on public.assessment_attempts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own skill profiles" on public.skill_profiles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own roadmaps" on public.roadmaps for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own modules" on public.roadmap_modules for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own lessons" on public.lessons for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own completions" on public.lesson_completions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own quizzes" on public.quizzes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own quiz attempts" on public.quiz_attempts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own flashcards" on public.flashcards for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "read achievement catalog" on public.achievements for select
  to authenticated using (true);
create policy "own user achievements" on public.user_achievements for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own activity" on public.learning_activity for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke insert, update, delete on public.achievements from authenticated;
grant select on public.achievements to authenticated;
