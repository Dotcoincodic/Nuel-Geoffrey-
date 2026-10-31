import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiMenu, FiShoppingBag, FiX } from 'react-icons/fi'
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
            <a key={label} href={href} className="whitespace-nowrap rounded-full px-2 py-2 text-sm font-medium transition hover:bg-primary hover:text-primary-ink">{label}</a>
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
          <motion.nav
            initial={{ opacity: 0, y: -18, scaleY: 0.94 }} animate={{ opacity: 1, y: 0, scaleY: 1 }} exit={{ opacity: 0, y: -12, scaleY: 0.96 }}
            transition={{ duration: 0.2 }}
            style={{ transformOrigin: 'top right' }}
            className="absolute right-2 top-full z-20 mt-2 h-[50vh] w-[calc(100vw-1rem)] max-w-sm overflow-y-auto rounded-2xl border border-black/10 bg-paper/95 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-night/95 lg:hidden"
            aria-label="Main navigation"
          >
            <ul className="flex flex-col gap-1 p-3">
              {links.map(([label, href]) => (
                <li key={label}>
                  <a href={href} onClick={() => setMenuOpen(false)} className="inline-flex w-fit max-w-full origin-left rounded-lg border border-transparent px-3 py-2.5 text-left text-sm font-medium transition duration-200 hover:scale-[1.04] hover:border-white/40 hover:bg-white/35 hover:text-primary hover:backdrop-blur-lg dark:hover:border-white/20 dark:hover:bg-white/10">{label}</a>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
    <AnimatePresence>
      {menuOpen && (
        <motion.button
          type="button"
          aria-label="Close navigation menu"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 cursor-default bg-black/10 backdrop-blur-md dark:bg-black/20 lg:hidden"
        />
      )}
    </AnimatePresence>
    </>
  )
}

function Footer() {
  const { settings } = useStore()
  const a = 'hover:underline'
  return (
    <footer className="bg-primary text-primary-ink">
      <div className={`${wrap} flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-8 text-sm`}>
        <span className="font-semibold">&copy; {new Date().getFullYear()} {settings.name}</span>
        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
          <a className={a} href="#/videos">Live videos</a>
          <a className={a} href="#/blog">Blog</a>
          <a className={a} href="#/privacy">Privacy Policy</a>
          <a className={a} href="#/terms">Terms of Service</a>
        </nav>
      </div>
    </footer>
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
