import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { FaApple, FaFacebookF, FaInstagram, FaSpotify, FaTwitter, FaWhatsapp, FaYoutube } from 'react-icons/fa'
import { FiChevronDown, FiHeart, FiMail, FiMapPin, FiMoreVertical, FiMusic, FiPause, FiPlay, FiRotateCcw, FiRotateCw, FiSend, FiShare2, FiShoppingCart, FiSkipBack, FiSkipForward, FiVolume2, FiVolumeX, FiX } from 'react-icons/fi'
import { steps } from './assets'
import { useStore, money } from './store'
import { flyToCart } from './fly'
import { ShakePrice, btnGhost, btnPrimary, ease, fieldCls, useMediaQuery, wrap } from './ui'

/* ---------- Hero: 9-image slider with smooth transitions ---------- */
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
  const [i, setI] = useState(0)
  const lines = settings.headline.split('|')
  const idx = slides.length ? i % slides.length : 0
  const activeSlide = slides[idx]

  return (
    <section id="top" className="relative min-h-svh overflow-hidden bg-paper dark:bg-night">
        <motion.div className="absolute inset-0 opacity-20" aria-hidden="true">
          <AnimatePresence initial={false}>
            {activeSlide && <motion.img
              key={`background-${idx}`} src={activeSlide} alt=""
              className="absolute inset-0 h-full w-full object-cover"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />}
          </AnimatePresence>
        </motion.div>
        <div className={`${wrap} relative z-10 grid min-h-svh w-full items-start gap-4 pb-12 pt-24 sm:items-center sm:py-20 md:grid-cols-12 md:gap-10`}>
          <motion.div className="md:col-span-7">
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              {lines.map((l, n) => (
                <span key={l + n} className="block overflow-hidden pb-1">
                  <motion.span className={`block ${n === lines.length - 1 ? 'text-primary' : ''}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease }}>
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease }} className="mt-4 flex flex-wrap gap-3">
              <a href="#gallery" className={`${btnPrimary} gap-2`}><FiShoppingCart aria-hidden="true" />Shop originals</a>
              <a href="#gallery" onClick={() => window.dispatchEvent(new CustomEvent('gallery-tab', { detail: 'archive' }))} className={btnGhost}>View portfolio</a>
            </motion.div>
          </motion.div>

          <motion.div className="md:col-span-5">
            <motion.div
              className="relative h-[50svh] min-h-56 overflow-hidden rounded-2xl bg-neutral-200 dark:bg-night-raised sm:h-[60svh] md:h-[80svh]"
              initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.75, ease }}
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
  const imageFrameRef = useRef(null)
  const { scrollYProgress: imageScrollProgress } = useScroll({ target: imageFrameRef, offset: ['start end', 'end start'] })
  const imageParallaxY = useTransform(imageScrollProgress, [0, 1], [-18, 18])
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
          <div ref={imageFrameRef} className="relative aspect-[4/5] max-h-[58svh] overflow-hidden rounded-2xl bg-neutral-100 dark:bg-night">
            {w.image ? <motion.img ref={imageRef} style={{ y: imageParallaxY, scale: 1.08 }} whileHover={{ scale: 1.14 }} transition={{ duration: 0.7, ease }} src={w.image} alt={w.title} loading="lazy" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-sm text-neutral-500">Artwork image not added</div>}
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
              <motion.div key={w.id} layout initial={{ opacity: 0, y: 24, scale: 0.96 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: '-70px' }} exit={{ opacity: 0, scale: 0.94 }} transition={{ duration: 0.6, ease, delay: i * 0.05 }} className="h-full">
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
        <motion.span key={i} className="w-1 rounded-sm bg-[#20d66b]" animate={{ height: playing ? ['20%', '100%', '40%', '80%'] : '20%' }} transition={playing ? { duration: 0.8, repeat: Infinity, repeatType: 'mirror', delay: i * 0.12 } : { duration: 0.2 }} />
      ))}
    </span>
  )
}

export function Music() {
  const { tracks, settings } = useStore()
  return tracks.length ? <MusicPlayer tracks={tracks} settings={settings} /> : null
}

function MusicPlayer({ tracks, settings }) {
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.72)
  const [hasSelection, setHasSelection] = useState(false)
  const [fullPlayerOpen, setFullPlayerOpen] = useState(false)
  const [menuTrackId, setMenuTrackId] = useState(null)
  const audio = useRef(null)
  const track = tracks[idx]
  const artist = track.artist || settings.name

  const parseLength = (length) => {
    const parts = String(length || '').split(':').map(Number)
    if (!parts.length || parts.some((part) => !Number.isFinite(part))) return 0
    return parts.reduce((total, part) => total * 60 + part, 0)
  }
  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '00:00'
    const whole = Math.floor(seconds)
    return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`
  }
  const displayDuration = duration || parseLength(track.length)

  useEffect(() => {
    const a = audio.current
    a.pause()
    a.removeAttribute('src')
    if (track.src) {
      a.src = track.src
      a.currentTime = 0
    }
    a.load()
    setProgress(0)
    setCurrentTime(0)
    setDuration(0)
    if (playing && track.src) a.play().catch(() => setPlaying(false))
  }, [idx, track.src])

  useEffect(() => {
    if (audio.current) audio.current.volume = volume
  }, [volume])

  useEffect(() => {
    if (!fullPlayerOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setFullPlayerOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [fullPlayerOpen])

  const toggle = () => {
    const a = audio.current
    if (!track.src || !a) return
    if (playing) {
      a.pause()
      setPlaying(false)
    } else {
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }
  const skipBy = (seconds) => {
    const a = audio.current
    if (!a || !track.src) return
    const nextTime = Math.max(0, a.currentTime + seconds)
    a.currentTime = Number.isFinite(a.duration) ? Math.min(nextTime, a.duration) : nextTime
    setCurrentTime(a.currentTime)
    if (Number.isFinite(a.duration) && a.duration > 0) setProgress((a.currentTime / a.duration) * 100)
  }
  const openTrack = (i) => {
    const next = tracks[i]
    setHasSelection(true)
    setMenuTrackId(null)
    setFullPlayerOpen(true)
    if (i === idx) {
      if (next.src && !playing) {
        audio.current?.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
      }
      return
    }
    setPlaying(Boolean(next.src))
    setIdx(i)
  }
  const selectTrack = (i) => {
    setHasSelection(true)
    if (i === idx) {
      toggle()
      return
    }
    setPlaying(Boolean(tracks[i].src))
    setIdx(i)
  }
  const stepTrack = (step) => {
    const nextIndex = (idx + step + tracks.length) % tracks.length
    setHasSelection(true)
    setPlaying(Boolean(tracks[nextIndex].src))
    setIdx(nextIndex)
  }
  const onTimeUpdate = (event) => {
    const a = event.currentTarget
    const nextDuration = Number.isFinite(a.duration) ? a.duration : 0
    setCurrentTime(a.currentTime || 0)
    setDuration(nextDuration)
    setProgress(nextDuration > 0 ? (a.currentTime / nextDuration) * 100 : 0)
  }
  const platformLinks = [
    { label: 'Spotify', href: settings.spotify, Icon: FaSpotify },
    { label: 'Apple Music', href: settings.appleMusic, Icon: FaApple },
    { label: 'YouTube', href: settings.youtube, Icon: FaYoutube },
  ]

  return (
    <section id="music" className="relative scroll-mt-20 bg-[#101010] py-16 text-white sm:py-20">
      <audio
        ref={audio}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onTimeUpdate}
        onError={() => setPlaying(false)}
        onEnded={() => stepTrack(1)}
      />
      <div className="mx-auto w-full max-w-4xl px-5 sm:px-8">
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Studio releases</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Music</h2>
          </div>
          <span className="pb-1 text-sm text-white/45">{tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}</span>
        </div>

        <ul className="divide-y divide-white/[0.06]">
          {tracks.map((t, i) => {
            const selected = hasSelection && i === idx
            return (
              <li key={t.id} className="relative flex items-center gap-4 py-3 sm:gap-5 sm:py-4">
                <button
                  type="button"
                  onClick={() => openTrack(i)}
                  aria-label={`Open ${t.title} in the full player`}
                  aria-pressed={selected}
                  className="group flex min-w-0 flex-1 items-center gap-4 rounded-lg text-left outline-offset-4 sm:gap-5"
                >
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden bg-white/10 sm:h-16 sm:w-16">
                    {t.cover ? <img src={t.cover} alt="" loading="lazy" className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center text-white/45"><FiMusic aria-hidden="true" /></span>}
                    {selected && playing && <span className="absolute inset-0 grid place-items-center bg-black/40"><Equalizer playing /></span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-base font-medium sm:text-lg ${selected ? 'text-[#20d66b]' : 'text-white group-hover:text-[#20d66b]'}`}>{t.title}</span>
                    <span className="mt-0.5 block truncate text-sm text-white/60">{t.artist || settings.name}</span>
                  </span>
                  <span className="hidden shrink-0 text-sm text-white/45 sm:block">{t.length}</span>
                </button>
                <div className="relative shrink-0">
                  <button
                    type="button"
                    aria-label={`More options for ${t.title}`}
                    aria-expanded={menuTrackId === t.id}
                    onClick={() => setMenuTrackId((id) => id === t.id ? null : t.id)}
                    className="flex h-10 w-8 items-center justify-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white"
                  >
                    <FiMoreVertical aria-hidden="true" className="text-lg" />
                  </button>
                  <AnimatePresence>
                    {menuTrackId === t.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.97 }}
                        className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#222] p-1 shadow-2xl"
                      >
                        <button type="button" onClick={() => openTrack(i)} className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-white/90 transition hover:bg-white/10">Open full player</button>
                        <button type="button" onClick={() => { selectTrack(i); setMenuTrackId(null) }} className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-white/90 transition hover:bg-white/10">Play in mini-player</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {platformLinks.map(({ label, href, Icon }) => href && href !== '#' ? (
            <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={`Listen on ${label}`} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-2 text-sm text-white/75 transition hover:border-white/40 hover:text-white">
              <Icon aria-hidden="true" className="text-base" />{label}
            </a>
          ) : null)}
        </div>
      </div>

      <AnimatePresence>
        {hasSelection && !fullPlayerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
            className="fixed inset-x-3 bottom-4 z-[45] mx-auto max-w-3xl rounded-xl border border-white/10 bg-[#145566] p-2.5 text-white shadow-[0_12px_45px_rgba(0,0,0,0.42)] sm:bottom-5 sm:p-3"
          >
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setFullPlayerOpen(true)} aria-label={`Open full player for ${track.title}`} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <span className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-black/20">
                  {track.cover ? <img src={track.cover} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center"><FiMusic /></span>}
                </span>
                <span className="min-w-0"><span className="block truncate text-sm font-semibold">{track.title}</span><span className="block truncate text-xs text-white/65">{artist}</span></span>
              </button>
              <button type="button" disabled={!track.src} onClick={toggle} aria-label={playing ? 'Pause track' : 'Play track'} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl transition hover:bg-white/10 disabled:opacity-45">
                {playing ? <FiPause aria-hidden="true" /> : <FiPlay aria-hidden="true" className="ml-0.5" />}
              </button>
              <button type="button" onClick={() => setFullPlayerOpen(true)} aria-label="Open full music player" className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 sm:flex">
                <FiChevronDown aria-hidden="true" className="rotate-180 text-xl" />
              </button>
            </div>
            <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-white/20"><div className="h-full bg-[#22d46b] transition-[width]" style={{ width: `${progress}%` }} /></div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fullPlayerOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex min-h-[100dvh] items-center justify-center overflow-y-auto bg-[#4a3b25] px-3 py-4 text-white sm:px-6 sm:py-8"
            role="dialog" aria-modal="true" aria-label={`Now playing ${track.title}`}
            style={track.cover ? { backgroundImage: `linear-gradient(rgba(22,17,10,.7), rgba(12,12,12,.94)), url("${track.cover}")`, backgroundPosition: 'center', backgroundSize: 'cover' } : undefined}
          >
            <button type="button" onClick={() => setFullPlayerOpen(false)} aria-label="Close full player" className="fixed right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-xl text-white/80 backdrop-blur transition hover:bg-black/55 hover:text-white sm:right-8 sm:top-8">
              <FiX aria-hidden="true" />
            </button>
            <motion.div
              initial={{ y: 18, scale: 0.98, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 18, scale: 0.98, opacity: 0 }}
              className="my-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-black/75 p-3 shadow-[0_30px_100px_rgba(0,0,0,0.62)] backdrop-blur-xl sm:p-4"
            >
              <div className="relative aspect-square overflow-hidden rounded-[1.5rem] bg-white/10">
                {track.cover ? <motion.img src={track.cover} alt={`${track.title} cover`} className="h-full w-full object-cover" animate={{ scale: playing ? 1.025 : 1 }} transition={{ duration: 8, ease: 'linear' }} /> : <div className="grid h-full w-full place-items-center text-white/45"><FiMusic className="text-5xl" /></div>}
                <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/20 opacity-100 transition-opacity sm:opacity-0 sm:hover:opacity-100 sm:focus-within:opacity-100">
                  <button type="button" disabled={!track.src} onClick={() => skipBy(-10)} aria-label="Go back 10 seconds" className="flex h-11 min-w-14 items-center justify-center gap-1 rounded-full bg-black/60 px-3 text-sm text-white backdrop-blur disabled:opacity-40"><FiRotateCcw aria-hidden="true" /><span>10</span></button>
                  <button type="button" disabled={!track.src} onClick={() => skipBy(10)} aria-label="Go forward 10 seconds" className="flex h-11 min-w-14 items-center justify-center gap-1 rounded-full bg-black/60 px-3 text-sm text-white backdrop-blur disabled:opacity-40"><span>10</span><FiRotateCw aria-hidden="true" /></button>
                </div>
              </div>

              <div className="px-2 pb-2 pt-5 sm:px-3">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/55">Now playing</p>
                <div className="mt-1 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{track.title}</h3>
                    <p className="mt-1 truncate text-lg text-white/70">{artist}</p>
                  </div>
                  {track.meta && <span className="mt-1 max-w-28 shrink-0 truncate rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white/60">{track.meta}</span>}
                </div>
                {track.description && <p className="music-description mt-3 line-clamp-2 text-sm leading-5 text-white/75">{track.description}</p>}

                <div className="mt-5">
                  <input
                    type="range" min="0" max={Math.max(displayDuration, 1)} step="1" value={Math.min(currentTime, displayDuration || currentTime)}
                    onChange={(event) => { const next = Number(event.target.value); if (audio.current && track.src) audio.current.currentTime = next; setCurrentTime(next); setProgress(displayDuration ? (next / displayDuration) * 100 : 0) }}
                    disabled={!track.src || !displayDuration}
                    aria-label="Seek through track"
                    className="music-range h-1.5 w-full cursor-pointer appearance-none rounded-full disabled:cursor-default disabled:opacity-50"
                    style={{ background: `linear-gradient(to right, #f5f5f5 ${progress}%, rgba(255,255,255,.3) ${progress}%)` }}
                  />
                  <div className="mt-1.5 flex justify-between text-xs tabular-nums text-white/70"><span>{formatTime(currentTime)}</span><span>-{formatTime(Math.max(0, displayDuration - currentTime))}</span></div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-7 sm:gap-10">
                  <button type="button" onClick={() => stepTrack(-1)} aria-label="Previous track" className="flex h-12 w-12 items-center justify-center text-3xl text-white transition hover:scale-105 hover:text-white/75"><FiSkipBack aria-hidden="true" /></button>
                  <button type="button" disabled={!track.src} onClick={toggle} aria-label={playing ? 'Pause track' : 'Play track'} className="flex h-16 w-16 items-center justify-center rounded-full text-5xl text-white transition hover:scale-105 disabled:opacity-40">{playing ? <FiPause aria-hidden="true" /> : <FiPlay aria-hidden="true" className="ml-1" />}</button>
                  <button type="button" onClick={() => stepTrack(1)} aria-label="Next track" className="flex h-12 w-12 items-center justify-center text-3xl text-white transition hover:scale-105 hover:text-white/75"><FiSkipForward aria-hidden="true" /></button>
                </div>

                <div className="mt-5 flex items-center gap-3 px-1">
                  {volume === 0 ? <FiVolumeX aria-hidden="true" className="shrink-0 text-xl text-white/70" /> : <FiVolume2 aria-hidden="true" className="shrink-0 text-xl text-white/70" />}
                  <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label="Volume" className="music-range h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-white/30" style={{ background: `linear-gradient(to right, #f5f5f5 ${volume * 100}%, rgba(255,255,255,.3) ${volume * 100}%)` }} />
                  <button type="button" onClick={() => setFullPlayerOpen(false)} aria-label="Return to track list" className="ml-1 text-xs font-medium text-white/60 transition hover:text-white">LIST</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
                <div className="flex items-center gap-3 rounded-xl">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg text-primary-ink"><FiMapPin /></span>
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">Studio location</span>
                    <span className="mt-0.5 block text-sm font-medium">{settings.location}</span>
                  </span>
                </div>
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

      </div>
    </section>
  )
}
