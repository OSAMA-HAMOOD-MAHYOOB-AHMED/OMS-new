<template>
  <section class="page">
    <div class="head">
      <div>
        <h1 class="h1">Our Products</h1>
        <p class="sub">Browse our collection of premium phone accessories</p>
      </div>
    </div>

    <div class="toolbar">
      <div class="search">
        <span class="searchIcon" aria-hidden="true">⌕</span>
        <input v-model.trim="q" class="searchInput" type="search" placeholder="Search products..." />
      </div>
      <button class="filterBtn" :class="{ active: filterCount > 0 }" type="button" @click="showFilter = !showFilter">
        <span aria-hidden="true">⏚</span>
        Filters
        <span v-if="filterCount > 0" class="filterBadge">{{ filterCount }}</span>
      </button>
    </div>

    <div v-if="showFilter" class="filterPanel">
      <div class="filterGrid">
        <div class="filterSection">
          <div class="filterLabel">Category</div>
          <div class="chips">
            <button :class="['chip', { active: category === 'All' }]" type="button" @click="category = 'All'">All</button>
            <button v-for="c in categories" :key="c" :class="['chip', { active: category === c }]" type="button" @click="category = c">{{ c }}</button>
          </div>
        </div>

        <div class="filterSection">
          <div class="filterLabel">Price range</div>
          <div class="priceRow">
            <input v-model.number="minPrice" class="priceInput" type="number" placeholder="Min $" min="0" />
            <span class="priceSep">—</span>
            <input v-model.number="maxPrice" class="priceInput" type="number" placeholder="Max $" min="0" />
          </div>
        </div>

        <div class="filterSection">
          <div class="filterLabel">Sort by</div>
          <div class="chips">
            <button :class="['chip', { active: sortBy === '' }]" type="button" @click="sortBy = ''">Default</button>
            <button :class="['chip', { active: sortBy === 'price-asc' }]" type="button" @click="sortBy = 'price-asc'">Price ↑</button>
            <button :class="['chip', { active: sortBy === 'price-desc' }]" type="button" @click="sortBy = 'price-desc'">Price ↓</button>
            <button :class="['chip', { active: sortBy === 'name-asc' }]" type="button" @click="sortBy = 'name-asc'">Name A–Z</button>
          </div>
        </div>

        <div class="filterSection">
          <div class="filterLabel">Availability</div>
          <label class="toggleRow">
            <input v-model="inStockOnly" type="checkbox" class="toggleCheck" />
            <span class="toggleTrack" :class="{ on: inStockOnly }"><span class="toggleThumb" /></span>
            In stock only
          </label>
        </div>
      </div>

      <div v-if="filterCount > 0" class="filterFooter">
        <button class="clearBtn" type="button" @click="clearFilters">Clear all filters</button>
        <span class="filterResult">{{ filtered.length }} product{{ filtered.length !== 1 ? 's' : '' }} found</span>
      </div>
    </div>

    <div v-if="loading" class="muted">{{ loadingMessage }}</div>
    <div v-else-if="error" class="errorBox">
      <p class="error">{{ error }}</p>
      <button class="btn small retry" type="button" @click="load()">Try again</button>
    </div>

    <div v-else class="grid">
      <article v-for="p in filtered" :key="p.productID" class="product" @click="open(p.productID)">
        <div class="img" :style="{ backgroundImage: `url(${productImageUrl(p)})` }" />

        <div class="body">
          <div class="cat">{{ p.category }}</div>
          <div class="name">{{ p.name }}</div>
          <div class="desc">{{ p.description || 'Premium accessory built for everyday use.' }}</div>

          <div class="bottom">
            <div class="price">${{ Number(p.price).toFixed(2) }}</div>
            <div class="stock">{{ p.stockLevel }} in stock</div>
          </div>

          <div v-if="role === 'Customer'" class="actions" @click.stop>
            <button class="btn small" type="button" :disabled="p.stockLevel <= 0" @click="add(p)">Add to cart</button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { formatApiError, isRetryableApiError, sleep } from '../utils/apiError'
import { productImageUrl } from '../utils/images'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
auth.hydrate()
const role = computed(() => auth.role)

const cart = useCartStore()
cart.hydrate()
const router = useRouter()

const products = ref([])
const loading = ref(false)
const loadingMessage = ref('Loading...')
const error = ref(null)

const q = ref('')
const category = ref('All')
const showFilter = ref(false)
const minPrice = ref(null)
const maxPrice = ref(null)
const sortBy = ref('')
const inStockOnly = ref(false)

const categories = computed(() => {
  const s = new Set(products.value.map((p) => p.category).filter(Boolean))
  return Array.from(s).sort((a, b) => a.localeCompare(b))
})

const filterCount = computed(() => {
  let n = 0
  if (category.value !== 'All') n++
  if (minPrice.value !== null && minPrice.value !== '') n++
  if (maxPrice.value !== null && maxPrice.value !== '') n++
  if (sortBy.value) n++
  if (inStockOnly.value) n++
  return n
})

function clearFilters() {
  category.value = 'All'
  minPrice.value = null
  maxPrice.value = null
  sortBy.value = ''
  inStockOnly.value = false
}

