import { useState } from 'react'
import { FiMenu, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import { useStore, money } from './store'
import { uploadFile } from './api'
import { ThemeToggle } from './theme'

const input = 'w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20'
const btn = 'rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-ink hover:bg-primary-soft'
const btn2 = 'rounded-full border border-black/15 px-4 py-2 text-sm hover:border-primary dark:border-white/20'
const card = 'rounded-2xl border border-black/10 bg-paper-raised p-4 dark:border-white/10 dark:bg-night-raised'

const Field = ({ label, children }) => (
  <label className="block text-xs text-neutral-500">{label}<div className="mt-1 text-neutral-900 dark:text-neutral-100">{children}</div></label>
)

function UploadField({ label, accept, onDone }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const pick = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    setBusy(true); setErr('')
    try { onDone(await uploadFile(f)) } catch (x) { setErr(x.message) }
    setBusy(false)
    e.target.value = ''
  }
  return (
    <div className="text-xs text-neutral-500">
      {label}
      <input type="file" accept={accept} onChange={pick} className="mt-1 block text-xs" />
      {busy && <span>Uploading…</span>}
      {err && <span className="text-red-600">{err}</span>}
    </div>
  )
}

function ImageField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        {value && <img src={value} alt="" className="h-14 w-12 rounded object-cover" />}
        <div className="flex-1 space-y-1">
          <input className={input} placeholder="Image URL" value={value || ''} onChange={(e) => onChange(e.target.value)} />
          <UploadField label="" accept="image/jpeg,image/png,image/webp,image/gif" onDone={onChange} />
        </div>
      </div>
    </Field>
  )
}

function Login() {
  const { login } = useStore()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try { await login(email, pw) } catch (x) { setErr(x.message) }
    setBusy(false)
  }
  return (
    <form onSubmit={submit} className="mx-auto mt-32 w-full max-w-xs space-y-3 px-5">
      <h1 className="text-2xl font-semibold">Studio admin</h1>
      <input type="email" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={input} />
      <input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" className={input} />
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      <button disabled={busy} className={`${btn} w-full`}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  )
}

function PasswordAdmin() {
  const { changePassword } = useStore()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [err, setErr] = useState('')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setSaved(false)
    if (newPassword !== confirmPassword) {
      setErr('The new passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSaved(true)
    } catch (x) {
      setErr(x.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className={`${card} max-w-lg space-y-4`}>
      <div>
        <h2 className="font-medium">Change admin password</h2>
        <p className="mt-1 text-sm text-neutral-500">Enter your current password, then choose a new one with at least 10 characters.</p>
      </div>
      <Field label="Current password">
        <input type="password" autoComplete="current-password" required maxLength={200} className={input} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
      </Field>
      <Field label="New password">
        <input type="password" autoComplete="new-password" required minLength={10} maxLength={200} className={input} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      </Field>
      <Field label="Confirm new password">
        <input type="password" autoComplete="new-password" required minLength={10} maxLength={200} className={input} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
      </Field>
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      {saved && <p role="status" className="text-sm text-green-700 dark:text-green-400">Password changed. Use the new password the next time you sign in.</p>}
      <button disabled={busy} className={`${btn} disabled:opacity-60`}>{busy ? 'Changing password…' : 'Change password'}</button>
    </form>
  )
}

/* ---------- Overview ---------- */
function Overview() {
  const { orders, works, messages } = useStore()
  const revenue = orders.filter((o) => o.paid).reduce((n, o) => n + o.total, 0)
  const stats = [
    ['Revenue', money(revenue)], ['Orders', orders.length],
    ['Available works', works.filter((w) => w.collection === 'sale' && w.status === 'available').length], ['Unread messages', messages.filter((m) => !m.read).length],
  ]
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([l, v]) => <div key={l} className={card}><p className="text-xs text-neutral-500">{l}</p><p className="mt-1 text-2xl font-semibold">{v}</p></div>)}
      </div>
      <div className={card}>
        <h3 className="font-medium">Recent orders</h3>
        {orders.length === 0 ? <p className="mt-2 text-sm text-neutral-500">No orders yet. They'll show up here after checkout.</p> : (
          <ul className="mt-3 divide-y divide-black/10 text-sm dark:divide-white/10">
            {orders.slice(0, 5).map((o) => <li key={o.id} className="flex justify-between py-2"><span>{o.ref}, {o.customer.name}</span><span>{money(o.total)}, {o.status}</span></li>)}
          </ul>
        )}
      </div>
    </div>
  )
}

