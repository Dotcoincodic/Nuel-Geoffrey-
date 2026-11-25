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

        <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 sm:px-8 md:grid-cols-2 md:gap-12">
          <div className="space-y-4">
            <div aria-hidden="true" className={`${block} h-4 w-28`} />
            <div aria-hidden="true" className={`${block} h-8 w-4/5`} />
            <div aria-hidden="true" className={`${block} h-3 w-full max-w-lg`} />
            <div aria-hidden="true" className={`${block} h-3 w-5/6 max-w-md`} />
            <div aria-hidden="true" className={`${block} h-11 w-36 rounded-full`} />
          </div>
          <div aria-hidden="true" className={`${block} aspect-[4/3] w-full rounded-2xl`} />
        </section>

        <section className="bg-neutral-100 dark:bg-night-raised">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-3">
                <div aria-hidden="true" className={`${block} h-8 w-40`} />
                <div aria-hidden="true" className={`${block} h-3 w-64 max-w-full`} />
              </div>
              <div aria-hidden="true" className={`${block} h-10 w-10 rounded-full`} />
            </div>
            <div className="mt-8 divide-y divide-black/10 dark:divide-white/10">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 py-4">
                  <div aria-hidden="true" className={`${block} h-14 w-14 shrink-0 rounded-xl`} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div aria-hidden="true" className={`${block} h-4 w-2/3`} />
                    <div aria-hidden="true" className={`${block} h-3 w-1/3`} />
                  </div>
                  <div aria-hidden="true" className={`${block} h-9 w-9 rounded-full`} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 sm:px-8 md:grid-cols-2 md:gap-12">
          <div aria-hidden="true" className={`${block} mx-auto aspect-[4/5] w-full max-w-md rounded-[2rem]`} />
          <div className="space-y-4">
            <div aria-hidden="true" className={`${block} h-8 w-40`} />
            <div aria-hidden="true" className={`${block} h-3 w-full`} />
            <div aria-hidden="true" className={`${block} h-3 w-full`} />
            <div aria-hidden="true" className={`${block} h-3 w-5/6`} />
            <div aria-hidden="true" className={`${block} h-11 w-48 rounded-full`} />
          </div>
        </section>

        <section className="bg-neutral-100 dark:bg-night-raised">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-8 md:grid-cols-2 md:gap-12">
            <div className="space-y-4">
              <div aria-hidden="true" className={`${block} h-8 w-44`} />
              <div aria-hidden="true" className={`${block} h-3 w-full max-w-sm`} />
              <div aria-hidden="true" className={`${block} h-3 w-4/5 max-w-sm`} />
              <div className="space-y-3 pt-3">
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div aria-hidden="true" className={`${block} h-10 w-10 rounded-full`} />
                    <div className="space-y-2">
                      <div aria-hidden="true" className={`${block} h-3 w-24`} />
                      <div aria-hidden="true" className={`${block} h-3 w-36`} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                {[0, 1, 2, 3].map((i) => <div key={i} aria-hidden="true" className={`${block} h-9 w-9 rounded-full`} />)}
              </div>
            </div>
            <div className="space-y-4 rounded-3xl bg-paper p-6 shadow-sm dark:bg-night sm:p-8">
              <div aria-hidden="true" className={`${block} h-7 w-52`} />
              <div aria-hidden="true" className={`${block} h-11 w-full rounded-xl`} />
              <div aria-hidden="true" className={`${block} h-11 w-full rounded-xl`} />
              <div aria-hidden="true" className={`${block} h-28 w-full rounded-xl`} />
              <div aria-hidden="true" className={`${block} ml-auto h-11 w-36 rounded-full`} />
            </div>
          </div>
        </section>
      </main>

      <footer aria-hidden="true" className="bg-neutral-950 px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
            <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
          </div>
          <div className="flex gap-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-3 w-14 animate-pulse rounded bg-white/10" />)}
          </div>
        </div>
      </footer>
    </div>
  )
}