const filtered = computed(() => {
  const needle = q.value.toLowerCase()
  let result = products.value.filter((p) => {
    if (category.value !== 'All' && p.category !== category.value) return false
    if (needle) {
      const hay = `${p.name} ${p.category} ${p.productID}`.toLowerCase()
      if (!hay.includes(needle)) return false
    }
    if (inStockOnly.value && p.stockLevel <= 0) return false
    const price = Number(p.price)
    if (minPrice.value !== null && minPrice.value !== '' && price < minPrice.value) return false
    if (maxPrice.value !== null && maxPrice.value !== '' && price > maxPrice.value) return false
    return true
  })
  if (sortBy.value === 'price-asc') result = [...result].sort((a, b) => Number(a.price) - Number(b.price))
  else if (sortBy.value === 'price-desc') result = [...result].sort((a, b) => Number(b.price) - Number(a.price))
  else if (sortBy.value === 'name-asc') result = [...result].sort((a, b) => String(a.name).localeCompare(String(b.name)))
  return result
})

async function load(attempt = 0) {
  loading.value = true
  loadingMessage.value = attempt > 0 ? 'Connecting to API...' : 'Loading...'
  error.value = null
  try {
    const res = await api.get('/api/products')
    if (!Array.isArray(res.data)) {
      throw new Error('Unexpected API response while loading products.')
    }
    products.value = res.data
  } catch (e) {
    if (attempt < 2 && isRetryableApiError(e)) {
      loadingMessage.value = 'API is waking up, retrying...'
      await sleep(4000)
      return load(attempt + 1)
    }
    error.value = formatApiError(e) || 'Failed to load products'
  } finally {
    loading.value = false
  }
}

function add(p) {
  cart.add(p, 1)
}

function open(productID) {
  router.push({ name: 'productDetails', params: { id: productID } })
}

onMounted(load)
</script>

<style scoped>
.page {
  display: grid;
  gap: 14px;
}
.head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}
.h1 {
  margin: 0;
  font-size: 34px;
  font-weight: 950;
  letter-spacing: -0.9px;
  color: var(--text-h);
}
.sub {
  margin: 8px 0 0;
  color: var(--text);
  font-weight: 650;
}

.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--shadow-sm);
}
.search {
  flex: 1 1 420px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 10px 12px;
  background: #fff;
}
.searchIcon {
  color: var(--muted);
  font-weight: 900;
}
.searchInput {
  border: 0;
  outline: none;
  width: 100%;
  font-weight: 650;
  color: var(--text-h);
  background: transparent;
}
.filterBtn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 14px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text-h);
  font-weight: 900;
  cursor: pointer;
  white-space: nowrap;
}
.filterBtn.active {
  border-color: var(--brand-blue);
  color: var(--brand-blue);
  background: rgba(37, 99, 235, 0.06);
}
.filterBadge {
  background: var(--brand-blue);
  color: #fff;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 950;
  padding: 1px 6px;
}
.filterPanel {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fff;
  padding: 16px;
  box-shadow: var(--shadow-sm);
  display: grid;
  gap: 14px;
}
.filterGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
@media (max-width: 640px) {
  .filterGrid {
    grid-template-columns: 1fr;
  }
}
.filterSection {
  display: grid;
  gap: 8px;
}
.filterLabel {
  font-size: 11px;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #fff;
  font-size: 13px;
  font-weight: 800;
  color: var(--text-h);
  cursor: pointer;
}
.chip.active {
  background: var(--brand-blue);
  border-color: var(--brand-blue);
  color: #fff;
}
.priceRow {
  display: flex;
  align-items: center;
  gap: 8px;
}
.priceInput {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 8px 10px;
  font-weight: 700;
  color: var(--text-h);
  width: 0;
}
.priceSep {
  color: var(--muted);
  font-weight: 900;
}
.toggleRow {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: 800;
  color: var(--text-h);
  user-select: none;
}
.toggleCheck {
  display: none;
}
.toggleTrack {
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background: var(--border);
  display: flex;
  align-items: center;
  padding: 2px;
  transition: background 0.2s;
  flex-shrink: 0;
}
.toggleTrack.on {
  background: var(--brand-blue);
}
.toggleThumb {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}
.toggleTrack.on .toggleThumb {
  transform: translateX(18px);
}
.filterFooter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}
.clearBtn {
  border: 1px solid rgba(180, 35, 24, 0.3);
  background: rgba(180, 35, 24, 0.06);
  color: #b42318;
  padding: 7px 14px;
  border-radius: 10px;
  font-weight: 900;
  font-size: 13px;
  cursor: pointer;
}
.filterResult {
  font-size: 13px;
  color: var(--muted);
  font-weight: 700;
}

.muted {
  color: var(--text);
  margin-top: 6px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
@media (max-width: 1100px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 560px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .h1 {
    font-size: 28px;
  }
  .search {
    flex: 1 1 100%;
  }
  .select {
    flex: 1;
    min-width: 0;
  }
}
.product {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  display: grid;
  grid-template-rows: 170px 1fr;
}
.img {
  background-size: cover;
  background-position: center;
  background-color: #eef2ff;
}
.body {
  padding: 14px;
  display: grid;
  gap: 8px;
}
.name {
  font-weight: 950;
  color: var(--text-h);
  letter-spacing: -0.2px;
}
.cat {
  font-size: 12px;
  font-weight: 900;
  color: var(--brand-blue);
}
.desc {
  font-size: 14px;
  color: var(--text);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.bottom {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  margin-top: 4px;
}
.price {
  color: var(--text-h);
  font-weight: 950;
}
.stock {
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
}
.btn {
  border: 0;
  cursor: pointer;
  background: var(--brand-blue);
  color: white;
  padding: 10px 14px;
  border-radius: 12px;
  font-weight: 900;
  box-shadow: var(--shadow-sm);
}
.small {
  padding: 9px 10px;
  border-radius: 12px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}
.errorBox {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}
.error {
  margin: 0;
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border: 1px solid rgba(180, 35, 24, 0.2);
  padding: 8px 10px;
  border-radius: 12px;
}
.retry {
  justify-self: start;
}
</style>

