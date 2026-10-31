const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '')
const KEY = 'admin-token'

export const getToken = () => sessionStorage.getItem(KEY)
export const setToken = (t) => (t ? sessionStorage.setItem(KEY, t) : sessionStorage.removeItem(KEY))

const messageOf = (data, status) => (Array.isArray(data?.message) ? data.message.join(', ') : data?.message || `Request failed (${status})`)

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = 'Bearer ' + token
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  let res
  try {
    res = await fetch(BASE + '/api' + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?')
  }
  const data = await res.json().catch(() => null)
  if (res.status === 401 && token) {
    setToken(null)
    window.dispatchEvent(new Event('auth-expired'))
  }
  if (!res.ok) throw new Error(messageOf(data, res.status))
  return data
}

// Uploads an image, video or audio file and returns its public URL.
export async function uploadFile(file) {
  const fd = new FormData()
  fd.append('file', file)
  let res
  try {
    res = await fetch(BASE + '/api/uploads', { method: 'POST', headers: { Authorization: 'Bearer ' + getToken() }, body: fd })
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(messageOf(data, res.status))
  return data.url
}
