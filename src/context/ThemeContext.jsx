import { createContext, useContext, useEffect, useState } from 'react'

// 'light' | 'dark' | 'system'
const ThemeContext = createContext(null)

function getSystemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(mode) {
  const root = document.documentElement
  if (mode === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
  } else if (mode === 'light') {
    root.classList.add('light')
    root.classList.remove('dark')
  } else {
    // system
    root.classList.remove('dark', 'light')
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'system'
  })

  // Resolve whether screen is currently dark
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') return true
    if (saved === 'light') return false
    return getSystemDark()
  })

  useEffect(() => {
    applyTheme(theme)
    if (theme === 'dark') setIsDark(true)
    else if (theme === 'light') setIsDark(false)
    else setIsDark(getSystemDark())
    localStorage.setItem('theme', theme)
  }, [theme])

  // Listen to system changes when in 'system' mode
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => {
      if (theme === 'system') setIsDark(e.matches)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  function toggleTheme() {
    setTheme(prev => {
      if (prev === 'light') return 'dark'
      if (prev === 'dark') return 'light'
      // system → opposite of current system
      return getSystemDark() ? 'light' : 'dark'
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
