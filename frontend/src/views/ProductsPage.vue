<template>
  <section class="page">
    <div class="head">
      <div>
        <h1 class="h1">{{ activeCat === 'all' ? t('products.title') : activeTitle }}</h1>
        <p class="sub">{{ t('products.sub') }}</p>
      </div>
    </div>

    <div class="toolbar">
      <div class="chips" role="group" :aria-label="t('shell.menu')">
        <button :class="['chip', { active: activeCat === 'all' }]" type="button" @click="setCat('all')">{{ t('cats.all') }}</button>
        <button v-for="c in shopCategories" :key="c.name" :class="['chip', { active: activeCat === c.name }]" type="button" @click="setCat(c.name)">
          {{ categoryLabel(c.name) }}
        </button>
      </div>
      <div class="toolRight">
        <div class="search">
          <AppIcon name="search" :size="18" class="searchIcon" />
          <label class="srOnly" for="productSearch">{{ t('shell.searchLabel') }}</label>
          <input id="productSearch" v-model.trim="q" class="searchInput" type="search" :placeholder="t('shell.searchPlaceholder')" />
        </div>
        <button class="filterBtn" :class="{ active: filterCount > 0 }" type="button" :aria-expanded="showFilter ? 'true' : 'false'" @click="showFilter = !showFilter">
          <AppIcon name="filter" :size="18" />
          {{ t('products.filters') }}
          <span v-if="filterCount > 0" class="filterBadge">{{ filterCount }}</span>
        </button>
      </div>
    </div>

    <div v-if="showFilter" class="filterPanel">
      <div class="filterGrid">
        <div class="filterSection">
          <div class="filterLabel">{{ t('products.priceRange') }}</div>
          <div class="priceRow">
            <input v-model.number="minPrice" class="priceInput" type="number" :placeholder="t('products.min', { cur: currencyCode })" min="0" />
            <span class="priceSep">—</span>
            <input v-model.number="maxPrice" class="priceInput" type="number" :placeholder="t('products.max', { cur: currencyCode })" min="0" />
          </div>
        </div>

        <div class="filterSection">
          <div class="filterLabel">{{ t('products.sortBy') }}</div>
          <div class="chips">
            <button :class="['chip', { active: sortBy === '' }]" type="button" @click="sortBy = ''">{{ t('products.sortDefault') }}</button>
            <button :class="['chip', { active: sortBy === 'price-asc' }]" type="button" @click="sortBy = 'price-asc'">{{ t('products.priceAsc') }}</button>
            <button :class="['chip', { active: sortBy === 'price-desc' }]" type="button" @click="sortBy = 'price-desc'">{{ t('products.priceDesc') }}</button>
            <button :class="['chip', { active: sortBy === 'name-asc' }]" type="button" @click="sortBy = 'name-asc'">{{ t('products.nameAsc') }}</button>
          </div>
        </div>

        <div class="filterSection">
          <div class="filterLabel">{{ t('products.availability') }}</div>
          <label class="toggleRow">
            <input v-model="inStockOnly" type="checkbox" class="toggleCheck" />
            <span class="toggleTrack" :class="{ on: inStockOnly }"><span class="toggleThumb" /></span>
            {{ t('products.inStockOnly') }}
          </label>
        </div>
      </div>

      <div v-if="filterCount > 0" class="filterFooter">
        <button class="clearBtn" type="button" @click="clearFilters">{{ t('products.clear') }}</button>
        <span class="filterResult">{{ t('products.found', { n: filtered.length }) }}</span>
      </div>
    </div>

    <div v-if="loading" class="grid" aria-busy="true">
      <div v-for="n in 8" :key="n" class="skeleton" />
    </div>
    <div v-else-if="error" class="errorBox">
      <p class="error">{{ error }}</p>
      <button class="retry" type="button" @click="load()">{{ t('common.retry') }}</button>
    </div>
    <p v-else-if="!filtered.length" class="empty">{{ t('products.empty') }}</p>

    <div v-else class="grid">
      <ProductCard v-for="p in filtered" :key="p.productID" :product="p" />
    </div>
    <p v-if="loading && loadingMessage" class="muted">{{ loadingMessage }}</p>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api/client'
