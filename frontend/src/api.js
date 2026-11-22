const configuredBase = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')
const apiBase = configuredBase
  ? (configuredBase.endsWith('/api') ? configuredBase : `${configuredBase}/api`)
  : import.meta.env.DEV ? 'http://localhost:4000/api' : ''
const loopbackBase = (() => {
  if (!configuredBase) return false
  try {
    const host = new URL(configuredBase).hostname.toLowerCase()
    return host === 'localhost' || host.endsWith('.localhost') || host === '127.0.0.1' || host === '0.0.0.0' || host === '[::1]'
  } catch {
    return false
  }
})()
const KEY = 'admin-token'

export const getToken = () => sessionStorage.getItem(KEY)
export const setToken = (t) => (t ? sessionStorage.setItem(KEY, t) : sessionStorage.removeItem(KEY))

const messageOf = (data, status) => (Array.isArray(data?.message) ? data.message.join(', ') : data?.message || `Request failed (${status})`)

const apiUrl = (path) => {
  if (!apiBase) throw new Error('VITE_API_URL is not configured for this deployment.')
  if (!import.meta.env.DEV && loopbackBase) throw new Error('VITE_API_URL points to localhost in a production build.')
  return apiBase + path
}

async function request(url, options) {
  let res
  try {
    res = await fetch(url, options)
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.')
  }
  const data = await res.json().catch(() => null)
  const token = getToken()
  if (res.status === 401 && token) {
    setToken(null)
    window.dispatchEvent(new Event('auth-expired'))
  }
  if (!res.ok) throw new Error(messageOf(data, res.status))
  return data
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = 'Bearer ' + token
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  return request(apiUrl(path), { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
}

// Uploads an image, video or audio file and returns its public URL.
export async function uploadFile(file) {
  const fd = new FormData()
  fd.append('file', file)
  const data = await request(apiUrl('/uploads'), { method: 'POST', headers: { Authorization: 'Bearer ' + getToken() }, body: fd })
  return data.url
}
