import type { ReactNode } from 'react'

function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <svg className="art" viewBox="0 0 320 210" role="img" aria-label={label}>
      <rect width="320" height="210" rx="28" fill="var(--elev-2)" />
      <circle cx="250" cy="42" r="46" fill="var(--accent)" opacity="0.16" />
      <circle cx="48" cy="168" r="34" fill="var(--cyan)" opacity="0.18" />
      {children}
    </svg>
  )
}

export function HeroArt() {
  return (
    <Frame label="An AI companion drawing a personal learning path for a student">
      <path d="M46 156c38-18 52-78 96-78s40 46 78 28 54-62 78-40" fill="none" stroke="var(--accent)" strokeWidth="3" strokeDasharray="6 8" />
      <circle cx="46" cy="156" r="8" fill="var(--cyan)" />
      <circle cx="142" cy="78" r="8" fill="var(--accent-2)" />
      <circle cx="220" cy="106" r="8" fill="var(--magenta)" />
      <circle cx="292" cy="66" r="8" fill="var(--accent)" />
      <rect x="62" y="96" width="92" height="70" rx="18" fill="var(--elev)" stroke="var(--cyan)" />
      <circle cx="96" cy="120" r="12" fill="var(--accent-2)" />
      <path d="M80 148c6 10 26 10 32 0" fill="none" stroke="var(--text)" strokeWidth="3" strokeLinecap="round" />
      <rect x="176" y="46" width="92" height="78" rx="16" fill="var(--elev)" stroke="var(--magenta)" />
      <path d="M192 70h58M192 88h40M192 106h48" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
    </Frame>
  )
}

export function StudyArt() {
  return (
    <Frame label="Three students collaborating around a laptop">
      <rect x="90" y="78" width="140" height="78" rx="12" fill="var(--elev)" stroke="var(--accent)" />
      <rect x="104" y="92" width="112" height="40" rx="6" fill="var(--accent)" opacity="0.25" />
      <circle cx="70" cy="70" r="16" fill="var(--accent-2)" />
      <circle cx="160" cy="52" r="16" fill="var(--cyan)" />
      <circle cx="248" cy="70" r="16" fill="var(--accent)" />
    </Frame>
  )
}

export function PathArt() {
  return (
    <Frame label="A winding path connecting four learning milestones">
      <path d="M48 150 C 100 150, 100 70, 160 70 S 220 150, 272 86" fill="none" stroke="var(--accent)" strokeWidth="4" />
      <circle cx="48" cy="150" r="10" fill="var(--good)" />
      <circle cx="160" cy="70" r="10" fill="var(--accent)" />
      <circle cx="214" cy="118" r="10" fill="var(--accent-2)" />
      <circle cx="272" cy="86" r="10" fill="var(--cyan)" />
    </Frame>
  )
}

export function QuizArt() {
  return (
    <Frame label="A quiz card with four answer choices">
      <rect x="70" y="40" width="180" height="130" rx="18" fill="var(--elev)" stroke="var(--accent)" />
      <rect x="88" y="58" width="110" height="10" rx="5" fill="var(--text)" />
      <rect x="88" y="84" width="144" height="14" rx="7" fill="var(--good)" opacity="0.85" />
      <rect x="88" y="106" width="144" height="14" rx="7" fill="var(--line)" />
      <rect x="88" y="128" width="144" height="14" rx="7" fill="var(--line)" />
    </Frame>
  )
}

export function AssessArt() {
  return (
    <Frame label="A skill check with a rising score">
      <rect x="64" y="120" width="28" height="40" rx="6" fill="var(--accent)" />
      <rect x="104" y="92" width="28" height="68" rx="6" fill="var(--accent-2)" />
      <rect x="144" y="64" width="28" height="96" rx="6" fill="var(--cyan)" />
      <path d="M196 120c18-8 28-28 48-46" fill="none" stroke="var(--good)" strokeWidth="4" strokeLinecap="round" />
    </Frame>
  )
}

