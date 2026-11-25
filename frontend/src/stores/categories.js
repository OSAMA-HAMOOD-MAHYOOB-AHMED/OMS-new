// The store's category list (managed by the admin), shared by the header, home and product pages.
import { computed, ref } from 'vue'
import { api } from '../api/client'

export const categories = ref([])
let pending = null

export function loadCategories(force = false) {
  if (pending && !force) return pending
  pending = api
    .get('/api/categories')
    .then((res) => {
      if (Array.isArray(res.data)) categories.value = res.data
      return categories.value
    })
    .catch(() => categories.value)
  return pending
}

/** Categories that currently have products (what shoppers should see). */
export const shopCategories = computed(() => categories.value.filter((c) => c.productCount > 0))
