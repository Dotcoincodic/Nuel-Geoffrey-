import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from './api'

export const money = (n) => '₦' + Number(n || 0).toLocaleString('en-NG')
const read = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback } catch { return fallback } }
const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

// Everything is loaded from and saved to the NestJS API. Only the cart and the visitor's own
// likes/loves stay in the browser.
export function StoreProvider({ children }) {
  const [pub, setPub] = useState(null)
  const [err, setErr] = useState('')
  const [adminData, setAdminData] = useState({ orders: [], messages: [] })
  const [isAdmin, setIsAdmin] = useState(Boolean(getToken()))
  const [cart, setCart] = useState(() => read('artist-cart-v1', []))
  const [reacted, setReacted] = useState(() => read('artist-reacted-v1', []))

  const loadPublic = useCallback(async () => {
    try { setPub(await api('/public')); setErr('') } catch (e) { setErr(e.message) }
  }, [])
  const loadAdmin = useCallback(async () => {
    const [orders, messages] = await Promise.all([api('/orders'), api('/messages')])
    setAdminData({ orders, messages })
  }, [])
  const logout = useCallback(() => { setToken(null); setIsAdmin(false); setAdminData({ orders: [], messages: [] }) }, [])

  useEffect(() => { loadPublic() }, [loadPublic])
  useEffect(() => { if (isAdmin) loadAdmin().catch(() => {}) }, [isAdmin, loadAdmin])
  useEffect(() => { window.addEventListener('auth-expired', logout); return () => window.removeEventListener('auth-expired', logout) }, [logout])
  useEffect(() => localStorage.setItem('artist-cart-v1', JSON.stringify(cart)), [cart])
  useEffect(() => localStorage.setItem('artist-reacted-v1', JSON.stringify(reacted)), [reacted])

  if (!pub) {
    return (
      <div className="grid min-h-svh place-items-center p-6 text-center">
        {err ? (
          <div className="max-w-sm space-y-3">
            <p className="font-medium">The site could not load.</p>
            <p className="text-sm text-neutral-500">{err}</p>
            <button onClick={loadPublic} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-ink">Try again</button>
          </div>
        ) : <p className="text-sm text-neutral-500">Loading…</p>}
      </div>
    )
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
    orders: adminData.orders, messages: adminData.messages,
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
    setQty: (key, qty) => setCart((c) => c.map((x) => (x.key === key ? { ...x, qty: Math.max(1, qty) } : x))),

    // The server recalculates prices and checks stock. It returns { order, authorizationUrl }.
    placeOrder: async ({ customer }) => {
      const res = await api('/orders', { method: 'POST', body: { customer, items: cart.map((c) => ({ workId: c.workId, option: c.option, qty: c.qty })) } })
      setCart([])
      loadPublic()
      return res
    },
    updateOrder: (id, patch) => run(async () => { await api('/orders/' + id, { method: 'PATCH', body: { status: patch.status } }); await Promise.all([loadAdmin(), loadPublic()]) }),

    react: (videoId, kind) => {
      const key = videoId + ':' + kind
      const has = reacted.includes(key)
      const delta = has ? -1 : 1
      setReacted((r) => (has ? r.filter((k) => k !== key) : [...r, key]))
      setPub((p) => ({ ...p, videos: p.videos.map((v) => (v.id === videoId ? { ...v, [kind]: Math.max(0, (v[kind] || 0) + delta) } : v)) }))
      api(`/videos/${videoId}/react`, { method: 'POST', body: { kind, delta } }).catch(() => {})
    },

    sendMessage: (m) => run(async () => { await api('/messages', { method: 'POST', body: m }); return true }),
    markMessage: (id, read) => run(async () => { await api('/messages/' + id, { method: 'PATCH', body: { read } }); await loadAdmin() }),
    removeMessage: (id) => run(async () => { await api('/messages/' + id, { method: 'DELETE' }); await loadAdmin() }),
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
