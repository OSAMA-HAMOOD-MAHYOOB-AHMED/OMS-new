export function formatApiError(err) {
  if (!err?.response) {
    if (err?.code === 'ECONNABORTED') {
      return 'The server took too long to respond. It may be waking up — try again in a moment.'
    }
    if (err?.message === 'Network Error' || err?.code === 'ERR_NETWORK') {
      return 'Cannot reach the server. Check your internet connection and try again.'
    }
    return err?.message || 'Request failed'
  }

  const status = err.response.status
  const data = err.response.data

  if (status === 401) return 'Your session expired. Please sign in again.'
  if (status === 403 && !data) return 'You do not have permission to do that.'
  if (status === 502 || status === 503 || status === 504) {
    return 'The server is starting up. Wait a moment and try again.'
  }

  if (!data) return `Request failed (${status})`
  if (typeof data === 'string') return data
  if (typeof data === 'object') {
    if (typeof data.message === 'string') return data.message
    if (typeof data.detail === 'string') return data.detail
    if (data.errors && typeof data.errors === 'object') {
      const first = Object.values(data.errors).flat()[0]
      if (first) return String(first)
    }
    if (typeof data.title === 'string') return data.title
  }
  return 'Request failed'
}