function AdminLoginLoadingSkeleton() {
  const block = 'animate-pulse rounded-lg bg-white/10'
  return (
    <main role="status" aria-label="Loading admin sign-in" className="grid min-h-svh place-items-center overflow-hidden bg-[#111113] px-5 py-10 text-white">
      <span className="sr-only">Loading admin sign-in…</span>
      <div className="relative isolate w-full max-w-md overflow-hidden rounded-[2rem] border border-white/25 bg-white/[0.035] px-6 py-10 shadow-[0_28px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:px-10 sm:py-12">
        <div aria-hidden="true" className="pointer-events-none absolute -left-12 -top-12 -z-10 h-44 w-56 rounded-full bg-rose-400/25 blur-[65px]" />
        <div aria-hidden="true" className="mx-auto mb-3 h-3 w-24 animate-pulse rounded bg-rose-200/20" />
        <div aria-hidden="true" className="mx-auto h-10 w-56 max-w-full animate-pulse rounded bg-white/10" />
        <div aria-hidden="true" className="mx-auto mt-3 h-4 w-48 max-w-full animate-pulse rounded bg-white/10" />

        <div className="mt-8 space-y-4">
          <div aria-hidden="true" className={`${block} h-[4.25rem] w-full rounded-full`} />
          <div aria-hidden="true" className={`${block} relative h-[4.25rem] w-full rounded-full`}>
            <span className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 animate-pulse rounded-full bg-amber-500/40" />
          </div>
        </div>

        <div className="my-8 flex items-center gap-4" aria-hidden="true">
          <span className="h-px flex-1 bg-white/10" />
          <span className={`${block} h-3 w-24`} />
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <div aria-hidden="true" className="mx-auto h-3 w-4/5 max-w-xs animate-pulse rounded bg-white/10" />
      </div>
    </main>
  )
}

function AdminDashboardLoadingSkeleton() {
  const block = 'animate-pulse rounded-lg bg-neutral-200 dark:bg-white/10'
  return (
    <div role="status" aria-label="Loading admin dashboard" className="min-h-svh bg-paper text-neutral-900 dark:bg-night dark:text-neutral-100">
      <span className="sr-only">Loading admin dashboard…</span>
      <div className="mx-auto flex max-w-7xl gap-6 px-5 py-6 sm:px-8">
        <aside aria-hidden="true" className="hidden w-56 shrink-0 space-y-3 lg:block">
          <div className={`${block} h-10 w-40`} />
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className={`${block} h-10 w-full rounded-xl`} />)}
        </aside>
        <main className="min-w-0 flex-1 space-y-4">
          <div aria-hidden="true" className={`${block} h-10 w-56`} />
          <div aria-hidden="true" className={`${block} h-24 w-full rounded-2xl`} />
          <div aria-hidden="true" className={`${block} h-64 w-full rounded-2xl`} />
        </main>
      </div>
    </div>
  )
}

