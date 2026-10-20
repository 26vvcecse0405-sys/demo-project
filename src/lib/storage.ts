import type { AppData } from '@shared/types'

export const THEME_KEY = 'skillsprint.theme'
export const DEMO_SESSION_KEY = 'skillsprint.demo-session'
export const DEMO_DATA_KEY = 'skillsprint.demo.v1'

export function readTheme(): 'light' | 'dark' {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem(THEME_KEY, theme)
}

export function loadDemo(): AppData | null {
  try {
    const raw = localStorage.getItem(DEMO_DATA_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { version?: number; data?: AppData }
    if (parsed.version !== 1 || !parsed.data) return null
    return parsed.data
  } catch {
    return null
  }
}

export function saveDemo(data: AppData) {
  localStorage.setItem(DEMO_DATA_KEY, JSON.stringify({ version: 1, data }))
}

export function demoSessionActive() {
  return localStorage.getItem(DEMO_SESSION_KEY) === '1'
}

export function setDemoSession(active: boolean) {
  if (active) localStorage.setItem(DEMO_SESSION_KEY, '1')
  else localStorage.removeItem(DEMO_SESSION_KEY)
}
