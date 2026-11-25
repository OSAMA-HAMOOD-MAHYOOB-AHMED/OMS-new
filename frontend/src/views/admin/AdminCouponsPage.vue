<template>
  <section class="page">
    <div class="head">
      <div>
        <h1 class="h1">{{ tp('Discount codes') }}</h1>
        <p class="sub">{{ tp('Customers type these codes in the cart to get a percentage off.') }}</p>
      </div>
    </div>

    <form class="card form" novalidate @submit.prevent="save">
      <h2 class="h2">{{ editing ? tp('Edit code') : tp('New code') }}</h2>
      <div class="grid">
        <label class="field">
          <span>{{ tp('Code') }}</span>
          <input v-model.trim="form.code" type="text" dir="ltr" maxlength="40" :disabled="editing" placeholder="WELCOME10" class="upper" />
        </label>
        <label class="field">
          <span>{{ tp('Discount %') }}</span>
          <input v-model.number="form.percent" type="number" min="1" max="90" step="1" />
        </label>
        <label class="field">
          <span>{{ tp('Minimum cart total (USD)') }}</span>
          <input v-model.number="form.minSubtotal" type="number" min="0" step="0.01" />
        </label>
        <label class="field">
          <span>{{ tp('Expires on (optional)') }}</span>
          <input v-model="form.expiresAt" type="date" />
        </label>
        <label class="check">
          <input v-model="form.active" type="checkbox" />
          {{ tp('Active') }}
        </label>
      </div>
      <p v-if="error" class="msg error" role="alert">{{ tp(error) }}</p>
      <p v-if="ok" class="msg ok" role="status">{{ tp(ok) }}</p>
      <div class="actions">
        <button class="btnPrimary" type="submit" :disabled="saving">{{ saving ? tp('Saving…') : tp('Save code') }}</button>
        <button v-if="editing" class="btnGhost" type="button" @click="reset">{{ tp('Cancel') }}</button>
      </div>
    </form>

    <div class="card">
      <div v-if="loading" class="muted">{{ tp('Loading...') }}</div>
      <p v-else-if="!coupons.length" class="muted">{{ tp('No discount codes yet.') }}</p>
      <div v-else class="tableWrap">
        <table class="table">
          <thead>
            <tr>
              <th>{{ tp('Code') }}</th>
              <th>{{ tp('Discount') }}</th>
              <th>{{ tp('Minimum') }}</th>
              <th>{{ tp('Expires') }}</th>
              <th>{{ tp('Used') }}</th>
              <th>{{ tp('Status') }}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in coupons" :key="c.code">
              <td class="mono" dir="ltr">{{ c.code }}</td>
              <td>{{ c.percent }}%</td>
              <td dir="ltr">${{ Number(c.minSubtotal).toFixed(2) }}</td>
              <td>{{ c.expiresAt ? day(c.expiresAt) : '—' }}</td>
              <td>{{ c.timesUsed }}</td>
              <td>
                <span class="pill" :class="state(c).cls">{{ tp(state(c).label) }}</span>
              </td>
              <td class="rowActions">
                <button class="linkBtn" type="button" @click="edit(c)">{{ tp('Edit') }}</button>
                <button class="linkBtn danger" type="button" @click="remove(c)">{{ tp('Delete') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { api } from '../../api/client'
import { useI18n } from '../../i18n'

const { tp, locale } = useI18n()

const coupons = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const ok = ref(null)
const editing = ref(false)
const empty = () => ({ code: '', percent: 10, minSubtotal: 0, expiresAt: '', active: true })
const form = reactive(empty())

function day(iso) {
  return new Date(iso).toLocaleDateString(locale.value === 'ar' ? 'ar-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function state(c) {
  if (!c.active) return { label: 'Off', cls: 'off' }
  if (c.expiresAt && new Date(c.expiresAt) < new Date()) return { label: 'Expired', cls: 'off' }
  return { label: 'Active', cls: 'on' }
}

async function load() {
  loading.value = true
  try {
    coupons.value = (await api.get('/api/admin/coupons')).data
  } catch {
    error.value = 'Could not load the discount codes.'
  } finally {
    loading.value = false
  }
}

function reset() {
  Object.assign(form, empty())
  editing.value = false
}

function edit(c) {
  editing.value = true
  Object.assign(form, {
    code: c.code,
    percent: c.percent,
    minSubtotal: Number(c.minSubtotal),
    expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
    active: c.active,
  })
  ok.value = null
  error.value = null
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function save() {
  error.value = null
  ok.value = null
  saving.value = true
  try {
    await api.post('/api/admin/coupons', {
      code: form.code,
      percent: Number(form.percent),
      minSubtotal: Number(form.minSubtotal) || 0,
      // End of the chosen day.
      expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null,
      active: form.active,
    })
    ok.value = 'Discount code saved.'
    reset()
    await load()
  } catch (e) {
    error.value = (typeof e?.response?.data === 'string' && e.response.data) || 'Could not save the code.'
  } finally {
    saving.value = false
  }
}

async function remove(c) {
  if (!confirm(`${tp('Delete this code?')} ${c.code}`)) return
  try {
    await api.delete(`/api/admin/coupons/${encodeURIComponent(c.code)}`)
    await load()
  } catch {
    error.value = 'Could not delete the code.'
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
.h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
}
.h2 {
  margin: 0 0 12px;
  font-size: 18px;
  font-family: var(--font-head);
}
.sub {
  margin: 6px 0 0;
  color: var(--text);
}
.card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 18px 20px;
  min-width: 0;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  align-items: end;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  font-size: 13px;
  color: var(--muted);
}
.field input {
  width: 100%;
  height: 44px;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  padding: 0 12px;
  font: inherit;
  font-size: 15px;
  color: var(--ink);
}
.upper {
  text-transform: uppercase;
}
.check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  font-weight: 600;
}
.actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}
.btnPrimary,
.btnGhost {
  height: 44px;
  padding: 0 18px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
}
.btnPrimary {
  border: 0;
  background: var(--ink);
  color: #fff;
}
.btnGhost {
  border: 1px solid var(--border);
  background: #fff;
}
.msg {
  margin: 12px 0 0;
  font-size: 14px;
}
.msg.error {
  color: var(--danger);
}
.msg.ok {
  color: var(--success);
}
.muted {
  color: var(--muted);
  margin: 0;
}
.tableWrap {
  overflow-x: auto;
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.table th {
  text-align: start;
  color: var(--muted);
  font-weight: 600;
  padding: 10px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.table td {
  padding: 12px 10px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.mono {
  font-family: ui-monospace, monospace;
  font-weight: 700;
}
.pill {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.pill.on {
  background: #e6f2ec;
  color: var(--success);
}
.pill.off {
  background: #eeebe5;
  color: #57514a;
}
.rowActions {
  text-align: end;
}
.linkBtn {
  border: 0;
  background: none;
  color: var(--gold-text);
  font-weight: 600;
  cursor: pointer;
  margin-inline-start: 10px;
}
.linkBtn.danger {
  color: var(--danger);
}
</style>
