<template>
  <section class="page">
    <div class="head">
      <div>
        <h1 class="h1">{{ tp('Product Management') }}</h1>
        <p class="sub">{{ tp('Manage your product inventory') }}</p>
      </div>
      <div class="headActions">
        <button class="btnGhost" type="button" :disabled="loading" @click="load">{{ tp('Refresh') }}</button>
        <button class="btnPrimary" type="button" @click="newProduct">{{ tp('+ Add Product') }}</button>
      </div>
    </div>

    <div id="admin-product-panel" class="panel">
      <h3 class="h3">{{ isEditing ? `Edit product · ${form.productID}` : 'Add a product' }}</h3>
      <div class="editor">
        <div class="photoCol">
          <div
            class="dropZone"
            :class="{ dragging }"
            @dragover.prevent="dragging = true"
            @dragleave.prevent="dragging = false"
            @drop.prevent="onDrop"
          >
            <img v-if="previewUrl" :src="previewUrl" :alt="tp('Product photo preview')" class="photoPreview" />
            <div v-else class="photoEmpty">
              <AppIcon name="image" :size="34" />
              <span>{{ tp('Drop a photo here') }}</span>
            </div>
          </div>
          <input id="productPhoto" ref="fileInput" class="srOnly" type="file" accept="image/jpeg,image/png,image/webp" @change="onPick" />
          <div class="photoActions">
            <label for="productPhoto" class="btnGhost small">
              <AppIcon name="upload" :size="16" />
              {{ tp(previewUrl ? 'Change photo' : 'Upload photo') }}
            </label>
            <button v-if="pendingFile" class="linkBtn" type="button" @click="clearPick">{{ tp('Undo') }}</button>
          </div>
          <p class="hint">{{ tp('JPEG, PNG or WebP · up to 5 MB. Big photos are resized automatically.') }}</p>
          <p v-if="pendingFile" class="hint pending">{{ tp('New photo will be uploaded when you save.') }}</p>
        </div>

        <div class="form">
          <label class="field">
            <span>{{ tp('Product ID') }}</span>
            <input v-model.trim="form.productID" :disabled="isEditing" :placeholder="tp('e.g. CHR-010')" />
          </label>
          <label class="field">
            <span>{{ tp('Name') }}</span>
            <input v-model.trim="form.name" :placeholder="tp('Product name')" />
          </label>
          <label class="field">
            <span>{{ tp('Category') }}</span>
            <select v-model="form.category">
              <option value="" disabled>{{ tp('Choose a category') }}</option>
              <option v-for="c in categories" :key="c.name" :value="c.name">
                {{ c.name }}{{ c.nameAr ? ` · ${c.nameAr}` : '' }}
              </option>
            </select>
          </label>
          <label class="field">
            <span>{{ tp('Price (USD)') }}</span>
            <input v-model.number="form.price" type="number" step="0.01" min="0" />
          </label>
          <label class="field">
            <span>{{ tp('Original price (USD) — for sales') }}</span>
            <input v-model.number="form.compareAtPrice" type="number" step="0.01" min="0" :placeholder="tp('Leave empty if not on sale')" />
          </label>
          <label class="field">
            <span>{{ tp('Stock') }}</span>
            <input v-model.number="form.stockLevel" type="number" step="1" min="0" />
          </label>
          <label class="field wide">
            <span>{{ tp('Description') }}</span>
            <textarea v-model.trim="form.description" rows="3" :placeholder="tp('Short description (optional)')" />
          </label>
          <label class="field wide">
            <span>{{ tp('Specifications') }}</span>
            <textarea v-model="form.specs" rows="4" dir="auto" :placeholder="tp('One per line, e.g. Capacity: 20000mAh')" />
          </label>
        </div>
      </div>
      <div class="formActions">
        <button class="btnPrimary" type="button" :disabled="saving" @click="save">
          {{ tp(saving ? 'Saving...' : 'Save product') }}
        </button>
        <button v-if="isEditing" class="btnGhost" type="button" :disabled="saving" @click="resetForm">{{ tp('Cancel') }}</button>
      </div>
      <p v-if="ok" class="success">{{ tp(ok) }}</p>
      <p v-if="error" class="error">{{ tp(error) }}</p>
    </div>

    <section id="admin-categories" class="panel">
      <div class="catHead">
        <h3 class="h3">{{ tp('Categories') }}</h3>
        <span class="hint">{{ tp('Shoppers see a category in the menu once it has products.') }}</span>
      </div>

      <ul class="catList">
        <li v-for="c in categories" :key="c.name" class="catRow">
          <div class="catNames">
            <span class="catName">{{ c.name }}</span>
            <input
              class="catAr"
              :value="c.nameAr || ''"
              :placeholder="tp('Arabic name')"
              :aria-label="`${tp('Arabic name')}: ${c.name}`"
              dir="rtl"
              @change="renameAr(c, $event.target.value)"
            />
          </div>
          <span class="catCount">{{ c.productCount }} {{ tp('products') }}</span>

          <template v-if="deleting && deleting.name === c.name">
            <select v-if="c.productCount > 0" v-model="moveTo" class="catMove" :aria-label="tp('Move products to')">
              <option value="" disabled>{{ tp('Move products to…') }}</option>
              <option v-for="o in categories.filter((x) => x.name !== c.name)" :key="o.name" :value="o.name">{{ o.name }}</option>
            </select>
            <button class="dangerBtn small" type="button" :disabled="catBusy || (c.productCount > 0 && !moveTo)" @click="confirmDeleteCategory(c)">
              {{ tp('Confirm delete') }}
            </button>
            <button class="btnGhost small" type="button" @click="deleting = null">{{ tp('Cancel') }}</button>
          </template>
          <button v-else class="iconBtn danger" type="button" :title="tp('Delete')" :aria-label="`${tp('Delete')}: ${c.name}`" @click="startDeleteCategory(c)">🗑</button>
        </li>
      </ul>

      <form class="catAdd" @submit.prevent="addCategory">
        <input v-model.trim="newCat.name" :placeholder="tp('New category (English)')" :aria-label="tp('New category (English)')" />
        <input v-model.trim="newCat.nameAr" :placeholder="tp('Arabic name')" :aria-label="tp('Arabic name')" dir="rtl" />
        <button class="btnPrimary" type="submit" :disabled="catBusy || newCat.name.length < 2">{{ tp('Add category') }}</button>
      </form>
      <p v-if="catOk" class="success">{{ tp(catOk) }}</p>
      <p v-if="catError" class="error">{{ tp(catError) }}</p>
    </section>

    <div class="toolbar">
      <div class="search">
        <span class="searchIcon" aria-hidden="true">⌕</span>
        <input v-model.trim="q" class="searchInput" type="search" :placeholder="tp('Search products...')" />
      </div>
    </div>

    <div class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th>{{ tp('Product') }}</th>
            <th>{{ tp('Category') }}</th>
            <th>{{ tp('Price') }}</th>
            <th>{{ tp('Stock') }}</th>
            <th class="right">{{ tp('Actions') }}</th>
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
              <button class="iconBtn" type="button" :title="tp('Edit')" @click="edit(p)">✎</button>
              <button class="iconBtn danger" type="button" :title="tp('Delete')" @click="del(p)">🗑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from '../../i18n'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { api } from '../../api/client'
