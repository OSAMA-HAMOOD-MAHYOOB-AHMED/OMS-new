export function formatApiError(err) {
  if (!err?.response) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
      return 'Cannot reach the API server. The backend may be waking up — wait a moment and try again.'
    }
    return err?.message || 'Request failed'
  }

  const status = err.response.status
  const data = err.response.data

  if (status === 401) return 'Your session expired. Please sign in again.'
  if (status === 503 || status === 502 || status === 504) {
    return 'The API server is starting up. Wait a moment and try again.'
  }

  if (!data) return 'Request failed'
  if (typeof data === 'string') return data
  if (typeof data === 'object') {
    if (typeof data.message === 'string') return data.message
    if (typeof data.detail === 'string') return data.detail
    if (typeof data.title === 'string' && typeof data.status === 'number') return `${data.title} (${data.status})`
  }

  try {
    return JSON.stringify(data)
  } catch {
    return 'Request failed'
  }
}

export function isRetryableApiError(err) {
  if (!err?.response) return true
  const status = err.response.status
  return status === 502 || status === 503 || status === 504
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
