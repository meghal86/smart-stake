export type Theme = 'light' | 'dark' | 'system'

const THEME_KEY = 'aw_theme'

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  
  const stored = localStorage.getItem(THEME_KEY) as Theme
  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    return stored
  }
  
  return 'system'
}

export function setTheme(theme: Theme): void {
  if (typeof window === 'undefined') return
  
  localStorage.setItem(THEME_KEY, theme)
  applyTheme(theme)
}

export function nextTheme(current: Theme): Theme {
  const cycle: Theme[] = ['light', 'dark', 'system']
  const currentIndex = cycle.indexOf(current)
  return cycle[(currentIndex + 1) % cycle.length]
}

function applyTheme(theme: Theme): void {
  if (typeof window === 'undefined') return
  
  const root = document.documentElement
  
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
  
  root.setAttribute('data-theme', theme)
}