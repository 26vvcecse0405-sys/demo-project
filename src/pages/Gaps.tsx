import { SKILL_LABEL } from '@shared/types'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AssessArt } from '@/components/art'
import { SkillRadar } from '@/components/Charts'
import { PageHeader, SourceNote, usePageTitle } from '@/components/ui'
import { useLearning } from '@/context/LearningContext'
import { recommendResources } from '@shared/learning'
import { requestRecommendations } from '@/services/api'
import type { Resource, SkillId } from '@shared/types'

export function Gaps() {
  const { data, view } = useLearning()
  const local = data.profile ? recommendResources(view.snapshots) : []
  const [remote, setRemote] = useState<{ source: string; notice?: string; resources: Array<Resource & { skill: SkillId }> } | null>(null)
  usePageTitle('Skill Gap Analysis')

  useEffect(() => {
    if (!data.profile) return
    let cancelled = false
    requestRecommendations(data.profile, view.snapshots).then((result) => {
      if (!cancelled) setRemote(result)
    })
    return () => { cancelled = true }
  }, [data.profile, view.snapshots])

  const resources = remote?.resources ?? local.map((item) => ({ ...item.resource, skill: item.skill }))

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <PageHeader kicker="Skill gaps" title="Where the evidence points" text="Assessment proficiency is an estimate, not a judgment of your ability. The latest attempt counts for 70 percent and earlier attempts share the other 30. Targets are 85 for skills tied to your interests or goal, and 70 otherwise." />
      <section className="grid-2">
        <article className="card card-pad" style={{ display: 'grid', gap: 8 }}>
          <AssessArt />
          {view.snapshots.length ? <SkillRadar rows={view.snapshots.map((snapshot) => ({ skill: snapshot.skill, current: snapshot.proficiency, target: snapshot.target }))} /> : <p>Add interests during onboarding to see a chart.</p>}
        </article>
        <article className="card card-pad" style={{ display: 'grid', gap: 12 }}>
          {view.ranked.map((snapshot) => (
            <div key={snapshot.skill}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong>{snapshot.label}</strong>
                <span className={snapshot.source === 'assessment' ? 'badge' : 'badge badge-muted'}>{snapshot.source === 'assessment' ? 'Assessed' : snapshot.source === 'self-report' ? 'Self-reported' : 'Not assessed'}</span>
              </div>
              <p className="muted" style={{ margin: '0.2rem 0' }}>{snapshot.proficiency}% now · {snapshot.target}% target · gap {snapshot.gap}</p>
              <div className="meter"><span style={{ width: `${snapshot.proficiency}%` }} /></div>
              {snapshot.evidence ? <p className="field-help">Evidence: {snapshot.evidence.correct}/{snapshot.evidence.total} on a {snapshot.evidence.difficulty} check ({snapshot.evidence.scorePercent}%).</p> : null}
              {snapshot.note ? <p className="field-help">{snapshot.note}</p> : null}
            </div>
          ))}
        </article>
      </section>
      <section className="card card-pad" style={{ display: 'grid', gap: 10 }}>
        <h2 style={{ margin: 0 }}>Recommended resources</h2>
        <SourceNote source={remote?.source ?? 'fallback'} notice={remote?.notice ?? 'These come from the verified catalog. A link appears only when the URL is known.'} />
        {resources.map((resource) => (
          <article key={resource.id} className="banner">
            <strong>{resource.title}</strong>
            <p className="muted" style={{ margin: '0.2rem 0' }}>{SKILL_LABEL[resource.skill]} · {resource.type} · {resource.difficulty} · {resource.durationMin} min</p>
            <p style={{ margin: 0 }}>{resource.why}</p>
            {resource.verified && resource.url ? <a href={resource.url} target="_blank" rel="noreferrer">Open verified resource</a> : <span className="badge badge-muted">Suggested topic</span>}
          </article>
        ))}
        <Link to="/app/roadmap" className="btn btn-secondary">Practice these on your roadmap</Link>
      </section>
    </div>
  )
}
