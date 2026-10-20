import { EDUCATION_LABEL, EDUCATION_LEVELS, EXPERIENCE_LEVELS, INTEREST_LABEL, INTERESTS, LEARNING_STYLES, STYLE_LABEL, type EducationLevel, type ExperienceLevel, type Interest, type LearningStyle } from '@shared/types'
import { profileSchema } from '@shared/schemas'
import { FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button, usePageTitle } from '@/components/ui'
import { useLearning } from '@/context/LearningContext'

const steps = ['About you', 'Direction', 'Experience', 'Time']

export function Onboarding() {
  const { session, data, saveProfile } = useLearning()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState(data.profile?.displayName ?? '')
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(data.profile?.educationLevel ?? 'college')
  const [interests, setInterests] = useState<Interest[]>(data.profile?.interests ?? [])
  const [careerGoal, setCareerGoal] = useState(data.profile?.careerGoal ?? '')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(data.profile?.experienceLevel ?? 'beginner')
  const [knownSkills, setKnownSkills] = useState<string[]>(data.profile?.knownSkills ?? [])
  const [skillDraft, setSkillDraft] = useState('')
  const [weeklyHours, setWeeklyHours] = useState(data.profile?.weeklyHours ?? 5)
  const [learningStyle, setLearningStyle] = useState<LearningStyle>(data.profile?.learningStyle ?? 'practice')
  const [targetWeeks, setTargetWeeks] = useState(data.profile?.targetWeeks ?? 6)
  usePageTitle('Onboarding')

  if (!session) return <Navigate to="/register" replace />
  if (data.profile) return <Navigate to="/app" replace />

  function toggleInterest(interest: Interest) {
    setInterests((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest])
  }

  function addSkill() {
    const next = skillDraft.trim()
    if (!next || knownSkills.includes(next)) return
    setKnownSkills((current) => [...current, next].slice(0, 20))
    setSkillDraft('')
  }

  function validate(index: number) {
    const draft = { displayName, educationLevel, interests, careerGoal, experienceLevel, knownSkills, weeklyHours, learningStyle, targetWeeks }
    const shape = [
      profileSchema.pick({ displayName: true, educationLevel: true }),
      profileSchema.pick({ interests: true, careerGoal: true }),
      profileSchema.pick({ experienceLevel: true, knownSkills: true }),
      profileSchema,
    ][index]
    const parsed = shape.safeParse(draft)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check this step.')
      return false
    }
    setError(null)
    return true
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate(step)) return
    if (step < 3) {
      setStep((value) => value + 1)
      return
    }
    saveProfile({ displayName, educationLevel, interests, careerGoal, experienceLevel, knownSkills, weeklyHours, learningStyle, targetWeeks })
    navigate('/app')
  }

  return (
    <main className="site-wrap" style={{ padding: '2rem 0 3rem', maxWidth: 760 }}>
      <p className="kicker">Step {step + 1} of 4 · {steps[step]}</p>
      <h1 style={{ marginTop: 6 }}>Build the profile your sprint will use</h1>
      <div className="meter" style={{ margin: '0.8rem 0 1rem' }}><span style={{ width: `${((step + 1) / 4) * 100}%` }} /></div>
      <form className="card card-pad" onSubmit={onSubmit} style={{ display: 'grid', gap: 14 }}>
        {step === 0 ? (
          <>
            <label>
              <span className="field-label">What should we call you?</span>
              <input className="input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoFocus />
            </label>
            <div>
              <span className="field-label">Education</span>
              <div className="chip-row">
                {EDUCATION_LEVELS.map((level) => (
                  <button type="button" key={level} className={educationLevel === level ? 'chip chip-active' : 'chip'} onClick={() => setEducationLevel(level)}>{EDUCATION_LABEL[level]}</button>
                ))}
              </div>
            </div>
          </>
        ) : null}
        {step === 1 ? (
          <>
            <div>
              <span className="field-label">Interests</span>
              <div className="chip-row">
                {INTERESTS.map((interest) => (
                  <button type="button" key={interest} className={interests.includes(interest) ? 'chip chip-active' : 'chip'} onClick={() => toggleInterest(interest)} aria-pressed={interests.includes(interest)}>{INTEREST_LABEL[interest]}</button>
                ))}
              </div>
            </div>
            <label>
              <span className="field-label">Career or learning goal</span>
              <input className="input" value={careerGoal} onChange={(event) => setCareerGoal(event.target.value)} placeholder="AI product engineer" />
            </label>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <p className="field-help">Your level here is context only. The assessment is what estimates proficiency.</p>
            <div className="chip-row">
              {EXPERIENCE_LEVELS.map((level) => (
                <button type="button" key={level} className={experienceLevel === level ? 'chip chip-active' : 'chip'} onClick={() => setExperienceLevel(level)}>{level}</button>
              ))}
            </div>
            <label>
              <span className="field-label">Skills you already use</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" value={skillDraft} onChange={(event) => setSkillDraft(event.target.value)} placeholder="Python" />
                <Button type="button" variant="secondary" onClick={addSkill}>Add</Button>
              </div>
            </label>
            <div className="chip-row">
              {knownSkills.map((skill) => (
                <button type="button" key={skill} className="chip chip-active" onClick={() => setKnownSkills((current) => current.filter((item) => item !== skill))}>{skill} ×</button>
              ))}
            </div>
          </>
        ) : null}
        {step === 3 ? (
          <>
            <label>
              <span className="field-label">{weeklyHours} hours each week</span>
              <input className="input" type="range" min={1} max={20} value={weeklyHours} onChange={(event) => setWeeklyHours(Number(event.target.value))} />
            </label>
            <div>
              <span className="field-label">Preferred learning style</span>
              <div className="chip-row">
                {LEARNING_STYLES.map((style) => (
                  <button type="button" key={style} className={learningStyle === style ? 'chip chip-active' : 'chip'} onClick={() => setLearningStyle(style)}>{STYLE_LABEL[style]}</button>
                ))}
              </div>
            </div>
            <label>
              <span className="field-label">{targetWeeks} week timeline</span>
              <input className="input" type="range" min={1} max={24} value={targetWeeks} onChange={(event) => setTargetWeeks(Number(event.target.value))} />
            </label>
          </>
        ) : null}
        {error ? <p className="field-error">{error}</p> : null}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <Button type="button" variant="ghost" onClick={() => { setError(null); setStep((value) => Math.max(0, value - 1)) }} disabled={step === 0}>Back</Button>
          <Button type="submit">{step === 3 ? 'Save and open dashboard' : 'Next'}</Button>
        </div>
      </form>
    </main>
  )
}
