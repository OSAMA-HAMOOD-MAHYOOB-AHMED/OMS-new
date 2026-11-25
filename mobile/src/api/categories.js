// The store's category list (managed by the admin on the website), cached for labels.
import { useEffect } from 'react'
import { useApi } from './useApi'

let cache = []

export function cachedCategories() {
  return cache
}

/** Loads /api/categories (refreshes whenever the screen comes into focus) and keeps the cache fresh. */
export function useCategories() {
  const res = useApi('/api/categories', { initial: [] })
  useEffect(() => {
    if (Array.isArray(res.data) && res.data.length) cache = res.data
  }, [res.data])
  return res
}