import { productImageUrl } from '../../utils/images'
import { prepareProductPhoto, uploadProductPhoto } from '../../utils/imageUpload'
import { useCurrency } from '../../composables/useCurrency'
import AppIcon from '../../components/AppIcon.vue'
import { categories, loadCategories } from '../../stores/categories'

const { tp } = useI18n()

const { format } = useCurrency()
const products = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const ok = ref(null)

const q = ref('')
const isEditing = ref(false)
const dragging = ref(false)
const fileInput = ref(null)
const pendingFile = ref(null)
const pendingPreview = ref('')

const emptyForm = () => ({
  productID: '',
  name: '',
  category: '',
  price: 0,
  stockLevel: 0,
  description: '',
  imageUrl: '',
  compareAtPrice: null,
  specs: '',
})
const form = reactive(emptyForm())

// Category management
const newCat = reactive({ name: '', nameAr: '' })
const deleting = ref(null)
const moveTo = ref('')
const catBusy = ref(false)
const catOk = ref(null)
const catError = ref(null)

async function refreshCategories() {
  await loadCategories(true)
}

async function addCategory() {
  catBusy.value = true
  catOk.value = null
  catError.value = null
  try {
    await api.post('/api/admin/categories', { name: newCat.name, nameAr: newCat.nameAr || null })
    catOk.value = 'Category added.'
    newCat.name = ''
    newCat.nameAr = ''
    await refreshCategories()
  } catch (e) {
    catError.value = apiMessage(e, 'Could not add the category.')
  } finally {
    catBusy.value = false
  }
}

