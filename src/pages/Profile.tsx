import { EDUCATION_LABEL, EDUCATION_LEVELS, LEARNING_STYLES, STYLE_LABEL, type EducationLevel, type LearningStyle } from '@shared/types'
import { profileSchema } from '@shared/schemas'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, PageHeader, usePageTitle } from '@/components/ui'
import { useLearning } from '@/context/LearningContext'
import { isSupabaseConfigured } from '@/lib/supabase'

export function Profile() {
  const { data, session, syncNote, updateProfile, logout, resetDemo } = useLearning()
  const navigate = useNavigate()
  const profile = data.profile
  const [name, setName] = useState(profile?.displayName ?? '')
  const [education, setEducation] = useState<EducationLevel>(profile?.educationLevel ?? 'college')
  const [goal, setGoal] = useState(profile?.careerGoal ?? '')
  const [hours, setHours] = useState(profile?.weeklyHours ?? 5)
  const [style, setStyle] = useState<LearningStyle>(profile?.learningStyle ?? 'practice')
  const [message, setMessage] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)
  usePageTitle('Profile and Settings')
  if (!profile) return null

  function save() {
    const parsed = profileSchema.pick({ displayName: true, educationLevel: true, careerGoal: true, weeklyHours: true, learningStyle: true }).safeParse({
      displayName: name,
      educationLevel: education,
      careerGoal: goal,
      weeklyHours: hours,
      learningStyle: style,
    })
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? 'Check the form.')
      return
    }
    updateProfile({ displayName: name.trim(), educationLevel: education, careerGoal: goal.trim(), weeklyHours: hours, learningStyle: style })
    setMessage('Profile saved. Regenerate the roadmap if your hours or goal changed.')
  }

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
      <PageHeader kicker="Profile" title={profile.displayName} text={session?.kind === 'supabase' ? session.email : 'This demo profile lives in your browser.'} />
      {syncNote ? <p className="banner">{syncNote}</p> : null}
      <form className="card card-pad" style={{ display: 'grid', gap: 12 }} onSubmit={(event) => { event.preventDefault(); save() }}>
        <label><span className="field-label">Display name</span><input className="input" value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label><span className="field-label">Education</span>
          <select className="input" value={education} onChange={(event) => setEducation(event.target.value as EducationLevel)}>
            {EDUCATION_LEVELS.map((level) => <option key={level} value={level}>{EDUCATION_LABEL[level]}</option>)}
          </select>
        </label>
        <label><span className="field-label">Career goal</span><input className="input" value={goal} onChange={(event) => setGoal(event.target.value)} /></label>
        <label><span className="field-label">{hours} hours each week</span><input className="input" type="range" min={1} max={20} value={hours} onChange={(event) => setHours(Number(event.target.value))} /></label>
        <label><span className="field-label">Learning style</span>
          <select className="input" value={style} onChange={(event) => setStyle(event.target.value as LearningStyle)}>
            {LEARNING_STYLES.map((item) => <option key={item} value={item}>{STYLE_LABEL[item]}</option>)}
          </select>
        </label>
        <p className="field-help">Interests: {profile.interests.join(', ') || 'none'}. Known skills: {profile.knownSkills.join(', ') || 'none listed'}.</p>
        {message ? <p className="banner banner-good">{message}</p> : null}
        <button className="btn btn-primary" type="submit">Save profile</button>
      </form>
      <section className="card card-pad" style={{ display: 'grid', gap: 8 }}>
        <h2 style={{ margin: 0 }}>Session</h2>
        <p className="muted" style={{ margin: 0 }}>{isSupabaseConfigured() ? 'Supabase keys are present. Signed-in progress syncs to your own rows.' : 'Supabase keys are not set. Demo data cannot reach another student.'}</p>
        <button type="button" className="btn btn-secondary" onClick={() => { void logout().then(() => navigate('/')) }}>Log out</button>
        {session?.kind === 'demo' ? <button type="button" className="btn btn-danger" onClick={() => setConfirm(true)}>Reset demo progress</button> : null}
      </section>
      <Dialog open={confirm} title="Reset this demo?" onClose={() => setConfirm(false)}>
        <p>This clears the sample or demo profile stored in this browser. It does not touch a Supabase account.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={() => setConfirm(false)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={() => { resetDemo(); navigate('/') }}>Reset</button>
        </div>
      </Dialog>
    </div>
  )
}