import { formatApiError, isRetryableApiError, sleep } from '../utils/apiError'
import { useCurrency } from '../composables/useCurrency'
import { useI18n } from '../i18n'
import AppIcon from '../components/AppIcon.vue'
import ProductCard from '../components/ProductCard.vue'
import { loadCategories, shopCategories } from '../stores/categories'

const { t, categoryGroup, categoryLabel } = useI18n()
const { currencyCode, rate } = useCurrency()
const route = useRoute()
const router = useRouter()

// Older links used category groups (?cat=chargers); keep them working.
const groupKeys = ['chargers', 'powerbanks', 'earphones', 'cases']
loadCategories()

const products = ref([])
const loading = ref(false)
const loadingMessage = ref('')
const error = ref(null)

const q = ref(String(route.query.q || ''))
const activeCat = ref(String(route.query.cat || 'all'))
const showFilter = ref(false)
const minPrice = ref(null)
const maxPrice = ref(null)
const sortBy = ref('')
const inStockOnly = ref(false)

// Keep the page in sync with the header search and category links.
watch(
  () => [route.query.q, route.query.cat],
  ([qq, cat]) => {
    q.value = String(qq || '')
    activeCat.value = String(cat || 'all')
  },
)

function setCat(c) {
  const query = { ...route.query }
  if (c === 'all') delete query.cat
  else query.cat = c
  router.replace({ name: 'products', query }).catch(() => {})
}

const activeTitle = computed(() =>
  groupKeys.includes(activeCat.value) ? t(`cats.${activeCat.value}`) : categoryLabel(activeCat.value),
)

function inActiveCategory(p) {
  if (activeCat.value === 'all') return true
  if (groupKeys.includes(activeCat.value)) return categoryGroup(p.category) === activeCat.value
  return p.category === activeCat.value
}

const filterCount = computed(() => {
  let n = 0
  if (minPrice.value !== null && minPrice.value !== '') n++
  if (maxPrice.value !== null && maxPrice.value !== '') n++
  if (sortBy.value) n++
  if (inStockOnly.value) n++
  return n
})

function clearFilters() {
  minPrice.value = null
  maxPrice.value = null
  sortBy.value = ''
  inStockOnly.value = false
}

const filtered = computed(() => {
  const needle = q.value.toLowerCase()
  let result = products.value.filter((p) => {
    if (!inActiveCategory(p)) return false
    if (needle) {
      const hay = `${p.name} ${p.category} ${p.productID} ${categoryLabel(p.category)}`.toLowerCase()
      if (!hay.includes(needle)) return false
    }
    if (inStockOnly.value && p.stockLevel <= 0) return false
    const price = Number(p.price)
    const r = rate.value || 1
    if (minPrice.value !== null && minPrice.value !== '' && price < Number(minPrice.value) / r) return false
    if (maxPrice.value !== null && maxPrice.value !== '' && price > Number(maxPrice.value) / r) return false
    return true
  })
  if (sortBy.value === 'price-asc') result = [...result].sort((a, b) => Number(a.price) - Number(b.price))
  else if (sortBy.value === 'price-desc') result = [...result].sort((a, b) => Number(b.price) - Number(a.price))
  else if (sortBy.value === 'name-asc') result = [...result].sort((a, b) => String(a.name).localeCompare(String(b.name)))
  return result
})

