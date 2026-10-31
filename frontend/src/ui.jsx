import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export const ease = [0.22, 1, 0.36, 1]
export const wrap = 'mx-auto w-full max-w-6xl px-5 sm:px-8'
export const btnPrimary = 'inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-ink transition hover:bg-primary-soft'
export const btnGhost = 'inline-flex items-center justify-center rounded-full border border-black/15 px-6 py-3 text-sm font-medium transition hover:border-primary dark:border-white/20'
export const fieldCls = 'w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20'
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })

// Price that shakes for 0.6s, then pauses so the loop repeats every 3 seconds.
export function ShakePrice({ children, className = '' }) {
  return (
    <motion.span className={`inline-block ${className}`} animate={{ x: [0, -4, 4, -3, 3, 0] }} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2.4 }}>
      {children}
    </motion.span>
  )
}

export function useMediaQuery(q) {
  const [m, setM] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const h = () => setM(mq.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [q])
  return m
}

export function PageShell({ title, intro, children }) {
  return (
    <div className={`${wrap} min-h-[70svh] pb-20 pt-28`}>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
      {intro && <p className="mt-3 max-w-xl text-neutral-600 dark:text-neutral-300">{intro}</p>}
      <div className="mt-10">{children}</div>
    </div>
  )
}
