import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useRef, useState } from 'react'
import { formatApiError } from '../utils/apiError'
import { api } from './client'

// Loads a GET endpoint whenever the screen comes into focus.
// Returns { data, error, loading, refreshing, refresh, setData }.
export function useApi(url, { params, initial = null, transform } = {}) {
  const [data, setData] = useState(initial)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const hasData = useRef(false)
  const paramsKey = JSON.stringify(params || {})

  const load = useCallback(
    async (isRefresh = false) => {
      if (!url) return
      if (isRefresh) setRefreshing(true)
      else if (!hasData.current) setLoading(true)
      setError(null)
      try {
        const res = await api.get(url, { params })
        setData(transform ? transform(res.data) : res.data)
        hasData.current = true
      } catch (e) {
        setError(formatApiError(e))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [url, paramsKey],
  )

  useFocusEffect(
    useCallback(() => {
      load(false)
    }, [load]),
  )

  return { data, error, loading, refreshing, refresh: () => load(true), reload: () => load(false), setData }
}