async function renameAr(c, value) {
  catOk.value = null
  catError.value = null
  try {
    await api.put(`/api/admin/categories/${encodeURIComponent(c.name)}`, { nameAr: value.trim() || null })
    catOk.value = 'Saved.'
    await refreshCategories()
  } catch (e) {
    catError.value = apiMessage(e, 'Save failed')
  }
}

function startDeleteCategory(c) {
  deleting.value = c
  moveTo.value = ''
  catOk.value = null
  catError.value = null
}

async function confirmDeleteCategory(c) {
  catBusy.value = true
  try {
    const q = c.productCount > 0 ? `?moveTo=${encodeURIComponent(moveTo.value)}` : ''
    await api.delete(`/api/admin/categories/${encodeURIComponent(c.name)}${q}`)
    catOk.value = 'Deleted.'
    deleting.value = null
    await Promise.all([refreshCategories(), load()])
  } catch (e) {
    catError.value = apiMessage(e, 'Delete failed')
  } finally {
    catBusy.value = false
  }
}

// New photo the admin picked, else the product's current photo.
const previewUrl = computed(() => pendingPreview.value || (form.imageUrl ? productImageUrl(form) : ''))

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

function apiMessage(e, fallback) {
  const d = e?.response?.data
  if (typeof d === 'string' && d) return d
  if (d?.title) return d.title
  return e?.message || fallback
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/api/admin/products')
    products.value = res.data
  } catch (e) {
    error.value = apiMessage(e, 'Failed to load products')
  } finally {
    loading.value = false
  }
}

function clearPick() {
  if (pendingPreview.value) URL.revokeObjectURL(pendingPreview.value)
  pendingFile.value = null
  pendingPreview.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

async function usePhoto(file) {
  error.value = null
  ok.value = null
  try {
    const prepared = await prepareProductPhoto(file)
    clearPick()
    pendingFile.value = prepared
    pendingPreview.value = URL.createObjectURL(prepared)
  } catch (e) {
    error.value = e.message
  }
}

function onPick(e) {
  const file = e.target.files?.[0]
  if (file) usePhoto(file)
}

function onDrop(e) {
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) usePhoto(file)
}

function resetForm() {
  Object.assign(form, emptyForm())
  isEditing.value = false
  clearPick()
}

function newProduct() {
  resetForm()
  ok.value = null
  error.value = null
  focusPanel()
}

function edit(p) {
  clearPick()
  isEditing.value = true
  form.productID = p.productID
  form.name = p.name
  form.category = p.category
  form.price = Number(p.price)
  form.stockLevel = Number(p.stockLevel)
  form.description = p.description || ''
  form.imageUrl = p.imageUrl || ''
  form.compareAtPrice = p.compareAtPrice != null ? Number(p.compareAtPrice) : null
  form.specs = p.specs || ''
  ok.value = null
  error.value = null
  focusPanel()
}

async function save() {
  error.value = null
  ok.value = null
  if (!form.productID || !form.name || !form.category) {
    error.value = 'Product ID, name and category are required.'
    return
  }
  saving.value = true
  try {
    await api.post('/api/admin/products', {
      productID: form.productID,
      name: form.name,
      category: form.category,
      price: Number(form.price),
      stockLevel: Number(form.stockLevel),
      description: form.description || null,
      imageUrl: form.imageUrl || null,
      // 0 and "" clear these; leaving them out would keep the old values.
      compareAtPrice: Number(form.compareAtPrice) > 0 ? Number(form.compareAtPrice) : 0,
      specs: form.specs || '',
    })
    if (pendingFile.value) {
      try {
        form.imageUrl = (await uploadProductPhoto(api, form.productID, pendingFile.value)) || form.imageUrl
        clearPick()
      } catch (e) {
        error.value = `Product saved, but the photo upload failed: ${apiMessage(e, 'unknown error')}`
      }
    }
    if (!error.value) ok.value = 'Saved.'
    isEditing.value = true
    await load()
  } catch (e) {
    error.value = apiMessage(e, 'Save failed')
  } finally {
    saving.value = false
  }
}