function SubpageLoadingSkeleton({ page }) {
  const block = 'animate-pulse rounded-lg bg-neutral-200 dark:bg-white/10'
  const title = page === 'videos' ? 'Videos' : page === 'blog' ? 'Blog' : page === 'post' ? 'Article' : page === 'privacy' ? 'Privacy policy' : page === 'terms' ? 'Terms of service' : 'Page'
  return (
    <div role="status" aria-label={`Loading ${title.toLowerCase()} page`} className="min-h-svh overflow-hidden bg-paper text-neutral-900 dark:bg-night dark:text-neutral-100">
      <span className="sr-only">Loading {title.toLowerCase()} page…</span>
      <header aria-hidden="true" className="fixed inset-x-0 top-0 z-40 border-b border-black/10 bg-paper/90 backdrop-blur dark:border-white/10 dark:bg-night/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <div className="flex items-center gap-2">
            <div className={`${block} h-9 w-9 rounded-full`} />
            <div className={`${block} h-4 w-28`} />
          </div>
          <nav className="hidden items-center gap-4 lg:flex">
            {[14, 12, 16, 12, 16, 14].map((width, i) => <div key={i} className={`${block} h-3`} style={{ width: `${width * 4}px` }} />)}
          </nav>
          <div className="flex items-center gap-2">
            <div className={`${block} h-10 w-10 rounded-full`} />
            <div className={`${block} h-10 w-10 rounded-full`} />
            <div className={`${block} h-10 w-10 rounded-full lg:hidden`} />
          </div>
        </div>
      </header>

      <main className="mx-auto min-h-[70svh] max-w-6xl px-5 pb-20 pt-28 sm:px-8">
        {(page === 'videos' || page === 'blog') && (
          <>
            <div aria-hidden="true" className={`${block} h-10 w-56 max-w-full sm:h-12`} />
            <div aria-hidden="true" className={`${block} mt-3 h-4 w-full max-w-xl`} />
            <div aria-hidden="true" className={`${block} mt-2 h-4 w-4/5 max-w-lg`} />
          </>
        )}

        {page === 'videos' && (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-black/10 bg-paper-raised dark:border-white/10 dark:bg-night-raised">
                <div aria-hidden="true" className={`${block} aspect-video rounded-none`} />
                <div className="space-y-3 p-4 sm:p-5">
                  <div aria-hidden="true" className={`${block} h-3 w-28`} />
                  <div aria-hidden="true" className={`${block} h-5 w-4/5`} />
                  <div aria-hidden="true" className={`${block} h-3 w-full`} />
                  <div aria-hidden="true" className={`${block} h-3 w-2/3`} />
                </div>
              </div>
            ))}
          </div>
        )}

        {page === 'blog' && (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-black/10 bg-paper-raised dark:border-white/10 dark:bg-night-raised">
                <div aria-hidden="true" className={`${block} aspect-[16/9] rounded-none`} />
                <div className="space-y-3 p-5">
                  <div aria-hidden="true" className={`${block} h-3 w-28`} />
                  <div aria-hidden="true" className={`${block} h-6 w-3/4`} />
                  <div aria-hidden="true" className={`${block} h-3 w-full`} />
                  <div aria-hidden="true" className={`${block} h-3 w-4/5`} />
                  <div aria-hidden="true" className={`${block} h-4 w-24`} />
                </div>
              </div>
            ))}
          </div>
        )}

        {page === 'post' && (
          <article className="mx-auto mt-8 max-w-3xl">
            <div aria-hidden="true" className={`${block} h-4 w-24`} />
            <div aria-hidden="true" className={`${block} mt-6 h-3 w-32`} />
            <div aria-hidden="true" className={`${block} mt-3 h-10 w-full sm:h-12`} />
            <div aria-hidden="true" className={`${block} mt-3 h-5 w-4/5`} />
            <div aria-hidden="true" className={`${block} mt-8 aspect-[16/9] w-full rounded-2xl`} />
            <div className="mt-8 space-y-3">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => <div key={i} aria-hidden="true" className={`${block} h-4 ${i % 3 === 2 ? 'w-4/5' : 'w-full'}`} />)}
            </div>
          </article>
        )}

        {(page === 'privacy' || page === 'terms') && (
          <div className="mx-auto max-w-3xl">
            <div aria-hidden="true" className={`${block} h-10 w-64 max-w-full sm:h-12`} />
            <div aria-hidden="true" className={`${block} mt-2 h-3 w-32`} />
            <div className="mt-8 space-y-7">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <section key={i} className="space-y-3">
                  <div aria-hidden="true" className={`${block} h-5 w-48`} />
                  <div aria-hidden="true" className={`${block} h-3 w-full`} />
                  <div aria-hidden="true" className={`${block} h-3 w-full`} />
                  <div aria-hidden="true" className={`${block} h-3 w-4/5`} />
                </section>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer aria-hidden="true" className="bg-neutral-950 px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
            <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
          </div>
          <div className="flex gap-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-3 w-14 animate-pulse rounded bg-white/10" />)}
          </div>
        </div>
      </footer>
    </div>
  )
}

function CurrentPageLoadingSkeleton() {
  const hash = window.location.hash
  if (hash.startsWith('#/admin')) return getToken() ? <AdminDashboardLoadingSkeleton /> : <AdminLoginLoadingSkeleton />
  if (hash === '#/videos') return <SubpageLoadingSkeleton page="videos" />
  if (hash === '#/blog') return <SubpageLoadingSkeleton page="blog" />
  if (hash.startsWith('#/blog/')) return <SubpageLoadingSkeleton page="post" />
  if (hash === '#/privacy') return <SubpageLoadingSkeleton page="privacy" />
  if (hash === '#/terms') return <SubpageLoadingSkeleton page="terms" />
  return <SiteLoadingSkeleton />
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
    return <CurrentPageLoadingSkeleton />
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