async function load(attempt = 0) {
  loading.value = true
  loadingMessage.value = attempt > 0 ? t('common.wakingUp') : ''
  error.value = null
  try {
    const res = await api.get('/api/products')
    if (!Array.isArray(res.data)) {
      throw new Error('Unexpected API response while loading products.')
    }
    products.value = res.data
  } catch (e) {
    if (attempt < 2 && isRetryableApiError(e)) {
      loadingMessage.value = t('common.wakingUp')
      await sleep(4000)
      return load(attempt + 1)
    }
    error.value = formatApiError(e) || t('products.loadFailed')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.h1 {
  margin: 0;
  font-size: 34px;
  font-weight: 800;
}
.sub {
  margin: 6px 0 0;
  color: var(--text);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.toolRight {
  display: flex;
  gap: 10px;
  flex: 1 1 360px;
  justify-content: flex-end;
}
.search {
  flex: 1 1 260px;
  max-width: 420px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border-strong);
  border-radius: 14px;
  padding: 0 14px;
  background: #fff;
  height: 46px;
}
.searchIcon {
  color: var(--muted);
}
.searchInput {
  border: 0;
  outline: none;
  width: 100%;
  font-size: 15px;
  color: var(--ink);
  background: transparent;
}
.filterBtn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 46px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid var(--border-strong);
  background: #fff;
  color: var(--ink);
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}
.filterBtn.active {
  border-color: var(--ink);
}
.filterBadge {
  background: var(--gold);
  color: var(--ink);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  padding: 8px 16px;
  border-radius: 999px;
  border: 0;
  background: var(--sand-2);
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
  cursor: pointer;
}
.chip:hover {
  background: var(--sand);
}
.chip.active {
  background: var(--ink);
  color: #fff;
}

.filterPanel {
  border: 1px solid var(--border);
  border-radius: 20px;
  background: #fff;
  padding: 18px;
  display: grid;
  gap: 14px;
}
.filterGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
}
.filterSection {
  display: grid;
  gap: 8px;
  align-content: start;
}
.filterLabel {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}
.priceRow {
  display: flex;
  align-items: center;
  gap: 8px;
}
.priceInput {
  flex: 1;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  padding: 10px 12px;
  color: var(--ink);
  width: 0;
}
.priceSep {
  color: var(--muted);
}
.toggleRow {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: 500;
  color: var(--ink);
  user-select: none;
}
.toggleCheck {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}
.toggleTrack {
  width: 42px;
  height: 24px;
  border-radius: 999px;
  background: var(--border-strong);
  display: flex;
  align-items: center;
  padding: 2px;
  transition: background 0.2s;
  flex-shrink: 0;
}
.toggleTrack.on {
  background: var(--ink);
}
.toggleThumb {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
}
/* flex-end follows the text direction, so the switch works in Arabic and English. */
.toggleTrack.on {
  justify-content: flex-end;
}
.toggleCheck:focus-visible + .toggleTrack {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
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
  border: 1px solid rgba(154, 42, 22, 0.3);
  background: rgba(154, 42, 22, 0.05);
  color: var(--danger);
  padding: 8px 14px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}
.filterResult {
  font-size: 13px;
  color: var(--text);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}
.skeleton {
  height: 380px;
  border-radius: 22px;
  background: linear-gradient(90deg, #f1ece2 25%, #f8f4ec 37%, #f1ece2 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
.muted,
.empty {
  color: var(--text);
}
.empty {
  padding: 40px 0;
  text-align: center;
}
.errorBox {
  display: grid;
  gap: 10px;
}
.error {
  margin: 0;
  color: var(--danger);
  background: rgba(154, 42, 22, 0.06);
  border: 1px solid rgba(154, 42, 22, 0.2);
  padding: 10px 12px;
  border-radius: 12px;
}
.retry {
  justify-self: start;
  border: 0;
  background: var(--ink);
  color: #fff;
  padding: 10px 16px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
}

@media (max-width: 560px) {
  .h1 {
    font-size: 28px;
  }
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .skeleton {
    height: 280px;
  }
  .toolRight {
    flex-basis: 100%;
  }
  .search {
    max-width: none;
  }
}
</style>
