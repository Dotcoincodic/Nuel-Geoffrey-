import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

// Call with the <img> element to launch and a function to run when it lands in the cart.
export function flyToCart(el, onLand) {
  const r = el?.getBoundingClientRect()
  if (!r) return onLand?.()
  window.dispatchEvent(new CustomEvent('fly-to-cart', { detail: { src: el.src, rect: { left: r.left, top: r.top, width: r.width, height: r.height }, onLand } }))
}

export function FlyLayer() {
  const [flights, setFlights] = useState([])
  useEffect(() => {
    const h = (e) => setFlights((f) => [...f, { id: Math.random(), ...e.detail }])
    window.addEventListener('fly-to-cart', h)
    return () => window.removeEventListener('fly-to-cart', h)
  }, [])
  const land = (f) => {
    f.onLand?.()
    window.dispatchEvent(new Event('cart-landed'))
    setFlights((x) => x.filter((y) => y.id !== f.id))
  }
  return flights.map((f) => {
    const t = ['cart-btn', 'mobile-cart-btn']
      .map((id) => document.getElementById(id)?.getBoundingClientRect())
      .find((r) => r?.width && r?.height)
    const tx = t ? t.left + t.width / 2 - (f.rect.left + f.rect.width / 2) : 0
    const ty = t ? t.top + t.height / 2 - (f.rect.top + f.rect.height / 2) : 0
    return (
      <motion.img
        key={f.id} src={f.src} alt="" aria-hidden="true"
        style={{ position: 'fixed', left: f.rect.left, top: f.rect.top, width: f.rect.width, height: f.rect.height, zIndex: 70, objectFit: 'cover', borderRadius: 12, pointerEvents: 'none' }}
        initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
        animate={{ x: [0, tx * 0.55, tx], y: [0, -120, ty], scale: [1, 0.5, 0.06], rotate: [0, -8, 14], opacity: [1, 1, 0.9] }}
        transition={{ duration: 0.95, times: [0, 0.45, 1], ease: 'easeIn' }}
        onAnimationComplete={() => land(f)}
      />
    )
  })
}
