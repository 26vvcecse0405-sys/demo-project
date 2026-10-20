import { ArrowRight, Brain, Briefcase, CheckCircle2, Code2, Globe, LineChart, Megaphone, Moon, Sun } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AssessArt, HeroArt, PathArt, ProgressArt, QuizArt, StudyArt, TrophyArt } from '@/components/art'
import { useLearning } from '@/context/LearningContext'
import { Logo, usePageTitle } from '@/components/ui'

const features = [
  { art: AssessArt, title: 'Skill assessment', text: 'A short check scores the answers you give. Self-reported experience is context, not the result.' },
  { art: PathArt, title: 'A roadmap that fits', text: 'Modules are ordered from the gaps that matter for your goal, and the total time stays inside the hours you set.' },
  { art: QuizArt, title: 'Practice with reasons', text: 'Quizzes and flashcards explain the answer. Live sets come from the server only when a model is configured. Otherwise you get the built-in bank.' },
  { art: ProgressArt, title: 'Progress you earned', text: 'XP, streaks, and badges update only when a lesson, quiz, or assessment is actually saved.' },
]

export function Landing() {
  const { data, setTheme, enterSample } = useLearning()
  const navigate = useNavigate()
  usePageTitle('Your Skills. Your Goals. Your AI-Powered Future.')
  return (
    <div>
      <header className="site-nav">
        <Logo />
        <nav style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }} aria-label="Primary">
          <a href="#features" className="btn btn-ghost btn-sm">Features</a>
          <a href="#how" className="btn btn-ghost btn-sm">How it works</a>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTheme(data.theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
            {data.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Start</Link>
        </nav>
      </header>
      <main className="site-wrap">
        <section className="hero" style={{ position: 'relative' }}>
          <div className="particles" aria-hidden="true">
            {[[12, 18], [78, 8], [40, 70], [88, 62]].map(([left, top], index) => (
              <span key={left} style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${index * 0.8}s` }} />
            ))}
          </div>
          <div>
            <p className="kicker">SkillSprint</p>
            <h1 className="display">Your Skills. Your Goals. <span className="gradient-text">Your AI-Powered Future.</span></h1>
            <p className="muted" style={{ fontSize: '1.15rem', maxWidth: 540 }}>
              Discover your skill gaps, follow a personalized learning roadmap, and turn your career ambitions into measurable progress.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
              <Link to="/register" className="btn btn-primary" data-testid="start-journey">Start My Skill Journey <ArrowRight size={18} /></Link>
              <a href="#how" className="btn btn-secondary">Explore How It Works</a>
            </div>
            <button type="button" className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => { void enterSample().then(() => navigate('/app')) }}>
              Open the sample student
            </button>
            <ul style={{ display: 'grid', gap: 8, padding: 0, margin: '1.2rem 0 0', listStyle: 'none' }}>
              {['Scores come from answers, not a guessed level', 'Plans stay inside your weekly hours', 'Badges unlock only when the condition is met'].map((item) => (
                <li key={item} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><CheckCircle2 size={18} color="var(--good)" /> {item}</li>
              ))}
            </ul>
          </div>
          <div className="stage">
            <div className="stage-ring" aria-hidden="true" />
            <span className="float-chip float-a" aria-hidden="true">Assess</span>
            <span className="float-chip float-b" aria-hidden="true">Roadmap</span>
            <span className="float-chip float-c" aria-hidden="true">Practice</span>
            <HeroArt />
            <DashboardPreview />
          </div>
        </section>
        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">
            {['Artificial intelligence', 'Programming', 'Web', 'Data', 'Communication', 'Business', 'Quizzes', 'Flashcards', 'Roadmaps'].concat(['Artificial intelligence', 'Programming', 'Web', 'Data', 'Communication', 'Business', 'Quizzes', 'Flashcards', 'Roadmaps']).map((word, index) => (
              <span key={`${word}-${index}`}>{word}</span>
            ))}
          </div>
        </div>
        <section id="how" style={{ padding: '2rem 0 1rem' }}>
          <p className="kicker">How SkillSprint works</p>
          <h2 style={{ marginTop: 6 }}>Assess your skills, build your roadmap, then practice</h2>
          <div className="sprint-track">
            {[
              ['01', 'Assess Your Skills', 'Answer one question at a time. The score comes from those answers, not a guessed level.'],
              ['02', 'Build Your Roadmap', 'Gaps, your goal, and your weekly hours set the order. Lesson time is an estimate.'],
              ['03', 'Learn, Practice & Improve', 'Finish a lesson, try a quiz, and watch the dashboard move from saved activity.'],
            ].map(([index, title, text]) => (
              <article key={title} className="card card-pad glass sprint-step">
                <span className="sprint-index" aria-hidden="true">{index}</span>
                <h3>{title}</h3>
                <p className="muted" style={{ margin: 0 }}>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section style={{ padding: '0.5rem 0 1rem' }}>
          <p className="kicker">Skill domains</p>
          <h2 style={{ marginTop: 6 }}>Six paths, one sprint</h2>
          <div className="grid-3" style={{ marginTop: 16 }}>
            {[
              [Brain, 'Artificial intelligence', 'Models, limits, and a first practical check.', 'var(--accent-2)'],
              [Code2, 'Programming', 'Variables, functions, and debugging you can explain.', 'var(--accent)'],
              [Globe, 'Web development', 'Structure, layout, and an interface that responds.', 'var(--cyan)'],
              [LineChart, 'Data science', 'Tables, honest summaries, and one chart you can defend.', 'var(--magenta)'],
              [Megaphone, 'Communication', 'Lead with the result and teach with one example.', 'var(--accent-2)'],
              [Briefcase, 'Business', 'A real user, one test, and a metric that can change your mind.', 'var(--cyan)'],
            ].map(([Icon, title, text, tint]) => (
              <article key={title as string} className="card card-pad skill-tile">
                <span className="skill-mark" style={{ ['--tint' as string]: tint }}><Icon size={20} aria-hidden="true" /></span>
                <h3 style={{ margin: 0 }}>{title as string}</h3>
                <p className="muted" style={{ margin: 0 }}>{text as string}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="features" style={{ padding: '2rem 0' }}>
          <p className="kicker">What you can do</p>
          <h2 style={{ marginTop: 6 }}>From a skill check to the next hour of study</h2>
          <div className="grid-4" style={{ marginTop: 16 }}>
            {features.map((feature) => (
              <article key={feature.title} className="card card-pad">
                <feature.art />
                <h3 style={{ marginBottom: 6 }}>{feature.title}</h3>
                <p className="muted" style={{ margin: 0 }}>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section style={{ padding: '1rem 0 2rem' }}>
          <div className="grid-2">
            <article className="card card-pad" style={{ display: 'grid', gap: 8 }}>
              <StudyArt />
              <p className="kicker">Assessment preview</p>
              <h2 style={{ margin: 0 }}>One question. Four choices. A score you can explain.</h2>
              <p className="muted">Pick a skill and a difficulty. Explanations follow each answer, and the summary names the topics to practice next.</p>
              <Link to="/register" className="btn btn-secondary">Try an assessment</Link>
            </article>
            <article className="card card-pad" style={{ display: 'grid', gap: 8 }}>
              <PathArt />
              <p className="kicker">Sample roadmap · demo data</p>
              <h2 style={{ margin: 0 }}>A path that stays inside your hours</h2>
              <ol>
                <li>Models, data, and predictions</li>
                <li>Checking model output</li>
                <li>A checkpoint quiz before the next module</li>
              </ol>
              <button type="button" className="btn btn-secondary" onClick={() => { void enterSample().then(() => navigate('/app/roadmap')) }}>Open the sample roadmap</button>
            </article>
          </div>
        </section>
        <section style={{ padding: '0 0 2rem' }}>
          <div className="grid-2">
            <ProgressArt />
            <article>
              <p className="kicker">Progress and gamification</p>
              <h2>XP, streaks, and badges follow saved work</h2>
              <p className="muted">Finishing a lesson, passing a quiz, or submitting an assessment updates the dashboard immediately. Sample numbers are labeled sample data.</p>
              <TrophyArt />
            </article>
          </div>
        </section>
        <section className="card card-pad glow finale" style={{ display: 'grid', gap: 10, marginBottom: '2rem' }}>
          <h2 style={{ margin: 0 }}>Start with the goal you actually have time for</h2>
          <p className="muted" style={{ margin: 0 }}>Create an account when Supabase is configured, or walk the sample student without mixing that demo into a real profile.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary">Start My Skill Journey</Link>
            <Link to="/login" className="btn btn-secondary">Log in</Link>
          </div>
        </section>
      </main>
      <footer className="site-wrap" style={{ borderTop: '1px solid var(--line)', padding: '1.4rem 0 2rem', display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <Logo />
          <p className="muted" style={{ margin: '0.4rem 0 0', maxWidth: 420 }}>SkillSprint helps students assess, close skill gaps, practice, and track a plan they can finish.</p>
        </div>
        <nav style={{ display: 'flex', gap: 14, alignItems: 'center' }} aria-label="Footer">
          <a href="#features">Features</a>
          <Link to="/register">Start</Link>
          <Link to="/login">Log in</Link>
        </nav>
      </footer>
    </div>
  )
}

function DashboardPreview() {
  return (
    <div className="preview" aria-hidden="true">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <strong>Illustrative preview</strong>
        <span style={{ opacity: 0.7, fontSize: 13 }}>Not your data</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="mini">
          <div style={{ opacity: 0.7, fontSize: 13 }}>Roadmap</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28 }}>38%</div>
          <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.08)' }}><div style={{ width: '38%', height: '100%', borderRadius: 99, background: '#6d93ff' }} /></div>
        </div>
        <div className="mini">
          <div style={{ opacity: 0.7, fontSize: 13 }}>Next up</div>
          <div style={{ fontWeight: 700 }}>Checking model output</div>
          <div style={{ opacity: 0.75, fontSize: 14 }}>AI foundations · 45 min</div>
        </div>
      </div>
      <div className="mini" style={{ marginTop: 10 }}>
        {[['AI', '40%'], ['Web', '60%'], ['Code', 'not assessed']].map(([name, value]) => (
          <div key={name} style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <span>{name}</span>
            <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.08)' }}><div style={{ width: value.endsWith('%') ? value : '12%', height: '100%', borderRadius: 99, background: '#7eefe2' }} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}
