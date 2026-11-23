import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from './api'

export const money = (n) => '₦' + Number(n || 0).toLocaleString('en-NG')
const read = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback } catch { return fallback } }
const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

function SiteLoadingSkeleton() {
  const block = 'animate-pulse rounded-lg bg-neutral-200 dark:bg-white/10'
  return (
    <div role="status" aria-label="Loading website" className="min-h-svh overflow-hidden bg-paper text-neutral-900 dark:bg-night dark:text-neutral-100">
      <span className="sr-only">Loading website content…</span>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-black/10 bg-paper/90 backdrop-blur dark:border-white/10 dark:bg-night/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <div className="flex items-center gap-2">
            <div aria-hidden="true" className={`${block} h-9 w-9 rounded-full`} />
            <div aria-hidden="true" className={`${block} h-4 w-28`} />
          </div>
          <nav aria-hidden="true" className="hidden items-center gap-4 lg:flex">
            {[14, 12, 16, 12, 16, 14].map((width, i) => <div key={i} className={`${block} h-3`} style={{ width: `${width * 4}px` }} />)}
          </nav>
          <div aria-hidden="true" className="flex items-center gap-2">
            <div className={`${block} h-10 w-10 rounded-full`} />
            <div className={`${block} h-10 w-10 rounded-full`} />
            <div className={`${block} h-10 w-10 rounded-full lg:hidden`} />
          </div>
        </div>
      </header>

      <main className="pt-16">
        <section className="mx-auto grid min-h-[78svh] max-w-6xl items-center gap-6 px-5 py-10 sm:px-8 md:grid-cols-12 md:gap-10">
          <div className="space-y-4 md:col-span-7">
            <div aria-hidden="true" className={`${block} h-4 w-28`} />
            <div aria-hidden="true" className={`${block} h-10 w-11/12 sm:h-14`} />
            <div aria-hidden="true" className={`${block} h-10 w-3/4 sm:h-14`} />
            <div className="space-y-2 pt-2">
              <div aria-hidden="true" className={`${block} h-3 w-full max-w-md`} />
              <div aria-hidden="true" className={`${block} h-3 w-4/5 max-w-sm`} />
            </div>
            <div className="flex gap-3 pt-2">
              <div aria-hidden="true" className={`${block} h-11 w-32 rounded-full bg-primary/25 dark:bg-primary/20`} />
              <div aria-hidden="true" className={`${block} h-11 w-32 rounded-full`} />
            </div>
          </div>
          <div aria-hidden="true" className={`${block} aspect-[4/3] w-full md:col-span-5 md:aspect-[4/5]`} />
        </section>

        <div aria-hidden="true" className="overflow-hidden bg-primary/70 py-3 dark:bg-primary/35">
          <div className="mx-auto flex max-w-6xl gap-8 px-5">
            {[24, 16, 20, 14, 22].map((width, i) => <div key={i} className="h-5 shrink-0 rounded bg-primary-ink/15" style={{ width: `${width * 4}px` }} />)}
          </div>
        </div>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div aria-hidden="true" className={`${block} h-8 w-48`} />
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <div aria-hidden="true" className={`${block} aspect-[4/5] w-full rounded-2xl`} />
                <div aria-hidden="true" className={`${block} mt-3 h-4 w-2/3`} />
                <div aria-hidden="true" className={`${block} mt-2 h-3 w-1/3`} />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

// Everything is loaded from and saved to the NestJS API. Only the cart and the visitor's own
// likes/loves stay in the browser.
export function StoreProvider({ children }) {
  const [pub, setPub] = useState(null)
  const [err, setErr] = useState('')
  const [adminData, setAdminData] = useState({ orders: [], messages: [] })
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [isAdmin, setIsAdmin] = useState(Boolean(getToken()))
  const [cart, setCart] = useState(() => read('artist-cart-v1', []))
  const [reacted, setReacted] = useState(() => read('artist-reacted-v1', []))

  const loadPublic = useCallback(async () => {
    try { setPub(await api('/public')); setErr('') } catch (e) { setErr(e.message) }
  }, [])
  const loadAdmin = useCallback(async () => {
    setAdminLoading(true)
    setAdminError('')
    try {
      const [orders, messages] = await Promise.all([api('/orders'), api('/messages')])
      setAdminData({ orders, messages })
    } catch (e) {
      setAdminError(e.message)
      throw e
    } finally {
      setAdminLoading(false)
    }
  }, [])
  const logout = useCallback(() => { setToken(null); setIsAdmin(false); setAdminData({ orders: [], messages: [] }); setAdminError('') }, [])
  const refreshAdmin = useCallback(() => loadAdmin().catch(() => {}), [loadAdmin])

  useEffect(() => { loadPublic() }, [loadPublic])
  useEffect(() => { if (isAdmin) loadAdmin().catch(() => {}) }, [isAdmin, loadAdmin])
  useEffect(() => { window.addEventListener('auth-expired', logout); return () => window.removeEventListener('auth-expired', logout) }, [logout])
  useEffect(() => localStorage.setItem('artist-cart-v1', JSON.stringify(cart)), [cart])
  useEffect(() => localStorage.setItem('artist-reacted-v1', JSON.stringify(reacted)), [reacted])

  if (!pub) {
    if (err) {
      return (
        <div className="grid min-h-svh place-items-center p-6 text-center">
          <div className="max-w-sm space-y-3">
            <p className="font-medium">The site could not load.</p>
            <p className="text-sm text-neutral-500">{err}</p>
            <button onClick={loadPublic} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-ink">Try again</button>
          </div>
        </div>
      )
    }
    return <SiteLoadingSkeleton />
  }

  // Shows the server's error message and returns undefined when something fails.
  const run = async (fn) => { try { return await fn() } catch (e) { alert(e.message) } }
  const saver = (path) => (item) => run(async () => {
    const saved = item.id ? await api(`${path}/${item.id}`, { method: 'PUT', body: item }) : await api(path, { method: 'POST', body: item })
    await loadPublic()
    return saved
  })
  const remover = (path) => (id) => run(async () => { await api(`${path}/${id}`, { method: 'DELETE' }); await loadPublic() })

  const cartLines = cart
    .map((c) => {
      const work = pub.works.find((w) => w.id === c.workId)
      if (!work) return null
      const price = c.option === 'Original' ? work.price : work.printPrice || 0
      return { ...c, work, price, unavailable: c.option === 'Original' && work.status !== 'available' }
    })
    .filter(Boolean)
  const subtotal = cartLines.reduce((n, l) => n + l.price * l.qty, 0)

  const value = {
    works: pub.works, tracks: pub.tracks, videos: pub.videos, posts: pub.posts, settings: pub.settings,
    orders: adminData.orders, messages: adminData.messages, adminLoading, adminError, refreshAdmin,
    cart, cartLines, subtotal, reacted, isAdmin,

    login: async (email, password) => {
      const { token } = await api('/auth/login', { method: 'POST', body: { email, password } })
      setToken(token)
      setIsAdmin(true)
    },
    changePassword: (currentPassword, newPassword) =>
      api('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } }),
    logout,

    saveWork: saver('/works'), removeWork: remover('/works'),
    saveTrack: saver('/tracks'), removeTrack: remover('/tracks'),
    saveVideo: saver('/videos'), removeVideo: remover('/videos'),
    savePost: saver('/posts'), removePost: remover('/posts'),
    saveSettings: (s) => run(async () => { const saved = await api('/settings', { method: 'PUT', body: s }); await loadPublic(); return saved }),

    addToCart: (work, option) =>
      setCart((c) => (c.some((x) => x.workId === work.id && x.option === option) ? c : [...c, { key: work.id + option, workId: work.id, option, qty: 1 }])),
    removeFromCart: (key) => setCart((c) => c.filter((x) => x.key !== key)),
    setQty: (key, qty) => setCart((c) => c.map((x) => (x.key === key ? { ...x, qty: Math.min(20, Math.max(1, qty)) } : x))),

    // The server recalculates prices and checks stock. It returns { order, authorizationUrl }.
    placeOrder: async ({ customer }) => {
      const res = await api('/orders', { method: 'POST', body: { customer, items: cart.map((c) => ({ workId: c.workId, option: c.option, qty: c.qty })) } })
      setCart([])
      loadPublic()
      return res
    },
    updateOrder: (id, patch) => run(async () => { await api('/orders/' + id, { method: 'PATCH', body: { status: patch.status } }); await Promise.all([loadAdmin(), loadPublic()]) }),

    react: async (videoId, kind) => {
      const key = videoId + ':' + kind
      const has = reacted.includes(key)
      const delta = has ? -1 : 1
      setReacted((r) => (has ? r.filter((k) => k !== key) : [...r, key]))
      setPub((p) => ({ ...p, videos: p.videos.map((v) => (v.id === videoId ? { ...v, [kind]: Math.max(0, (v[kind] || 0) + delta) } : v)) }))
      try {
        await api(`/videos/${videoId}/react`, { method: 'POST', body: { kind, delta } })
      } catch (e) {
        setReacted((r) => (has ? [...r, key] : r.filter((k) => k !== key)))
        setPub((p) => ({ ...p, videos: p.videos.map((v) => (v.id === videoId ? { ...v, [kind]: Math.max(0, (v[kind] || 0) - delta) } : v)) }))
        alert(e.message)
      }
    },

    sendMessage: (m) => run(async () => { await api('/messages', { method: 'POST', body: m }); return true }),
    markMessage: (id, read) => run(async () => { await api('/messages/' + id, { method: 'PATCH', body: { read } }); await loadAdmin() }),
    removeMessage: (id) => run(async () => { await api('/messages/' + id, { method: 'DELETE' }); await loadAdmin() }),
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
