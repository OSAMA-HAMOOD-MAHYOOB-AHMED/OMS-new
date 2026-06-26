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
      <div class="filterIcon" aria-hidden="true">⏚</div>
      <select v-model="category" class="select">
        <option value="All">All</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
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

const categories = computed(() => {
  const s = new Set(products.value.map((p) => p.category).filter(Boolean))
  return Array.from(s).sort((a, b) => a.localeCompare(b))
})

const filtered = computed(() => {
  const needle = q.value.toLowerCase()
  return products.value.filter((p) => {
    if (category.value !== 'All' && p.category !== category.value) return false
    if (!needle) return true
    const hay = `${p.name} ${p.category} ${p.productID}`.toLowerCase()
    return hay.includes(needle)
  })
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
.filterIcon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid var(--border);
  display: grid;
  place-items: center;
  color: var(--muted);
  font-weight: 950;
  background: #fff;
}
.select {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 10px 12px;
  background: #fff;
  font-weight: 900;
  color: var(--text-h);
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
  .filterIcon {
    display: none;
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