async function del(p) {
  if (!window.confirm(`Delete "${p.name}"? This can't be undone.`)) return
  saving.value = true
  error.value = null
  ok.value = null
  try {
    await api.delete(`/api/admin/products/${encodeURIComponent(p.productID)}`)
    ok.value = 'Deleted.'
    if (form.productID === p.productID) resetForm()
    await load()
  } catch (e) {
    error.value = apiMessage(e, 'Delete failed')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  load()
  loadCategories(true)
})
onBeforeUnmount(clearPick)
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
.editor {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.catHead {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.catList {
  list-style: none;
  margin: 6px 0 12px;
  padding: 0;
  display: grid;
  gap: 8px;
}
.catRow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--bg);
}
.catNames {
  flex: 1 1 260px;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.catName {
  font-weight: 600;
  color: var(--text-h);
  min-width: 120px;
}
.catAr {
  flex: 1 1 160px;
  width: auto;
  padding: 8px 10px;
  border-radius: 10px;
}
.catCount {
  font-size: 13px;
  color: var(--text);
  white-space: nowrap;
}
.catMove {
  width: auto;
  padding: 8px 10px;
  border-radius: 10px;
}
.catAdd {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.catAdd input {
  flex: 1 1 200px;
  width: auto;
}
.dangerBtn {
  border: 0;
  border-radius: 12px;
  background: var(--danger);
  color: #fff;
  padding: 9px 12px;
  font-weight: 600;
  cursor: pointer;
}
.dangerBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.photoCol {
  flex: 0 0 220px;
  display: grid;
  gap: 8px;
  align-content: start;
}
.dropZone {
  width: 220px;
  height: 220px;
  border-radius: 18px;
  border: 2px dashed var(--border-strong);
  background: var(--bg);
  overflow: hidden;
  display: grid;
  place-items: center;
}
.dropZone.dragging {
  border-color: var(--gold);
  background: var(--sand);
}
.photoPreview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.photoEmpty {
  display: grid;
  justify-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 13px;
}
.photoActions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.photoActions .btnGhost {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.linkBtn {
  border: 0;
  background: transparent;
  color: var(--gold-text);
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}
.hint {
  margin: 0;
  font-size: 12px;
  color: var(--text);
}
.hint.pending {
  color: var(--gold-text);
  font-weight: 600;
}
.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.photoCol:focus-within .btnGhost {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}
.form {
  flex: 1 1 380px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  align-content: start;
}
.field {
  display: grid;
  gap: 6px;
  min-width: 0; /* let grid columns shrink instead of overflowing */
  font-size: 13px;
  font-weight: 600;
  color: var(--text-h);
}
.field.wide {
  grid-column: 1 / -1;
}
.formActions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}
input,
textarea,
select {
  width: 100%;
  min-width: 0;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid var(--border-strong);
  background: #fff;
  font-weight: 500;
  font-size: 15px;
  color: var(--text-h);
  font-family: inherit;
}
input:disabled {
  background: var(--bg);
  color: var(--text);
}
textarea {
  resize: vertical;
}
@media (max-width: 560px) {
  .photoCol,
  .dropZone {
    flex-basis: 100%;
    width: 100%;
  }
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
  text-align: start;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 950;
  padding: 12px 14px;
  background: #FAF8F4;
  border-bottom: 1px solid var(--border);
}
tbody td {
  padding: 14px;
  border-bottom: 1px solid #F1ECE2;
  vertical-align: middle;
}
.right {
  text-align: end;
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
  border: 1px solid rgba(207, 199, 184, 0.25);
  background-size: cover;
  background-position: center;
  background-color: #F4F0E8;
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
.small {
  padding: 8px 12px;
  font-size: 13px;
}
.iconBtn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(184, 145, 79, 0.22);
  background: rgba(184, 145, 79, 0.08);
  color: #85652A;
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

