<template>
  <section class="page">
    <div class="head">
      <div>
        <h1 class="h1">Product Management</h1>
        <p class="sub">Manage your product inventory</p>
      </div>
      <div class="headActions">
        <button class="btnGhost" type="button" :disabled="loading" @click="load">Refresh</button>
        <button class="btnPrimary" type="button" @click="focusPanel">+ Add Product</button>
      </div>
    </div>

    <div id="admin-product-panel" class="panel">
      <h3 class="h3">Add / Update</h3>
      <div class="form">
        <input v-model.trim="form.productID" placeholder="ProductID (e.g. P-NEW-01)" />
        <input v-model.trim="form.name" placeholder="Name" />
        <input v-model.trim="form.category" placeholder="Category" />
        <input v-model.number="form.price" type="number" step="0.01" placeholder="Price" />
        <input v-model.number="form.stockLevel" type="number" step="1" placeholder="StockLevel" />
        <input v-model.trim="form.description" placeholder="Description (optional)" />
        <input v-model.trim="form.imageUrl" placeholder="Image URL (e.g. /images/products/charger.jpg)" />
      </div>
      <div v-if="form.imageUrl" class="preview">
        <img :src="productImageUrl(form)" alt="Product preview" />
      </div>
      <button class="btnPrimary" type="button" :disabled="saving" @click="save">
        {{ saving ? 'Saving...' : 'Save product' }}
      </button>
      <p v-if="ok" class="success">{{ ok }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <div class="toolbar">
      <div class="search">
        <span class="searchIcon" aria-hidden="true">⌕</span>
        <input v-model.trim="q" class="searchInput" type="search" placeholder="Search products..." />
      </div>
    </div>

    <div class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th class="right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filtered" :key="p.productID">
            <td>
              <div class="prodCell">
                <div class="thumb" :style="{ backgroundImage: `url(${productImageUrl(p)})` }" />
                <div>
                  <div class="pName">{{ p.name }}</div>
                  <div class="pId mono">{{ p.productID }}</div>
                </div>
              </div>
            </td>
            <td>{{ p.category }}</td>
            <td class="strong">{{ format(p.price) }}</td>
            <td>
              <span class="stock" :class="stockClass(p.stockLevel)">{{ p.stockLevel }}</span>
            </td>
            <td class="actions right">
              <button class="iconBtn" type="button" title="Edit" @click="edit(p)">✎</button>
              <button class="iconBtn danger" type="button" title="Delete" @click="del(p.productID)">🗑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '../../api/client'
import { productImageUrl } from '../../utils/images'
import { useCurrency } from '../../composables/useCurrency'

const { format } = useCurrency()
const products = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const ok = ref(null)

const q = ref('')

const form = reactive({
  productID: '',
  name: '',
  category: '',
  price: 0,
  stockLevel: 0,
  description: '',
  imageUrl: '',
})

const filtered = computed(() => {
  const needle = q.value.toLowerCase()
  if (!needle) return products.value
  return products.value.filter((p) => `${p.name} ${p.category} ${p.productID}`.toLowerCase().includes(needle))
})

function focusPanel() {
  document.getElementById('admin-product-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function stockClass(level) {
  const n = Number(level) || 0
  if (n <= 10) return 'low'
  return 'ok'
}

async function load() {
  loading.value = true
  error.value = null
  ok.value = null
  try {
    const res = await api.get('/api/admin/products')
    products.value = res.data
  } catch (e) {
    error.value = e?.response?.data || 'Failed to load products'
  } finally {
    loading.value = false
  }
}

function edit(p) {
  form.productID = p.productID
  form.name = p.name
  form.category = p.category
  form.price = Number(p.price)
  form.stockLevel = Number(p.stockLevel)
  form.description = p.description || ''
  form.imageUrl = p.imageUrl || ''
}

async function save() {
  saving.value = true
  error.value = null
  ok.value = null
  try {
    await api.post('/api/admin/products', {
      productID: form.productID,
      name: form.name,
      category: form.category,
      price: Number(form.price),
      stockLevel: Number(form.stockLevel),
      description: form.description || null,
      imageUrl: form.imageUrl || null,
    })
    ok.value = 'Saved.'
    await load()
  } catch (e) {
    error.value = e?.response?.data || 'Save failed'
  } finally {
    saving.value = false
  }
}

async function del(productID) {
  saving.value = true
  error.value = null
  ok.value = null
  try {
    await api.delete(`/api/admin/products/${productID}`)
    ok.value = 'Deleted.'
    await load()
  } catch (e) {
    error.value = e?.response?.data || 'Delete failed'
  } finally {
    saving.value = false
  }
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
  flex-wrap: wrap;
}
.h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 950;
  letter-spacing: -0.8px;
  color: var(--text-h);
}
.sub {
  margin: 6px 0 0;
  color: var(--text);
  font-weight: 650;
}
.headActions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.panel {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px;
  background: #fff;
  box-shadow: var(--shadow-sm);
}
.h3 {
  margin: 0 0 10px;
  color: var(--text-h);
  font-weight: 950;
}
.form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}
input {
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: #fff;
  font-weight: 650;
  color: var(--text-h);
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

.preview {
  margin-top: 10px;
}
.preview img {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid var(--border);
}
.tableWrap {
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--shadow-sm);
}
.table {
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
}
thead th {
  text-align: left;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 950;
  padding: 12px 14px;
  background: #f8fafc;
  border-bottom: 1px solid var(--border);
}
tbody td {
  padding: 14px;
  border-bottom: 1px solid #eef2f7;
  vertical-align: middle;
}
.right {
  text-align: right;
}
.prodCell {
  display: flex;
  gap: 12px;
  align-items: center;
}
.thumb {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background-size: cover;
  background-position: center;
  background-color: #f1f5f9;
  flex: 0 0 auto;
}
.pName {
  font-weight: 950;
  color: var(--text-h);
}
.pId {
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
  font-weight: 750;
}
.strong {
  font-weight: 950;
  color: var(--text-h);
}
.stock {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 950;
  border: 1px solid transparent;
}
.stock.ok {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
  border-color: rgba(16, 185, 129, 0.22);
}
.stock.low {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
  border-color: rgba(245, 158, 11, 0.22);
}
.actions {
  display: inline-flex;
  gap: 8px;
  justify-content: flex-end;
}
.iconBtn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(37, 99, 235, 0.22);
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  font-weight: 950;
  cursor: pointer;
}
.iconBtn.danger {
  border-color: rgba(239, 68, 68, 0.28);
  background: rgba(239, 68, 68, 0.08);
  color: #b91c1c;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.btnPrimary {
  border: 0;
  cursor: pointer;
  background: var(--brand-blue);
  color: white;
  padding: 12px 14px;
  border-radius: 14px;
  font-weight: 950;
  box-shadow: var(--shadow-sm);
}
.btnGhost {
  border: 1px solid var(--border);
  background: #fff;
  padding: 10px 12px;
  border-radius: 14px;
  font-weight: 950;
  cursor: pointer;
  color: var(--text-h);
}
.error {
  margin-top: 10px;
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border: 1px solid rgba(180, 35, 24, 0.2);
  padding: 8px 10px;
  border-radius: 12px;
}
.success {
  margin-top: 10px;
  color: #05603a;
  background: rgba(5, 96, 58, 0.08);
  border: 1px solid rgba(5, 96, 58, 0.18);
  padding: 8px 10px;
  border-radius: 12px;
}
</style>

