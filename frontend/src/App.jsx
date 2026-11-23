import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiMenu, FiShoppingBag, FiX } from 'react-icons/fi'
import { FaFacebookF, FaInstagram, FaTwitter, FaWhatsapp } from 'react-icons/fa'
import { useStore } from './store'
import { ThemeToggle } from './theme'
import { CartDrawer, PaymentReturn } from './cart'
import { FlyLayer } from './fly'
import { Hero, Marquee, Gallery, Commissions, Music, About, Contact } from './Home'
import { VideosPage, BlogPage, PostPage, LegalPage } from './pages'
import Admin from './admin'
import { wrap } from './ui'
import logo from './image/logo.PNG'

const links = [
  ['Home', '#top'], ['Gallery', '#gallery'], ['Live videos', '#/videos'], ['Blog', '#/blog'],
  ['Commissions', '#commissions'], ['Music', '#music'], ['About', '#about'], ['Contact', '#contact'],
]

/* ---------- Responsive navigation: desktop links, mobile menu, theme, cart. ---------- */
function Nav({ onCart }) {
  const { settings, cart } = useStore()
  const [bump, setBump] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const socials = [
    [FaInstagram, 'Instagram', settings.instagram], [FaFacebookF, 'Facebook', settings.facebook],
    [FaWhatsapp, 'WhatsApp', settings.whatsapp], [FaTwitter, 'Twitter', settings.twitter],
  ].filter(([, , href]) => Boolean(href))
  useEffect(() => {
    const landed = () => setBump((b) => b + 1)
    const scroll = () => setScrolled(window.scrollY > 12)
    const escape = (e) => e.key === 'Escape' && setMenuOpen(false)
    scroll()
    window.addEventListener('cart-landed', landed)
    window.addEventListener('scroll', scroll, { passive: true })
    window.addEventListener('keydown', escape)
    return () => {
      window.removeEventListener('cart-landed', landed)
      window.removeEventListener('scroll', scroll)
      window.removeEventListener('keydown', escape)
    }
  }, [])
  const chip = 'flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-paper/60 text-lg backdrop-blur transition hover:border-primary dark:border-white/15 dark:bg-night/60'
  return (
    <>
    <header className={`fixed inset-x-0 top-0 ${menuOpen ? 'z-50 border-black/10 bg-paper/70 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-night/70' : `z-40 ${scrolled ? 'border-black/10 bg-paper/90 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-night/90' : 'border-black/5 bg-paper/75 backdrop-blur-lg dark:border-white/10 dark:bg-night/75'}`} isolate border-b transition duration-300`}>
      <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-3 py-3 sm:px-8">
        <a href="#top" className="flex shrink-0 items-center gap-1 rounded-full bg-paper/60 py-1 pl-1 pr-2 text-base font-semibold tracking-tight backdrop-blur dark:bg-night/60 sm:gap-2 sm:pl-2 sm:pr-3 sm:text-lg">
          <img src={logo} alt="" className="h-8 w-8 object-contain sm:h-9 sm:w-9" />
          <span>{settings.name}</span>
        </a>
        <nav className="hidden items-center gap-2 lg:flex" aria-label="Main navigation">
          {links.map(([label, href]) => (
            <a key={label} href={href} className="relative whitespace-nowrap rounded px-2 py-2 text-sm font-medium transition-all duration-300 hover:text-base hover:text-primary after:absolute after:bottom-1 after:left-2 after:right-2 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-700 after:ease-out after:content-[''] hover:after:scale-x-100">{label}</a>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle className="bg-paper/60 backdrop-blur dark:bg-night/60" />
          <motion.div className="hidden lg:block" animate={{ rotate: [0, -16, 14, -10, 8, 0] }} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.4 }}>
            <button id="cart-btn" onClick={onCart} aria-label={`Open cart, ${cart.length} items`} className={`${chip} relative`}>
              <motion.span key={bump} className="flex" animate={{ scale: bump ? [1, 1.45, 0.9, 1] : 1 }} transition={{ duration: 0.5 }}><FiShoppingBag /></motion.span>
              {cart.length > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-ink">{cart.length}</span>}
            </button>
          </motion.div>
          <motion.div className="lg:hidden" animate={{ rotate: [0, -16, 14, -10, 8, 0] }} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.4 }}>
            <button id="mobile-cart-btn" onClick={onCart} aria-label={`Open cart, ${cart.length} items`} className={`${chip} relative`}>
              <FiShoppingBag />
              {cart.length > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-ink">{cart.length}</span>}
            </button>
          </motion.div>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full text-2xl text-[#A66A00] transition hover:bg-primary/10 dark:text-[#E0A100] lg:hidden"
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '8%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '8%' }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="fixed inset-0 z-[60] flex h-[100dvh] flex-col overflow-y-auto bg-paper text-neutral-900 dark:bg-night dark:text-neutral-100 lg:hidden"
            role="dialog" aria-modal="true" aria-label="Mobile navigation"
          >
            <div className="grid grid-cols-3 items-center px-5 pb-4 pt-5">
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="flex h-11 w-11 items-center justify-center justify-self-start rounded-full text-2xl text-primary transition hover:bg-primary/10">
                <FiX />
              </button>
              <a href="#top" onClick={() => setMenuOpen(false)} className="flex items-center justify-self-center whitespace-nowrap text-sm font-semibold uppercase tracking-[0.14em]">
                <img src={logo} alt="" className="mr-1.5 h-7 w-7 object-contain" />
                {settings.name}
              </a>
              <button type="button" onClick={() => { setMenuOpen(false); onCart() }} aria-label={`Open cart, ${cart.length} items`} className="relative flex h-11 w-11 items-center justify-center justify-self-end rounded-full text-xl text-primary transition hover:bg-primary/10">
                <FiShoppingBag />
                {cart.length > 0 && <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-ink">{cart.length}</span>}
              </button>
            </div>
            <nav className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-8" aria-label="Main navigation">
              {links.map(([label, href]) => (
                <a key={label} href={href} onClick={() => setMenuOpen(false)} className="relative rounded px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition-all duration-300 hover:text-base hover:text-primary after:absolute after:bottom-1 after:left-4 after:right-4 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-700 after:ease-out after:content-[''] hover:after:scale-x-100">
                  {label}
                </a>
              ))}
            </nav>
            <div className="flex flex-col items-center gap-6 pb-8">
              {socials.length > 0 && (
                <div className="flex items-center justify-center gap-6">
                  {socials.map(([Icon, label, href]) => (
                    <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="text-xl text-neutral-700 transition hover:text-primary dark:text-neutral-200">
                      <Icon />
                    </a>
                  ))}
                </div>
              )}
              <ThemeToggle className="bg-paper dark:bg-night" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
    </>
  )
}

function Footer() {
  const { settings } = useStore()
  const socials = [
    [FaInstagram, 'Instagram', settings.instagram], [FaFacebookF, 'Facebook', settings.facebook],
    [FaWhatsapp, 'WhatsApp', settings.whatsapp], [FaTwitter, 'Twitter', settings.twitter],
  ].filter(([, , href]) => Boolean(href && href !== '#'))
  const linkClass = 'transition-colors hover:text-primary'
  return (
    <div className="bg-neutral-200 px-4 py-10 dark:bg-night sm:px-8 sm:py-14">
      <footer className="mx-auto max-w-6xl bg-neutral-950 text-white shadow-2xl dark:bg-black">
        <div className="grid gap-7 px-6 py-8 sm:px-10 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-8">
          <a href="#top" className="flex items-center gap-3 md:border-r md:border-white/15 md:pr-8">
            <img src={logo} alt="" className="h-9 w-9 object-contain" />
            <span className="font-bold tracking-wide">{settings.name}</span>
          </a>

          <div className="space-y-3">
            <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/65" aria-label="Footer">
              <a className={linkClass} href="#about">About</a>
              <a className={linkClass} href="#gallery">Gallery</a>
              <a className={linkClass} href="#/blog">Blog</a>
              <a className={linkClass} href="#contact">Contact</a>
            </nav>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/45">
              <span>&copy; {new Date().getFullYear()} {settings.name}. All rights reserved.</span>
              <a className={linkClass} href="#/privacy">Privacy</a>
              <a className={linkClass} href="#/terms">Terms</a>
            </div>
          </div>

          <div className="space-y-3 text-sm text-white/65 md:min-w-56 md:text-right">
            {socials.length > 0 && (
              <nav className="flex items-center gap-4 md:justify-end" aria-label="Social links">
                {socials.map(([Icon, label, href]) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="text-base transition-colors hover:text-primary">
                    <Icon />
                  </a>
                ))}
              </nav>
            )}
            {settings.email && <a className={linkClass} href={`mailto:${settings.email}`}>Support: {settings.email}</a>}
          </div>
        </div>
      </footer>
    </div>
  )
}

function parse(h) {
  if (h.startsWith('#/admin')) return { page: 'admin' }
  if (h === '#/videos') return { page: 'videos' }
  if (h === '#/blog') return { page: 'blog' }
  if (h === '#/privacy') return { page: 'privacy' }
  if (h === '#/terms') return { page: 'terms' }
  const m = h.match(/^#\/blog\/(.+)$/)
  return m ? { page: 'post', id: m[1] } : { page: 'home' }
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash)
  const [cartOpen, setCartOpen] = useState(false)
  useEffect(() => {
    const r = () => setHash(window.location.hash)
    window.addEventListener('hashchange', r)
    return () => window.removeEventListener('hashchange', r)
  }, [])
  const route = parse(hash)
  // Pages start at the top. On the home page, jump to the section named in the hash (e.g. #gallery) after it renders.
  useEffect(() => {
    if (route.page !== 'home') return window.scrollTo(0, 0)
    const id = hash.slice(1)
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView())
  }, [hash])

  if (route.page === 'admin') return <Admin />
  return (
    <>
      <Nav onCart={() => setCartOpen(true)} />
      <main>
        {route.page === 'home' && (<><Hero /><Marquee /><Gallery /><Commissions /><Music /><About /><Contact /></>)}
        {route.page === 'videos' && <VideosPage />}
        {route.page === 'blog' && <BlogPage />}
        {route.page === 'post' && <PostPage id={route.id} />}
        {(route.page === 'privacy' || route.page === 'terms') && <LegalPage kind={route.page} />}
      </main>
      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <FlyLayer />
      <PaymentReturn />
    </>
  )
}
