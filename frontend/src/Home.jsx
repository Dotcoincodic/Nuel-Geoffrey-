import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { FaFacebookF, FaInstagram, FaTwitter, FaWhatsapp } from 'react-icons/fa'
import { FiHeart, FiMail, FiMapPin, FiSend, FiShare2, FiShoppingCart } from 'react-icons/fi'
import { platforms, steps } from './assets'
import { useStore, money } from './store'
import { flyToCart } from './fly'
import { ShakePrice, btnGhost, btnPrimary, ease, fieldCls, useMediaQuery, wrap } from './ui'

/* ---------- Hero: 9-image slider, sticky, fades before the gallery ---------- */
const SLIDE_SECONDS = 6
const heroCaptions = [
  'Soft morning light settles into every layer of this original work.',
  'A little Lagos warmth, held in colour and careful brushwork.',
  'Look closer and small marks begin to tell a larger story.',
  'Earthy pigments bring a familiar, welcoming feeling into the room.',
  'Quiet details reward a slower look at the canvas.',
  'Loose lines and bold colour give this piece its own rhythm.',
  'Built patiently, one thoughtful layer at a time.',
  'A bright focal point for a home that loves a good story.',
  'Find the work that feels like it has been waiting for you.',
]

export function Hero() {
  const { settings } = useStore()
  const slides = (settings.heroImages || []).filter(Boolean)
  if (slides.length === 0 && settings.heroImage) slides.push(settings.heroImage)
  const ref = useRef(null)
  const [i, setI] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const imgOpacity = useTransform(scrollYProgress, [0, 0.45, 0.95], [1, 1, 0])
  const bgOpacity = useTransform(scrollYProgress, [0, 0.45, 0.95], [0.2, 0.2, 0])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 0.92])
  const txtOpacity = useTransform(scrollYProgress, [0, 0.35, 0.75], [1, 1, 0])
  const lines = settings.headline.split('|')
  const idx = slides.length ? i % slides.length : 0
  const activeSlide = slides[idx]

  return (
    <section ref={ref} id="top" className="relative h-[145svh]">
      <div className="sticky top-0 flex h-[100svh] items-start overflow-hidden bg-paper pt-24 dark:bg-night sm:items-center sm:pt-0">
        <motion.div style={{ opacity: bgOpacity }} className="absolute inset-0" aria-hidden="true">
          <AnimatePresence initial={false}>
            {activeSlide && <motion.img
              key={`background-${idx}`} src={activeSlide} alt=""
              className="absolute inset-0 h-full w-full object-cover"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />}
          </AnimatePresence>
        </motion.div>
        <div className={`${wrap} relative z-10 grid w-full items-center gap-4 md:grid-cols-12 md:gap-10`}>
          <motion.div style={{ opacity: txtOpacity }} className="md:col-span-7">
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              {lines.map((l, n) => (
                <span key={l + n} className="block overflow-hidden pb-1">
                  <motion.span className={`block ${n === lines.length - 1 ? 'text-primary' : ''}`} initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.9, ease, delay: 0.15 + n * 0.12 }}>
                    {l}
                  </motion.span>
                </span>
              ))}
            </h1>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45 }} className="mt-4 max-w-md text-sm text-neutral-700 dark:text-neutral-200 sm:text-base">
                {activeSlide ? (heroCaptions[idx] || `Discover the colours and details in this featured work from ${settings.location}.`) : 'Featured artwork will appear here.'}
              </motion.p>
            </AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95, duration: 0.6 }} className="mt-4 flex flex-wrap gap-3">
              <a href="#gallery" className={`${btnPrimary} gap-2`}><FiShoppingCart aria-hidden="true" />Shop originals</a>
              <a href="#gallery" onClick={() => window.dispatchEvent(new CustomEvent('gallery-tab', { detail: 'archive' }))} className={btnGhost}>View portfolio</a>
            </motion.div>
          </motion.div>

          <motion.div style={{ opacity: imgOpacity, scale: imgScale }} className="md:col-span-5">
            <motion.div
              className="relative h-[50svh] min-h-56 overflow-hidden rounded-2xl bg-neutral-200 dark:bg-night-raised sm:h-[60svh] md:h-[80svh]"
              initial={{ clipPath: 'inset(100% 0 0 0)' }} animate={{ clipPath: 'inset(0% 0 0 0)' }} transition={{ duration: 1.1, ease, delay: 0.25 }}
            >
              {activeSlide ? (
                <>
                  <AnimatePresence initial={false}>
                    <motion.img
                      key={idx} src={activeSlide} alt={`Featured painting ${idx + 1} of ${slides.length}`}
                      className="absolute inset-0 h-full w-full object-cover"
                      initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                  </AnimatePresence>
                  <div className="absolute bottom-4 left-4 flex items-center gap-1.5" aria-hidden="true">
                    {[0, 1, 2].map((segment) => (
                      <span key={segment} className="h-1.5 w-7 overflow-hidden rounded-sm bg-white/40">
                        <motion.span
                          key={`${i}-${segment}`}
                          className="block h-full rounded-sm bg-primary"
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: SLIDE_SECONDS / 3, delay: segment * (SLIDE_SECONDS / 3), ease: 'linear' }}
                          onAnimationComplete={() => { if (segment === 2) setI((n) => n + 1) }}
                        />
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-neutral-100 via-neutral-200 to-primary/20 text-sm text-neutral-500 dark:from-night-raised dark:via-night dark:to-primary/10 dark:text-neutral-400">
                  Featured artwork
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Marquee ---------- */
export function Marquee() {
  const { works } = useStore()
  const artWords = ['Pigment', 'Texture', 'Gesture', 'Rhythm', 'Contrast', 'Colour', 'Form', 'Light', 'Movement', 'Imagination']
  const items = [...(works.length ? works.map((w) => w.title) : ['Original works']), ...artWords]
  const row = [...items, ...items]
  return (
    <div className="relative z-10 overflow-hidden bg-primary py-2 text-primary-ink" aria-hidden="true">
      <div className="flex w-max animate-marquee items-center gap-6 text-base font-medium">
        {row.map((n, i) => (
          <span key={`${i}-${n}`} className="flex shrink-0 items-center gap-4 whitespace-nowrap">
            <span>{n}</span>
            <span className="text-base opacity-75">•</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------- Modal (add to cart for sale items, viewer for archive) ---------- */
function Modal({ item, onClose }) {
  const { addToCart, cart } = useStore()
  const imgRef = useRef(null)
  const isSale = item.collection === 'sale'
  const canOriginal = item.status === 'available'
  const canPrint = Number(item.printPrice) > 0
  const [option, setOption] = useState(canOriginal ? 'Original' : 'Print')
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  const inCart = cart.some((c) => c.workId === item.id && c.option === option)
  const price = option === 'Original' ? item.price : item.printPrice
  // The image bounces into the cart icon, and the item is added when it lands.
  const add = () => { flyToCart(imgRef.current, () => addToCart(item, option)); onClose() }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog" aria-modal="true" aria-label={item.title} onClick={(e) => e.stopPropagation()}
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.4, ease }}
        className="grid max-h-[92svh] w-full max-w-3xl overflow-auto rounded-t-2xl bg-paper dark:bg-night-raised sm:grid-cols-2 sm:rounded-2xl"
      >
        {item.image ? <img ref={imgRef} src={item.image} alt={item.title} className="h-56 w-full object-cover sm:h-full" /> : <div className="grid h-56 w-full place-items-center bg-neutral-100 text-sm text-neutral-500 dark:bg-night sm:min-h-96">Artwork image not added</div>}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-neutral-500">{item.medium}{item.size ? `, ${item.size}` : ''}{item.year ? `, ${item.year}` : ''}</p>
            </div>
            <button onClick={onClose} aria-label="Close" className="rounded-full px-2 text-2xl leading-none">&times;</button>
          </div>
          {isSale && (canOriginal || canPrint) ? (
            <div className="mt-6 space-y-4">
              <div className="flex gap-2">
                {[['Original', canOriginal], ['Print', canPrint]].map(([o, ok]) => (
                  <button type="button" key={o} disabled={!ok} onClick={() => setOption(o)} className={`flex-1 rounded-full border px-3 py-2 text-sm disabled:opacity-40 ${option === o ? 'border-primary bg-primary text-primary-ink' : 'border-black/15 dark:border-white/20'}`}>
                    {o}{ok ? ', ' : ', unavailable'}{ok && <ShakePrice>{money(o === 'Original' ? item.price : item.printPrice)}</ShakePrice>}
                  </button>
                ))}
              </div>
              <button disabled={inCart} onClick={add} className={`${btnPrimary} w-full gap-2 disabled:opacity-60`}>
                {inCart ? 'Already in your cart' : <><FiShoppingCart aria-hidden="true" />Add to cart, {money(price)}</>}
              </button>
              <p className="text-xs text-neutral-500">Originals are one of one. Shipping is added at checkout.</p>
            </div>
          ) : (
            <p className="mt-8 text-sm text-neutral-600 dark:text-neutral-300">
              {isSale ? 'This piece has found a home. Ask about a similar commission.' : 'Part of the archive, shown for display. Prints of selected works may be available on request.'}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ---------- Gallery: For sale / Archive ---------- */
const badge = { available: 'bg-primary text-primary-ink', reserved: 'bg-neutral-900 text-white', sold: 'bg-neutral-500 text-white' }

// Mobile: one image per row. Each card sticks while the next slides over it, then fades out.
function StackCard({ w, last, onOpen }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.93])
  return (
    <div ref={ref} className={last ? '' : 'h-[112svh]'}>
      <motion.div style={{ opacity, scale }} className="sticky top-20">
        <GalleryCard w={w} onOpen={onOpen} />
      </motion.div>
    </div>
  )
}

function GalleryCard({ w, onOpen }) {
  const { cart, addToCart, settings } = useStore()
  const imageRef = useRef(null)
  const [liked, setLiked] = useState(false)
  const [copied, setCopied] = useState(false)
  const isSale = w.collection === 'sale'
  const canOriginal = isSale && w.status === 'available'
  const canPrint = isSale && Number(w.printPrice) > 0
  const option = canOriginal ? 'Original' : canPrint ? 'Print' : null
  const inCart = option && cart.some((item) => item.workId === w.id && item.option === option)

  const add = () => {
    if (!option) return onOpen(w)
    flyToCart(imageRef.current, () => addToCart(w, option))
  }
  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#gallery`
    const details = { title: w.title, text: `${w.title} by ${settings.name}`, url }
    try {
      if (navigator.share) await navigator.share(details)
      else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1800)
      }
    } catch (error) {
      if (error?.name !== 'AbortError') setCopied(false)
    }
  }

  return (
    <article className="flex h-full flex-col rounded-3xl bg-paper-raised p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-night-raised sm:p-5">
      <div className="relative">
        <button type="button" onClick={() => onOpen(w)} aria-label={`View ${w.title}`} className="block w-full text-left">
          <div className="relative aspect-[4/5] max-h-[58svh] overflow-hidden rounded-2xl bg-neutral-100 dark:bg-night">
            {w.image ? <img ref={imageRef} src={w.image} alt={w.title} loading="lazy" className="h-full w-full object-cover transition duration-700 hover:scale-105" /> : <div className="grid h-full w-full place-items-center text-sm text-neutral-500">Artwork image not added</div>}
            {isSale && w.status && <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-medium capitalize ${badge[w.status]}`}>{w.status}</span>}
          </div>
        </button>
        <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-xl bg-primary text-primary-ink shadow-lg">
          <button type="button" onClick={() => setLiked((value) => !value)} aria-pressed={liked} aria-label={liked ? `Remove ${w.title} from favorites` : `Add ${w.title} to favorites`} className="flex h-11 w-11 items-center justify-center text-lg transition hover:bg-primary-soft">
            <FiHeart className={liked ? 'fill-current' : ''} />
          </button>
          <button type="button" onClick={share} aria-label={copied ? 'Artwork link copied' : `Share ${w.title}`} className="flex h-11 w-11 items-center justify-center text-lg transition hover:bg-primary-soft">
            <FiShare2 />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-1 pt-4">
        <button type="button" onClick={() => onOpen(w)} className="text-left text-base font-semibold leading-snug transition hover:text-primary sm:text-lg">{w.title}</button>
        {isSale ? <ShakePrice className="mt-2 text-base font-semibold text-neutral-500">{money(w.price)}</ShakePrice> : <p className="mt-2 text-sm font-medium text-neutral-500">Archive work</p>}
        <p className="mt-2 min-h-5 text-xs text-neutral-500">
          {[w.medium, w.size, w.year].filter(Boolean).join(' · ') || (isSale ? 'Original artwork' : 'From the archive')}
        </p>
        <button type="button" onClick={add} disabled={Boolean(option && inCart)} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary hover:text-primary-ink disabled:cursor-default disabled:bg-neutral-700 disabled:text-white/80">
          {option && <FiShoppingCart aria-hidden="true" />}
          <span>{option ? (inCart ? 'Added to cart' : option === 'Print' ? 'Add print to cart' : 'Add to cart') : isSale ? 'View details' : 'View artwork'}</span>
        </button>
      </div>
    </article>
  )
}

export function Gallery() {
  const [tab, setTab] = useState('sale')
  const [open, setOpen] = useState(null)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const { works } = useStore()
  useEffect(() => {
    const h = (e) => setTab(e.detail)
    window.addEventListener('gallery-tab', h)
    return () => window.removeEventListener('gallery-tab', h)
  }, [])
  const items = works.filter((w) => w.collection === tab)
  return (
    <section id="gallery" className={`${wrap} py-20`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Gallery</h2>
        <div role="tablist" className="flex rounded-full border border-black/10 p-1 dark:border-white/15">
          {[['sale', 'For sale'], ['archive', 'Archive']].map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className="relative rounded-full px-5 py-2 text-sm font-medium">
              {tab === id && <motion.span layoutId="gallery-pill" className="absolute inset-0 rounded-full bg-primary" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className={`relative ${tab === id ? 'text-primary-ink' : ''}`}>{label}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 max-w-lg text-sm text-neutral-600 dark:text-neutral-300">
        {tab === 'sale' ? 'Original works ready to ship. Tap a piece to order.' : 'A record of past work, shown for display.'}
      </p>

      {isDesktop ? (
        <motion.div layout className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
          <AnimatePresence mode="popLayout">
            {items.map((w, i) => (
              <motion.div key={w.id} layout initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ duration: 0.45, ease, delay: i * 0.05 }} className="h-full">
                <GalleryCard w={w} onOpen={setOpen} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div key={tab} className="mt-8">
          {items.map((w, i) => <StackCard key={w.id} w={w} last={i === items.length - 1} onOpen={setOpen} />)}
        </div>
      )}
      <AnimatePresence>{open && <Modal item={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </section>
  )
}

/* ---------- Commissions ---------- */
export function Commissions() {
  return (
    <section id="commissions" className="bg-neutral-100 py-20 dark:bg-night-raised">
      <div className={wrap}>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Commissions</h2>
        <p className="mt-3 max-w-lg text-sm text-neutral-600 dark:text-neutral-300">Have something specific in mind? Here is how it works.</p>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.li key={s.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, ease, delay: i * 0.1 }} className="rounded-2xl border border-black/10 bg-paper p-6 dark:border-white/10 dark:bg-night">
              <span className="text-3xl font-semibold text-primary">{i + 1}</span>
              <h3 className="mt-3 font-medium">{s.title}</h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{s.text}</p>
            </motion.li>
          ))}
        </ol>
        <a href="#gallery" className={`${btnPrimary} mt-10`}>Start a commission</a>
      </div>
    </section>
  )
}

/* ---------- Music ---------- */
function Equalizer({ playing }) {
  return (
    <span className="flex h-5 items-end gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <motion.span key={i} className="w-1 rounded-sm bg-primary" animate={{ height: playing ? ['20%', '100%', '40%', '80%'] : '20%' }} transition={playing ? { duration: 0.8, repeat: Infinity, repeatType: 'mirror', delay: i * 0.12 } : { duration: 0.2 }} />
      ))}
    </span>
  )
}

export function Music() {
  const { tracks } = useStore()
  return tracks.length ? <MusicPlayer tracks={tracks} /> : null
}

function MusicPlayer({ tracks }) {
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audio = useRef(null)
  const track = tracks[idx]

  useEffect(() => {
    const a = audio.current
    a.src = track.src
    setProgress(0)
    if (playing && track.src) a.play().catch(() => setPlaying(false))
  }, [idx])

  const toggle = () => {
    const a = audio.current
    if (playing) a.pause()
    else if (track.src) a.play().catch(() => {})
    setPlaying(!playing)
  }
  const choose = (i) => { if (i === idx) toggle(); else { setIdx(i); setPlaying(true) } }

  return (
    <section id="music" className={`${wrap} py-20`}>
      <audio ref={audio} onTimeUpdate={(e) => setProgress((e.target.currentTime / (e.target.duration || 1)) * 100)} onEnded={() => setIdx((idx + 1) % tracks.length)} />
      <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Music</h2>
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <motion.div key={track.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease }} className="relative aspect-square max-w-md overflow-hidden rounded-2xl">
          {track.cover ? <motion.img src={track.cover} alt={`${track.title} cover`} className="h-full w-full object-cover" animate={{ scale: playing ? 1.06 : 1 }} transition={{ duration: 6, ease: 'linear' }} /> : <div className="grid h-full w-full place-items-center bg-neutral-100 text-sm text-neutral-500 dark:bg-night-raised">Cover image not added</div>}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 text-white">
            <p className="text-lg font-medium">{track.title}</p>
            <p className="text-sm text-white/70">{track.meta}</p>
            <div className="mt-3 h-1 rounded-full bg-white/25"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div>
          </div>
        </motion.div>
        <div>
          <ul className="divide-y divide-black/10 dark:divide-white/10">
            {tracks.map((t, i) => (
              <li key={t.id}>
                <button onClick={() => choose(i)} className="flex w-full items-center gap-4 py-4 text-left transition hover:text-primary">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-sm dark:border-white/20">
                    {i === idx && playing ? <Equalizer playing /> : i + 1}
                  </span>
                  <span className="flex-1"><span className="block font-medium">{t.title}</span><span className="text-xs text-neutral-500">{t.meta}</span></span>
                  <span className="text-sm text-neutral-500">{t.length}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            {platforms.map((p) => <a key={p.label} href={p.href} className={btnGhost}>{p.label}</a>)}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- About + Footer ---------- */
export function About() {
  const { settings } = useStore()
  return (
    <section id="about" className={`${wrap} grid items-center gap-6 pt-16 pb-14 md:grid-cols-2 md:gap-10 md:pt-16 md:pb-20`}>
      <div className="relative isolate mx-auto w-full max-w-xl">
        <div aria-hidden="true" className="absolute -left-5 top-[38%] z-0 h-48 w-24 rounded-full border border-white/30 shadow-[0_0_32px_rgba(255,255,255,0.18)]" />
        <div aria-hidden="true" className="absolute -right-5 top-[28%] z-0 h-40 w-20 rounded-full border border-primary/40 shadow-[0_0_28px_rgba(224,161,0,0.25)]" />
        <div aria-hidden="true" className="absolute inset-4 z-0 translate-x-3 translate-y-3 rotate-3 rounded-[2rem] border border-white/10 bg-neutral-900/80 shadow-xl" />
        <div aria-hidden="true" className="absolute left-1/2 top-0 z-20 h-1 w-3/4 -translate-x-1/2 rounded-full bg-primary-soft shadow-[0_0_28px_rgba(224,161,0,0.85)]" />
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease }} className="relative z-10 rounded-[2rem] border border-white/10 bg-neutral-950 p-3 shadow-2xl">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-neutral-800 via-neutral-900 to-black">
            {settings.aboutImage ? <img src={settings.aboutImage} alt="The artist in the studio" loading="lazy" className="absolute inset-0 h-full w-full object-cover" /> : <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-neutral-700 via-neutral-900 to-primary/20" />}
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/15" />
          </div>
        </motion.div>
      </div>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">About</h2>
        <p className="mt-3 max-w-prose text-sm leading-6 text-left text-neutral-600 dark:text-neutral-300 sm:mt-5 sm:text-base sm:leading-8">{settings.bio}</p>
        <a href={`mailto:${settings.email}`} className={`${btnGhost} mt-4 sm:mt-6`}>{settings.email}</a>
      </div>
    </section>
  )
}


/* ---------- Contact ---------- */
export function Contact() {
  const { settings, sendMessage } = useStore()
  const [sent, setSent] = useState(false)
  const socials = [
    [FaInstagram, 'Instagram', settings.instagram], [FaFacebookF, 'Facebook', settings.facebook],
    [FaWhatsapp, 'WhatsApp', settings.whatsapp], [FaTwitter, 'Twitter', settings.twitter],
  ].filter(([, , href]) => Boolean(href && href !== '#'))
  const mapQuery = encodeURIComponent(settings.location || '')
  const submit = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    if (!(await sendMessage({ type: 'contact', ...Object.fromEntries(new FormData(form)) }))) return
    form.reset()
    setSent(true)
    setTimeout(() => setSent(false), 3500)
  }
  return (
    <section id="contact" className="bg-paper pb-16 dark:bg-night">
      <div className="bg-neutral-100 dark:bg-night-raised">
        <div className={`${wrap} grid gap-10 py-10 sm:py-14 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-16`}>
          <div className="lg:py-4">
            <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">Get In Touch</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-neutral-600 dark:text-neutral-300">
              Have a question about an artwork or want to discuss a commission? Send a message and we will be in touch.
            </p>

            <div className="mt-7 space-y-4">
              {settings.location && (
                <a href={`https://maps.google.com/?q=${mapQuery}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl transition hover:text-primary">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg text-primary-ink"><FiMapPin /></span>
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">Studio location</span>
                    <span className="mt-0.5 block text-sm font-medium">{settings.location}</span>
                  </span>
                </a>
              )}
              {settings.email && (
                <a href={`mailto:${settings.email}`} className="flex items-center gap-3 rounded-xl transition hover:text-primary">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg text-primary-ink"><FiMail /></span>
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">Email</span>
                    <span className="mt-0.5 block text-sm font-medium">{settings.email}</span>
                  </span>
                </a>
              )}
            </div>

            {socials.length > 0 && (
              <div className="mt-8">
                <p className="text-sm font-semibold">Follow us</p>
                <div className="mt-3 flex gap-3">
                  {socials.map(([Icon, label, href]) => (
                    <motion.a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} whileHover={{ y: -4, scale: 1.08 }} whileTap={{ scale: 0.95 }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-base text-primary-ink transition hover:bg-primary-soft">
                      <Icon />
                    </motion.a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={submit} className="rounded-3xl bg-paper p-6 shadow-sm dark:bg-night sm:p-8">
            <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">Send a Message</h3>
            <div className="mt-5 space-y-3">
              <input name="name" required placeholder="Your name" className={fieldCls} />
              <input name="email" type="email" required placeholder="Email address" className={fieldCls} />
              <textarea name="message" required rows="4" placeholder="Your message" className={fieldCls} />
            </div>
            <div className="mt-4 flex justify-end">
              <button disabled={sent} className={`${btnPrimary} min-w-36 gap-2 overflow-hidden`}>
                <span>{sent ? 'Sent' : 'Send message'}</span>
                <motion.span className="flex" animate={sent ? { x: 120, opacity: 0 } : { x: 0, opacity: 1 }} transition={{ duration: 0.8, ease }}><FiSend /></motion.span>
              </button>
            </div>
            <p role="status" className="mt-2 min-h-4 text-xs text-neutral-500">{sent ? 'Thank you. Your message has been sent.' : ''}</p>
          </form>
        </div>

        {settings.location && <LocationExperience location={settings.location} mapQuery={mapQuery} />}
      </div>
    </section>
  )
}

function LocationExperience({ location, mapQuery }) {
  const sectionRef = useRef(null)
  const [mapClear, setMapClear] = useState(false)
  const [reminded, setReminded] = useState(false)
  const remindedRef = useRef(false)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const panelProgress = useMotionValue(0)
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    if (!remindedRef.current) panelProgress.set(latest)
  })
  const width = useTransform(panelProgress, [0, 1], ['50vw', '100vw'])
  const height = useTransform(panelProgress, [0, 1], ['50svh', '100svh'])
  const borderRadius = useTransform(panelProgress, [0, 1], ['1.5rem', '0rem'])

  const remindLater = () => {
    remindedRef.current = true
    setReminded(true)
    animate(panelProgress, 0, { duration: 1.35, ease: 'easeInOut' })
  }

  return (
    <section ref={sectionRef} aria-label={`Location: ${location}`} className="relative h-[190svh] bg-neutral-950">
      <div className="sticky top-0 flex h-[100svh] w-full items-center justify-center overflow-hidden bg-neutral-950">
        <motion.div
          style={{ width, height, borderRadius }}
          className="relative overflow-hidden bg-neutral-900 shadow-2xl"
        >
          <motion.iframe
            title={`Map showing ${location}`}
            src={`https://maps.google.com/maps?q=${mapQuery}&z=12&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            animate={{ filter: mapClear ? 'blur(0px)' : 'blur(7px)', scale: mapClear ? 1 : 1.06 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full w-full border-0 ${mapClear ? 'pointer-events-auto' : 'pointer-events-none'}`}
          />
        </motion.div>

        <AnimatePresence>
          {!mapClear && !reminded && (
            <motion.div
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-10 grid place-items-center bg-black/25 px-6 text-center"
            >
              <div className="max-w-lg text-white">
                <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Location</h2>
                <p className="mx-auto mt-4 max-w-md text-base text-white/80 sm:text-lg">Pay a visit to our studio gallery.</p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <button type="button" onClick={() => setMapClear(true)} className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-ink transition hover:bg-primary-soft">
                    I’m interested
                  </button>
                  <button type="button" onClick={remindLater} className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 bg-white/10 px-7 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">
                    Remind me later
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <p role="status" className="sr-only">{mapClear ? `Map revealed for ${location}.` : reminded ? 'Map minimized for later.' : ''}</p>
      </div>
    </section>
  )
}
