import { createContext, useContext, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiMoon, FiSun } from 'react-icons/fi'

const Ctx = createContext({ theme: 'system', isDark: false, setTheme: () => {} })
const query = () => window.matchMedia('(prefers-color-scheme: dark)')
const resolve = (t) => t === 'dark' || (t === 'system' && query().matches)

// 'system' (the default) follows the device. Clicking the toggle stores an explicit light or dark choice.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system')
  const [isDark, setIsDark] = useState(() => resolve(theme))
  useEffect(() => {
    const apply = () => {
      const d = resolve(theme)
      document.documentElement.classList.toggle('dark', d)
      setIsDark(d)
    }
    apply()
    if (theme === 'system') localStorage.removeItem('theme')
    else localStorage.setItem('theme', theme)
    const mq = query()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
  return <Ctx.Provider value={{ theme, isDark, setTheme }}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)

// Shows the icon of the mode you will switch to: moon in light mode, sun in dark mode.
export function ThemeToggle({ className = '' }) {
  const { isDark, setTheme } = useTheme()
  const Icon = isDark ? FiSun : FiMoon
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-lg transition hover:border-primary dark:border-white/15 ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={isDark ? 'sun' : 'moon'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }} className="flex">
          <Icon />
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
