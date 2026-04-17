<template>
  <section class="card">
    <div class="row">
      <div>
        <h2>Product Management</h2>
        <p class="muted">Create/edit/delete products (demo CRUD).</p>
      </div>
      <button class="btn secondary" :disabled="loading" @click="load">Refresh</button>
    </div>

    <div class="panel">
      <h3 class="h3">Add / Update</h3>
      <div class="form">
        <input v-model.trim="form.productID" placeholder="ProductID (e.g. P-NEW-01)" />
        <input v-model.trim="form.name" placeholder="Name" />
        <input v-model.trim="form.category" placeholder="Category" />
        <input v-model.number="form.price" type="number" step="0.01" placeholder="Price" />
        <input v-model.number="form.stockLevel" type="number" step="1" placeholder="StockLevel" />
        <input v-model.trim="form.description" placeholder="Description (optional)" />
      </div>
      <button class="btn" :disabled="saving" @click="save">
        {{ saving ? 'Saving...' : 'Save product' }}
      </button>
      <p v-if="ok" class="success">{{ ok }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <div class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p.productID">
            <td class="mono">{{ p.productID }}</td>
            <td>{{ p.name }}</td>
            <td>{{ p.category }}</td>
            <td>${{ Number(p.price).toFixed(2) }}</td>
            <td>{{ p.stockLevel }}</td>
            <td class="actions">
              <button class="btn secondary small" @click="edit(p)">Edit</button>
              <button class="btn danger small" @click="del(p.productID)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { api } from '../../api/client'

const products = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const ok = ref(null)

const form = reactive({
  productID: '',
  name: '',
  category: '',
  price: 0,
  stockLevel: 0,
  description: '',
})

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
.card {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 12px;
}
.muted {
  color: var(--text);
  margin-top: 6px;
}
.panel {
  margin-top: 12px;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.55);
}
.h3 {
  margin: 0 0 10px;
  color: var(--text-h);
}
.form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}
input {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.6);
}
.tableWrap {
  margin-top: 12px;
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.55);
}
.table {
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;
}
th,
td {
  text-align: left;
  padding: 12px;
  border-bottom: 1px solid rgba(17, 24, 39, 0.08);
}
th {
  font-size: 13px;
  color: var(--text);
}
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: end;
}
.mono {
  font-family: ui-monospace, Consolas, monospace;
}
.btn {
  border: 0;
  cursor: pointer;
  background: #007aff;
  color: white;
  padding: 10px 14px;
  border-radius: 12px;
  font-weight: 800;
}
.secondary {
  background: rgba(0, 0, 0, 0.08);
  color: var(--text-h);
}
.small {
  padding: 8px 10px;
  border-radius: 10px;
}
.danger {
  background: rgba(180, 35, 24, 0.92);
}
.error {
  margin-top: 10px;
  color: #b42318;
}
.success {
  margin-top: 10px;
  color: #05603a;
}
</style>

