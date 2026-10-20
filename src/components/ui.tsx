import { cva, type VariantProps } from 'class-variance-authority'
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const buttonStyles = cva('btn', {
  variants: {
    variant: {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost',
      danger: 'btn-danger',
    },
    size: {
      md: '',
      sm: 'btn-sm',
    },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
})

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles> & { full?: boolean }

export function Button({ variant, size, full, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonStyles({ variant, size }), full && 'btn-full', className)} {...props} />
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="font-display" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="currentColor" opacity="0.12" />
        <path d="M8 23 15 9.5c.4-.8 1.6-.8 2 0L24 23" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M17.5 18.2h8" stroke="var(--cyan)" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M22.6 15.4 26.2 18.2 22.6 21" fill="none" stroke="var(--cyan)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {compact ? <span className="sr-only">SkillSprint</span> : 'SkillSprint'}
    </span>
  )
}

export function PageHeader({ kicker, title, text }: { kicker?: string; title: string; text?: string }) {
  return (
    <header style={{ marginBottom: '1.25rem' }}>
      {kicker ? <p className="kicker">{kicker}</p> : null}
      <h1 style={{ margin: '0.15rem 0 0.35rem', fontSize: 'clamp(1.7rem, 3vw, 2.3rem)' }}>{title}</h1>
      {text ? <p className="muted" style={{ margin: 0, maxWidth: 680 }}>{text}</p> : null}
    </header>
  )
}

export function SourceNote({ source, notice }: { source?: string; notice?: string }) {
  if (!notice && !source) return null
  const live = source === 'ai'
  return <p className={live ? 'banner banner-good' : 'banner banner-warn'}>{notice ?? (live ? 'Generated with OpenAI.' : 'Built-in SkillSprint content. This was not produced by a live model.')}</p>
}

export function ProgressRing({ value, label, size = 132 }: { value: number; label: string; size?: number }) {
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const bounded = Math.max(0, Math.min(100, value))
  const offset = circumference - (bounded / 100) * circumference
  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 4 }}>
      <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={`${label}: ${bounded}%`}>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--line)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="56" textAnchor="middle" fill="currentColor" fontSize="22" fontFamily="Outfit, sans-serif">{bounded}%</text>
        <text x="60" y="74" textAnchor="middle" fill="var(--muted)" fontSize="9">{label}</text>
      </svg>
    </div>
  )
}

export function Dialog({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="dialog-back" onMouseDown={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <h2 id="dialog-title" style={{ marginTop: 0 }}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · SkillSprint`
  }, [title])
}

export function LoadingScreen({ label = 'Loading SkillSprint' }: { label?: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Logo />
        <p className="muted">{label}</p>
      </div>
    </div>
  )
}
