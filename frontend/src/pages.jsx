import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiHeart, FiSend, FiThumbsUp } from 'react-icons/fi'
import { useStore } from './store'
import { PageShell, btnGhost, ease, fieldCls, fmtDate, btnPrimary } from './ui'

const embedUrl = (u = '') => {
  const y = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/)
  if (y) return 'https://www.youtube.com/embed/' + y[1]
  const v = u.match(/vimeo\.com\/(\d+)/)
  return v ? 'https://player.vimeo.com/video/' + v[1] : null
}

/* ---------- Live videos ---------- */
function Reaction({ icon: Icon, label, count, active, onClick }) {
  return (
    <motion.button whileTap={{ scale: 0.88 }} onClick={onClick} aria-pressed={active} aria-label={label}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${active ? 'border-primary bg-primary text-primary-ink' : 'border-black/15 hover:border-primary dark:border-white/20'}`}>
      <motion.span key={String(active)} initial={{ scale: 0.6 }} animate={{ scale: [0.6, 1.4, 1] }} transition={{ duration: 0.4 }} className="flex"><Icon /></motion.span>
      {count}
    </motion.button>
  )
}

function VideoCard({ v }) {
  const { react, reacted, sendMessage } = useStore()
  const [sent, setSent] = useState(false)
  const embed = embedUrl(v.src)
  const submit = async (e) => {
    e.preventDefault()
    const f = e.currentTarget
    if (!(await sendMessage({ type: 'comment', videoId: v.id, videoTitle: v.title, ...Object.fromEntries(new FormData(f)) }))) return
    f.reset(); setSent(true); setTimeout(() => setSent(false), 3500)
  }
  return (
    <motion.article initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.7, ease }}
      className="overflow-hidden rounded-2xl border border-black/10 bg-paper-raised dark:border-white/10 dark:bg-night-raised">
      <div className="aspect-video bg-black">
        {embed ? <iframe src={embed} title={v.title} className="h-full w-full" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen />
          : <video src={v.src} poster={v.poster} controls playsInline preload="metadata" className="h-full w-full" />}
      </div>
      <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-5">
        <div className="md:col-span-3">
          <p className="text-xs text-neutral-500">Uploaded {fmtDate(v.date)}</p>
          <h2 className="mt-1 text-2xl font-semibold">{v.title}</h2>
          <p className="mt-3 text-neutral-600 dark:text-neutral-300">{v.description}</p>
          {v.story && (
            <div className="mt-5 border-l-2 border-primary pl-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">The story behind it</p>
              <p className="mt-1 whitespace-pre-line text-sm text-neutral-600 dark:text-neutral-300">{v.story}</p>
            </div>
          )}
          <div className="mt-5 flex gap-3">
            <Reaction icon={FiThumbsUp} label="Like" count={v.likes || 0} active={reacted.includes(v.id + ':likes')} onClick={() => react(v.id, 'likes')} />
            <Reaction icon={FiHeart} label="Love" count={v.loves || 0} active={reacted.includes(v.id + ':loves')} onClick={() => react(v.id, 'loves')} />
          </div>
        </div>
        <form onSubmit={submit} className="space-y-2 md:col-span-2">
          <p className="text-sm font-medium">Send a comment to the artist</p>
          <input name="name" required placeholder="Your name" className={fieldCls} />
          <textarea name="message" required rows="3" placeholder="What did you think?" className={fieldCls} />
          <button disabled={sent} className={`${btnPrimary} w-full gap-2 overflow-hidden`}>
            <span>{sent ? 'Sent' : 'Send comment'}</span>
            <motion.span className="flex" animate={sent ? { x: 100, opacity: 0 } : { x: 0, opacity: 1 }} transition={{ duration: 0.8, ease }}><FiSend /></motion.span>
          </button>
        </form>
      </div>
    </motion.article>
  )
}

export function VideosPage() {
  const { videos } = useStore()
  const list = [...videos].sort((a, b) => new Date(b.date) - new Date(a.date))
  return (
    <PageShell title="Live videos" intro="Finished pieces, recorded from first mark to final signature, with the story behind each one.">
      {list.length === 0 ? <p className="text-neutral-500">No videos yet. Check back soon.</p> : <div className="space-y-8">{list.map((v) => <VideoCard key={v.id} v={v} />)}</div>}
    </PageShell>
  )
}

/* ---------- Blog ---------- */
export function BlogPage() {
  const { posts } = useStore()
  const list = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date))
  return (
    <PageShell title="Blog" intro="Announcements, new releases and news from the studio.">
      {list.length === 0 ? <p className="text-neutral-500">No posts yet.</p> : (
        <div className="grid gap-6 md:grid-cols-2">
          {list.map((p, i) => (
            <motion.a key={p.id} href={`#/blog/${p.id}`} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease, delay: (i % 2) * 0.1 }}
              className="group overflow-hidden rounded-2xl border border-black/10 bg-paper-raised dark:border-white/10 dark:bg-night-raised">
              {p.cover && <div className="aspect-[16/9] overflow-hidden"><img src={p.cover} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /></div>}
              <div className="p-5">
                <p className="text-xs text-neutral-500">{fmtDate(p.date)}</p>
                <h2 className="mt-1 text-xl font-semibold">{p.title}</h2>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{p.caption}</p>
                <span className="mt-4 inline-block text-sm font-medium text-primary">Read more</span>
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </PageShell>
  )
}