export function ProgressArt() {
  return (
    <Frame label="A progress ring and a short activity chart">
      <circle cx="108" cy="108" r="42" fill="none" stroke="var(--line)" strokeWidth="12" />
      <circle cx="108" cy="108" r="42" fill="none" stroke="var(--accent)" strokeWidth="12" strokeDasharray="180 264" strokeLinecap="round" transform="rotate(-90 108 108)" />
      <rect x="180" y="120" width="18" height="36" rx="4" fill="var(--accent-2)" />
      <rect x="206" y="96" width="18" height="60" rx="4" fill="var(--cyan)" />
      <rect x="232" y="78" width="18" height="78" rx="4" fill="var(--accent)" />
    </Frame>
  )
}

export function AvatarArt({ label = 'Student portrait' }: { label?: string }) {
  return (
    <svg className="art art-avatar" viewBox="0 0 96 96" role="img" aria-label={label}>
      <rect width="96" height="96" rx="28" fill="var(--accent)" opacity="0.18" />
      <circle cx="48" cy="38" r="16" fill="var(--accent-2)" />
      <path d="M22 78c6-16 46-16 52 0" fill="var(--accent)" />
    </svg>
  )
}

export function TrophyArt() {
  return (
    <Frame label="A trophy for a completed milestone">
      <path d="M124 48h72v28a36 36 0 0 1-72 0V48z" fill="var(--accent-2)" />
      <path d="M124 58h-22a18 18 0 0 0 22 28M196 58h22a18 18 0 0 1-22 28" fill="none" stroke="var(--accent)" strokeWidth="6" />
      <rect x="146" y="128" width="28" height="18" rx="4" fill="var(--cyan)" />
      <rect x="132" y="146" width="56" height="10" rx="4" fill="var(--text)" />
    </Frame>
  )
}

export function FlashArt() {
  return (
    <Frame label="A flashcard turning from a question to an answer">
      <rect x="58" y="52" width="120" height="108" rx="16" fill="var(--elev)" stroke="var(--line)" transform="rotate(-8 118 106)" />
      <rect x="142" y="46" width="120" height="108" rx="16" fill="var(--elev)" stroke="var(--accent)" />
      <path d="M166 92h72M166 112h48" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
    </Frame>
  )
}

export function EmptyArt({ label }: { label: string }) {
  return (
    <Frame label={label}>
      <circle cx="160" cy="96" r="36" fill="none" stroke="var(--accent)" strokeWidth="4" />
      <path d="M146 96h28M160 82v28" stroke="var(--cyan)" strokeWidth="4" strokeLinecap="round" />
    </Frame>
  )
}

export function CompleteArt() {
  return (
    <Frame label="Assessment complete">
      <circle cx="160" cy="104" r="46" fill="var(--good)" opacity="0.2" />
      <path d="M138 106l14 14 32-36" fill="none" stroke="var(--good)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  )
}

const BADGE_MARK: Record<string, ReactNode> = {
  'first-sprint': <path d="M118 128l42-64 42 64h-24l-18 28-18-28z" fill="var(--accent)" />,
  'quiz-champion': <circle cx="160" cy="108" r="36" fill="var(--accent-2)" />,
  'consistency-star': <path d="M160 62l14 32 34 4-26 22 8 34-30-18-30 18 8-34-26-22 34-4z" fill="var(--cyan)" />,
  'skill-builder': <rect x="124" y="78" width="72" height="56" rx="12" fill="var(--accent)" />,
  'roadmap-explorer': <path d="M120 140c28-48 52-48 80 0" fill="none" stroke="var(--accent-2)" strokeWidth="8" strokeLinecap="round" />,
}

export function BadgeArt({ id, title }: { id: string; title: string }) {
  return <Frame label={`${title} badge`}>{BADGE_MARK[id] ?? <circle cx="160" cy="108" r="32" fill="var(--accent)" />}</Frame>
}