/* ---------- Artworks ---------- */
const blankWork = () => ({ title: '', medium: '', size: '', year: new Date().getFullYear(), price: 0, printPrice: 0, status: 'available', collection: 'sale', image: '' })

function Artworks() {
  const { works, saveWork, removeWork } = useStore()
  const [edit, setEdit] = useState(null)
  const [filter, setFilter] = useState('sale')
  const set = (k) => (e) => setEdit({ ...edit, [k]: e.target ? e.target.value : e })
  const save = async (e) => { e.preventDefault(); if (await saveWork({ ...edit, price: Number(edit.price), printPrice: Number(edit.printPrice), year: Number(edit.year) })) setEdit(null) }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {[['sale', 'For sale'], ['archive', 'Archive']].map(([id, l]) => <button key={id} onClick={() => setFilter(id)} className={filter === id ? btn : btn2}>{l}</button>)}
        </div>
        <button className={btn} onClick={() => setEdit({ ...blankWork(), collection: filter })}>Add artwork</button>
      </div>
      {edit && (
        <form onSubmit={save} className={`${card} grid gap-3 sm:grid-cols-2`}>
          <Field label="Title"><input required className={input} value={edit.title} onChange={set('title')} /></Field>
          <Field label="Medium"><input className={input} value={edit.medium} onChange={set('medium')} /></Field>
          <Field label="Size"><input className={input} value={edit.size || ''} onChange={set('size')} placeholder="60 x 80 cm" /></Field>
          <Field label="Year"><input type="number" className={input} value={edit.year || ''} onChange={set('year')} /></Field>
          <Field label="Collection">
            <select className={input} value={edit.collection} onChange={set('collection')}><option value="sale">For sale</option><option value="archive">Archive</option></select>
          </Field>
          <Field label="Status">
            <select className={input} value={edit.status || 'available'} onChange={set('status')}><option>available</option><option>reserved</option><option>sold</option></select>
          </Field>
          <Field label="Original price (NGN)"><input type="number" min="0" className={input} value={edit.price} onChange={set('price')} /></Field>
          <Field label="Print price (NGN, 0 for none)"><input type="number" min="0" className={input} value={edit.printPrice} onChange={set('printPrice')} /></Field>
          <div className="sm:col-span-2"><ImageField label="Image" value={edit.image} onChange={set('image')} /></div>
          <div className="flex gap-2 sm:col-span-2"><button className={btn}>Save artwork</button><button type="button" className={btn2} onClick={() => setEdit(null)}>Cancel</button></div>
        </form>
      )}
      <ul className="space-y-2">
        {works.filter((w) => w.collection === filter).map((w) => (
          <li key={w.id} className={`${card} flex items-center gap-3 !p-3`}>
            {w.image ? <img src={w.image} alt="" className="h-14 w-12 rounded object-cover" /> : <div aria-hidden="true" className="h-14 w-12 rounded bg-neutral-200 dark:bg-night" />}
            <div className="flex-1 text-sm"><p className="font-medium">{w.title}</p><p className="text-neutral-500">{w.collection === 'sale' ? `${money(w.price)}, ${w.status}` : w.year}</p></div>
            <button className="text-sm hover:text-primary" onClick={() => setEdit(w)}>Edit</button>
            <button className="text-sm text-red-600" onClick={() => confirm(`Delete "${w.title}"?`) && removeWork(w.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------- Orders ---------- */
function Orders() {
  const { orders, updateOrder } = useStore()
  if (!orders.length) return <p className="text-sm text-neutral-500">No orders yet. They'll show up here after checkout.</p>
  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={o.id} className={`${card} text-sm`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><p className="font-medium">{o.ref}</p><p className="text-neutral-500">{new Date(o.createdAt).toLocaleString('en-NG')}</p></div>
            <select aria-label="Order status" value={o.status} onChange={(e) => updateOrder(o.id, { status: e.target.value })} className="rounded-lg border border-black/15 bg-transparent px-2 py-1 dark:border-white/20">
              {['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map((s) => <option key={s} className="text-black">{s}</option>)}
            </select>
          </div>
          <p className="mt-2">{o.customer.name}, {o.customer.phone}, <a className="underline" href={`mailto:${o.customer.email}`}>{o.customer.email}</a></p>
          <p className="text-neutral-500">{o.customer.address}{o.customer.note ? `. Note: ${o.customer.note}` : ''}</p>
          <ul className="mt-2 text-neutral-600 dark:text-neutral-300">{o.items.map((i, n) => <li key={n}>{i.title}, {i.option} x{i.qty}, {money(i.price * i.qty)}</li>)}</ul>
          <p className="mt-2 font-medium">Total {money(o.total)} ({o.paid ? 'paid' : 'awaiting payment'})</p>
        </li>
      ))}
    </ul>
  )
}

/* ---------- Music ---------- */
function MusicAdmin() {
  const { tracks, saveTrack, removeTrack } = useStore()
  const [edit, setEdit] = useState(null)
  const set = (k) => (e) => setEdit({ ...edit, [k]: e.target ? e.target.value : e })
  return (
    <div className="space-y-4">
      <button className={btn} onClick={() => setEdit({ title: '', meta: '', length: '', src: '', cover: '' })}>Add track</button>
      {edit && (
        <form onSubmit={async (e) => { e.preventDefault(); if (await saveTrack(edit)) setEdit(null) }} className={`${card} grid gap-3 sm:grid-cols-2`}>
          <Field label="Title"><input required className={input} value={edit.title} onChange={set('title')} /></Field>
          <Field label="Release info"><input className={input} value={edit.meta} onChange={set('meta')} placeholder="Single, 2026" /></Field>
          <Field label="Length"><input className={input} value={edit.length} onChange={set('length')} placeholder="3:42" /></Field>
          <div className="space-y-2">
            <Field label="Audio URL (mp3)"><input className={input} value={edit.src} onChange={set('src')} /></Field>
            <UploadField label="Or upload an mp3" accept="audio/mpeg" onDone={(u) => set('src')(u)} />
          </div>
          <div className="sm:col-span-2"><ImageField label="Cover" value={edit.cover} onChange={set('cover')} /></div>
          <div className="flex gap-2 sm:col-span-2"><button className={btn}>Save track</button><button type="button" className={btn2} onClick={() => setEdit(null)}>Cancel</button></div>
        </form>
      )}
      <ul className="space-y-2">
        {tracks.map((t) => (
          <li key={t.id} className={`${card} flex items-center gap-3 !p-3`}>
            {t.cover ? <img src={t.cover} alt="" className="h-12 w-12 rounded object-cover" /> : <div aria-hidden="true" className="h-12 w-12 rounded bg-neutral-200 dark:bg-night" />}
            <div className="flex-1 text-sm"><p className="font-medium">{t.title}</p><p className="text-neutral-500">{t.meta}, {t.length}</p></div>
            <button className="text-sm hover:text-primary" onClick={() => setEdit(t)}>Edit</button>
            <button className="text-sm text-red-600" onClick={() => confirm(`Delete "${t.title}"?`) && removeTrack(t.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------- Site settings ---------- */
function SettingsAdmin() {
  const { settings, saveSettings } = useStore()
  const [s, setS] = useState(settings)
  const [saved, setSaved] = useState(false)
  const set = (k) => (e) => { setSaved(false); setS({ ...s, [k]: e.target ? e.target.value : e }) }
  const heroImages = s.heroImages || []
  const setHeroImage = (index, url) => {
    setSaved(false)
    setS((current) => ({ ...current, heroImages: (current.heroImages || []).map((image, i) => i === index ? url : image) }))
  }
  const addHeroImage = () => {
    if (heroImages.length >= 9) return
    setSaved(false)
    setS((current) => ({ ...current, heroImages: [...(current.heroImages || []), ''] }))
  }
  const removeHeroImage = (index) => {
    setSaved(false)
    setS((current) => ({ ...current, heroImages: (current.heroImages || []).filter((_, i) => i !== index) }))
  }
  return (
    <form onSubmit={async (e) => { e.preventDefault(); if (await saveSettings({ ...s, shippingFee: Number(s.shippingFee), heroImages: (s.heroImages || []).map((u) => u.trim()).filter(Boolean).slice(0, 9) })) setSaved(true) }} className={`${card} grid gap-3 sm:grid-cols-2`}>
      <Field label="Artist name"><input className={input} value={s.name} onChange={set('name')} /></Field>
      <Field label="Location"><input className={input} value={s.location} onChange={set('location')} /></Field>
      <div className="sm:col-span-2"><Field label="Hero headline (separate the three lines with | )"><input className={input} value={s.headline} onChange={set('headline')} /></Field></div>
      <Field label="Contact email"><input type="email" className={input} value={s.email} onChange={set('email')} /></Field>
      <Field label="Flat shipping fee (NGN)"><input type="number" min="0" className={input} value={s.shippingFee} onChange={set('shippingFee')} /></Field>
      <div className="sm:col-span-2"><Field label="Bio"><textarea rows="4" className={input} value={s.bio} onChange={set('bio')} /></Field></div>
      <div className="space-y-3 sm:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs text-neutral-500">Hero slider images</h3>
            <p className="mt-1 text-xs text-neutral-500">Paste an image link or upload a photo. Slides change every 6 seconds; up to 9 images.</p>
          </div>
          <button type="button" onClick={addHeroImage} disabled={heroImages.length >= 9} aria-label="Add hero slide" title="Add hero slide" className="flex h-9 w-9 items-center justify-center rounded-full border border-black/15 text-lg hover:border-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/20">
            <FiPlus />
          </button>
        </div>
        <div className="space-y-3">
          {heroImages.map((url, index) => (
            <div key={index} className={`${card} grid gap-3 !p-3 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-center`}>
              {url ? <img src={url} alt={`Hero slide ${index + 1} preview`} className="h-20 w-20 rounded-lg bg-neutral-200 object-cover dark:bg-night" /> : <div className="grid h-20 w-20 place-items-center rounded-lg bg-neutral-100 text-xs text-neutral-400 dark:bg-night">Slide {index + 1}</div>}
              <div className="min-w-0 space-y-2">
                <Field label={`Slide ${index + 1} image link`}>
                  <input className={input} value={url || ''} onChange={(e) => setHeroImage(index, e.target.value)} placeholder="Paste an image URL" />
                </Field>
                <UploadField label="Or upload an image file" accept="image/jpeg,image/png,image/webp,image/gif" onDone={(uploadedUrl) => setHeroImage(index, uploadedUrl)} />
              </div>
              <button type="button" onClick={() => removeHeroImage(index)} aria-label={`Remove hero slide ${index + 1}`} title="Remove slide" className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-red-600 hover:bg-red-500/10 sm:justify-self-end">
                <FiTrash2 />
              </button>
            </div>
          ))}
          {heroImages.length === 0 && <p className="rounded-xl border border-dashed border-black/20 p-4 text-sm text-neutral-500 dark:border-white/20">No hero slides yet. Add a direct image link or upload a photo; a neutral placeholder will show until then.</p>}
        </div>
      </div>
      <ImageField label="About image" value={s.aboutImage} onChange={set('aboutImage')} />
      <Field label="Instagram link"><input className={input} value={s.instagram} onChange={set('instagram')} /></Field>
      <Field label="Facebook link"><input className={input} value={s.facebook} onChange={set('facebook')} /></Field>
      <Field label="WhatsApp link (https://wa.me/234...)"><input className={input} value={s.whatsapp} onChange={set('whatsapp')} /></Field>
      <Field label="Twitter link"><input className={input} value={s.twitter} onChange={set('twitter')} /></Field>
      <div className="flex items-center gap-3 sm:col-span-2"><button className={btn}>Save settings</button>{saved && <span className="text-sm text-neutral-500">Saved</span>}</div>
    </form>
  )
}

/* ---------- Live videos ---------- */
const today = () => new Date().toISOString().slice(0, 10)

function VideosAdmin() {
  const { videos, saveVideo, removeVideo } = useStore()
  const [edit, setEdit] = useState(null)
  const set = (k) => (e) => setEdit({ ...edit, [k]: e.target ? e.target.value : e })
  return (
    <div className="space-y-4">
      <button className={btn} onClick={() => setEdit({ title: '', date: today(), src: '', poster: '', description: '', story: '' })}>Add video</button>
      {edit && (
        <form onSubmit={async (e) => { e.preventDefault(); if (await saveVideo(edit)) setEdit(null) }} className={`${card} grid gap-3 sm:grid-cols-2`}>
          <Field label="Title"><input required className={input} value={edit.title} onChange={set('title')} /></Field>
          <Field label="Date uploaded"><input type="date" required className={input} value={edit.date} onChange={set('date')} /></Field>
          <div className="space-y-2 sm:col-span-2">
            <Field label="Video link (mp4 URL, YouTube or Vimeo)"><input required className={input} value={edit.src} onChange={set('src')} placeholder="https://" /></Field>
            <UploadField label="Or upload a video file (mp4 or webm, up to 200 MB). The link above fills in automatically." accept="video/mp4,video/webm" onDone={(u) => set('src')(u)} />
          </div>
          <div className="sm:col-span-2"><ImageField label="Poster image" value={edit.poster} onChange={set('poster')} /></div>
          <div className="sm:col-span-2"><Field label="Description"><textarea rows="3" className={input} value={edit.description} onChange={set('description')} /></Field></div>
          <div className="sm:col-span-2"><Field label="The story behind it"><textarea rows="4" className={input} value={edit.story} onChange={set('story')} /></Field></div>
          <div className="flex gap-2 sm:col-span-2"><button className={btn}>Save video</button><button type="button" className={btn2} onClick={() => setEdit(null)}>Cancel</button></div>
        </form>
      )}
      <ul className="space-y-2">
        {[...videos].sort((a, b) => new Date(b.date) - new Date(a.date)).map((v) => (
          <li key={v.id} className={`${card} flex items-center gap-3 !p-3`}>
            {v.poster && <img src={v.poster} alt="" className="h-12 w-20 rounded object-cover" />}
            <div className="flex-1 text-sm"><p className="font-medium">{v.title}</p><p className="text-neutral-500">{v.date}, {v.likes || 0} likes, {v.loves || 0} loves</p></div>
            <button className="text-sm hover:text-primary" onClick={() => setEdit(v)}>Edit</button>
            <button className="text-sm text-red-600" onClick={() => confirm(`Delete "${v.title}"?`) && removeVideo(v.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------- Blog ---------- */
function BlogAdmin() {
  const { posts, savePost, removePost } = useStore()
  const [edit, setEdit] = useState(null)
  const set = (k) => (e) => setEdit({ ...edit, [k]: e.target ? e.target.value : e })
  return (
    <div className="space-y-4">
      <button className={btn} onClick={() => setEdit({ title: '', caption: '', cover: '', date: today(), body: '' })}>New post</button>
      {edit && (
        <form onSubmit={async (e) => { e.preventDefault(); if (await savePost({ ...edit, updatedAt: edit.id ? new Date().toISOString() : null })) setEdit(null) }} className={`${card} grid gap-3`}>
          <Field label="Title"><input required className={input} value={edit.title} onChange={set('title')} /></Field>
          <Field label="Caption (short summary shown on the blog list)"><input className={input} value={edit.caption} onChange={set('caption')} /></Field>
          <Field label="Date"><input type="date" required className={input} value={edit.date} onChange={set('date')} /></Field>
          <ImageField label="Cover image" value={edit.cover} onChange={set('cover')} />
          <Field label="Full description (blank line between paragraphs)"><textarea required rows="12" className={input} value={edit.body} onChange={set('body')} /></Field>
          <div className="flex gap-2"><button className={btn}>{edit.id ? 'Update post' : 'Publish post'}</button><button type="button" className={btn2} onClick={() => setEdit(null)}>Cancel</button></div>
        </form>
      )}
      <ul className="space-y-2">
        {[...posts].sort((a, b) => new Date(b.date) - new Date(a.date)).map((p) => (
          <li key={p.id} className={`${card} flex items-center gap-3 !p-3`}>
            {p.cover && <img src={p.cover} alt="" className="h-12 w-20 rounded object-cover" />}
            <div className="flex-1 text-sm"><p className="font-medium">{p.title}</p><p className="text-neutral-500">{p.date}{p.updatedAt ? ', edited' : ''}</p></div>
            <button className="text-sm hover:text-primary" onClick={() => setEdit(p)}>Edit</button>
            <button className="text-sm text-red-600" onClick={() => confirm(`Delete "${p.title}"?`) && removePost(p.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------- Inbox: contact messages and video comments ---------- */
function Inbox() {
  const { messages, markMessage, removeMessage } = useStore()
  if (!messages.length) return <p className="text-sm text-neutral-500">No messages yet. Contact form messages and video comments will appear here.</p>
  return (
    <ul className="space-y-3">
      {messages.map((m) => (
        <li key={m.id} className={`${card} text-sm ${m.read ? 'opacity-70' : ''}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{m.name}{m.email ? `, ${m.email}` : ''}</p>
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs">{m.type === 'comment' ? `Comment on "${m.videoTitle}"` : 'Contact form'}</span>
          </div>
          <p className="mt-2 whitespace-pre-line">{m.message}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
            <span>{new Date(m.createdAt).toLocaleString('en-NG')}</span>
            <button className="underline" onClick={() => markMessage(m.id, !m.read)}>{m.read ? 'Mark unread' : 'Mark read'}</button>
            {m.email && <a className="underline" href={`mailto:${m.email}`}>Reply</a>}
            <button className="text-red-600 underline" onClick={() => removeMessage(m.id)}>Delete</button>
          </div>
        </li>
      ))}
    </ul>
  )
}

const tabs = [['overview', 'Overview', Overview], ['artworks', 'Artworks', Artworks], ['orders', 'Orders', Orders], ['videos', 'Videos', VideosAdmin], ['blog', 'Blog', BlogAdmin], ['inbox', 'Inbox', Inbox], ['music', 'Music', MusicAdmin], ['settings', 'Site', SettingsAdmin], ['password', 'Password', PasswordAdmin]]

export default function Admin() {
  const { isAdmin, logout } = useStore()
  const [tab, setTab] = useState('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  if (!isAdmin) return <Login />
  const Active = tabs.find((t) => t[0] === tab)[2]
  const chooseTab = (id) => { setTab(id); setMenuOpen(false) }
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Studio admin</h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Close admin menu' : 'Open admin menu'} aria-expanded={menuOpen} className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-xl hover:border-primary dark:border-white/20 md:hidden">
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
          <a href="#top" onClick={() => (location.hash = '')} className="text-sm hover:text-primary">View site</a>
          <button className="text-sm text-neutral-500" onClick={logout}>Sign out</button>
        </div>
      </header>
      <nav className="mt-5 hidden gap-2 overflow-x-auto pb-1 md:flex" aria-label="Admin dashboard">
        {tabs.map(([id, l]) => <button key={id} onClick={() => chooseTab(id)} className={tab === id ? btn : btn2}>{l}</button>)}
      </nav>
      {menuOpen && (
        <nav className="mt-4 flex flex-col gap-2 rounded-2xl border border-black/10 bg-paper-raised p-3 shadow-lg dark:border-white/10 dark:bg-night-raised md:hidden" aria-label="Admin dashboard">
          {tabs.map(([id, l]) => <button key={id} onClick={() => chooseTab(id)} className={`${tab === id ? btn : btn2} w-full text-left`}>{l}</button>)}
        </nav>
      )}
      <main className="mt-6"><Active /></main>
    </div>
  )
}