export function PostPage({ id }) {
  const { posts } = useStore()
  const p = posts.find((x) => x.id === id)
  if (!p) return <PageShell title="Post not found"><a href="#/blog" className={btnGhost}>Back to blog</a></PageShell>
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-20 pt-28 sm:px-8">
      <a href="#/blog" className="text-sm text-neutral-500 hover:text-primary">&larr; All posts</a>
      <p className="mt-6 text-xs text-neutral-500">{fmtDate(p.date)}{p.updatedAt ? `, updated ${fmtDate(p.updatedAt)}` : ''}</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{p.title}</h1>
      {p.caption && <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">{p.caption}</p>}
      {p.cover && <img src={p.cover} alt="" className="mt-8 w-full rounded-2xl object-cover" />}
      <div className="mt-8 space-y-5 whitespace-pre-line leading-relaxed">{p.body}</div>
    </div>
  )
}

/* ---------- Privacy policy and terms ---------- */
export function LegalPage({ kind }) {
  const { settings } = useStore()
  const link = 'underline hover:text-primary'
  const privacy = [
    ['Who we are', `${settings.name} is an artist studio based in ${settings.location}. Contact us at ${settings.email}.`],
    ['What we collect', 'Details you give us: your name, email, phone number and delivery address when you place an order, and the messages and comments you send through our forms. We also store your theme choice and cart in your browser.'],
    ['How we use it', 'To process and deliver orders, reply to your messages, and run the site. We do not sell your personal information.'],
    ['Payments', 'Card payments are handled by Paystack. We never see or store your card details. Paystack\'s own privacy policy applies to the payment.'],
    ['Google services', 'This site loads fonts from Google Fonts, which means your browser contacts Google servers and your IP address is shared with Google. See the Google Privacy Policy at '],
    ['Your choices', `You can ask us to see, correct or delete your information by emailing ${settings.email}.`],
  ]
  const terms = [
    ['Using this site', 'By using this site you agree to these terms. If you do not agree, please do not use it.'],
    ['Artwork and copyright', 'All artwork, images, videos, music and text on this site belong to the artist. Buying a work or a print does not transfer copyright. You may not copy or reuse the content without written permission.'],
    ['Orders and payment', 'Prices are in Nigerian Naira. Originals are one of one and are held for you once an order is placed. An order is confirmed when payment is received. Shipping is charged at checkout.'],
    ['Commissions', 'Commissions require a deposit to begin. Timelines and final details are agreed in writing before work starts.'],
    ['Returns', 'Please contact us within 7 days of delivery if a piece arrives damaged. Custom commissions are not refundable once work has started.'],
    ['Comments and messages', 'Be respectful. We may remove content that is abusive or unlawful.'],
    ['Google services', 'Parts of this site use Google services such as Google Fonts. The Google Terms of Service apply to your use of those services: '],
    ['Changes', 'We may update these terms. Continued use of the site means you accept the updated terms.'],
  ]
  const sections = kind === 'privacy' ? privacy : terms
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-20 pt-28 sm:px-8">
      <h1 className="text-4xl font-semibold tracking-tight">{kind === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated {fmtDate(new Date())}</p>
      <div className="mt-8 space-y-6">
        {sections.map(([h, t]) => (
          <section key={h}>
            <h2 className="text-lg font-semibold">{h}</h2>
            <p className="mt-1 text-neutral-600 dark:text-neutral-300">
              {t}
              {h === 'Google services' && (kind === 'privacy'
                ? <a className={link} href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">policies.google.com/privacy</a>
                : <a className={link} href="https://policies.google.com/terms" target="_blank" rel="noreferrer">policies.google.com/terms</a>)}
              {h === 'Google services' && '.'}
            </p>
          </section>
        ))}
      </div>
    </div>
  )
}
