import type { SkillId } from '@shared/types'
import { Bar, BarChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const SHORT: Record<SkillId, string> = {
  programming: 'Code',
  web: 'Web',
  ai: 'AI',
  data: 'Data',
  design: 'Design',
  business: 'Business',
  communication: 'Comms',
}

function tooltipStyle() {
  const dark = document.documentElement.classList.contains('dark')
  return {
    background: dark ? '#10192b' : '#ffffff',
    border: '1px solid rgba(128,148,180,0.3)',
    borderRadius: 12,
    color: dark ? '#e8eefc' : '#142033',
  }
}

export function ActivityChart({ data }: { data: { label: string; xp: number }[] }) {
  return (
    <div style={{ width: '100%', height: 220 }} aria-label="Weekly experience points">
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="label" stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} width={28} />
          <Tooltip cursor={{ fill: 'transparent' }} contentStyle={tooltipStyle()} />
          <Bar dataKey="xp" name="XP" fill="#6d93ff" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SkillRadar({ rows }: { rows: { skill: SkillId; current: number; target: number }[] }) {
  const data = rows.map((row) => ({ skill: SHORT[row.skill], current: row.current, target: row.target }))
  return (
    <div style={{ width: '100%', height: 280 }} aria-label="Skill proficiency compared with target">
      <ResponsiveContainer>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(154,176,214,0.35)" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: 'currentColor', fontSize: 12 }} />
          <Radar dataKey="target" name="Target" stroke="#b0a4ff" fill="#b0a4ff" fillOpacity={0.18} />
          <Radar dataKey="current" name="Current" stroke="#6d93ff" fill="#6d93ff" fillOpacity={0.45} />
          <Tooltip contentStyle={tooltipStyle()} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ScoreChart({ rows }: { rows: { label: string; score: number }[] }) {
  return (
    <div style={{ width: '100%', height: 200 }} aria-label="Quiz score history">
      <ResponsiveContainer>
        <BarChart data={rows}>
          <XAxis dataKey="label" stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} width={32} />
          <Tooltip contentStyle={tooltipStyle()} />
          <Bar dataKey="score" name="Score" fill="#7eefe2" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
