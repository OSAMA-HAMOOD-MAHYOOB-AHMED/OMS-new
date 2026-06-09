<template>
  <section class="page">
    <h1 class="h1">My Profile</h1>

    <div class="brandBar">
      <img class="storeLogo" :src="siteLogoUrl" alt="Al-Wakeel Al-Shamel" />
      <div>
        <div class="storeName">Al-Wakeel Al-Shamel</div>
        <div class="storeTag">Premium phone accessories</div>
      </div>
    </div>

    <div v-if="loading" class="muted">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="stack">
      <div v-if="!auth.emailVerified" class="verifyBanner">
        <p>Your email is not verified yet. Check your inbox or resend the verification link.</p>
        <p v-if="showDevInbox" class="devInbox">
          Local testing: open <a href="http://localhost:8025" target="_blank" rel="noopener">Mailpit inbox</a> to read verification emails.
        </p>
        <button class="btnVerify" type="button" :disabled="resending" @click="resend">
          {{ resending ? 'Sending...' : 'Resend verification email' }}
        </button>
      </div>

      <div class="card topCard">
        <div class="profileRow">
          <div class="avatar" aria-hidden="true">{{ initials }}</div>
          <div>
            <div class="name">{{ form.name || 'Customer' }}</div>
            <div class="roleLine">Customer Account</div>
          </div>
        </div>

        <div class="gridInfo">
          <div class="info">
            <div class="icon blue" aria-hidden="true">✉</div>
            <div>
              <div class="lbl">Email</div>
              <div class="val mono">{{ email }}</div>
            </div>
          </div>
          <div class="info">
            <div class="icon green" aria-hidden="true">📞</div>
            <div>
              <div class="lbl">Phone</div>
              <div class="val">{{ form.phoneNumber || '—' }}</div>
            </div>
          </div>
          <div class="info">
            <div class="icon purple" aria-hidden="true">📍</div>
            <div>
              <div class="lbl">Address</div>
              <div class="val">{{ form.address || '—' }}</div>
            </div>
          </div>
          <div class="info">
            <div class="icon orange" aria-hidden="true">▦</div>
            <div>
              <div class="lbl">Member Since</div>
              <div class="val">{{ memberSince }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card stats">
        <div class="stat a">
          <div class="sNum">{{ stats.totalOrders }}</div>
          <div class="sLbl">Total Orders</div>
        </div>
        <div class="stat b">
          <div class="sNum">${{ stats.totalSpent.toFixed(0) }}</div>
          <div class="sLbl">Total Spent</div>
        </div>
        <div class="stat c">
          <div class="sNum">{{ stats.completed }}</div>
          <div class="sLbl">Completed</div>
        </div>
        <div class="stat d">
          <div class="sNum">{{ stats.pending }}</div>
          <div class="sLbl">Pending</div>
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <h3 class="h3">Personal info</h3>
          <p class="muted">Update your account information.</p>
          <div class="form">
            <label class="field">
              <span class="lbl">Name</span>
              <input v-model.trim="form.name" />
            </label>
            <label class="field">
              <span class="lbl">Phone</span>
              <input v-model.trim="form.phoneNumber" />
            </label>
            <label class="field">
              <span class="lbl">Address</span>
              <input v-model.trim="form.address" />
            </label>
            <button class="btnPrimary" type="button" :disabled="saving" @click="saveProfile">
              {{ saving ? 'Saving...' : 'Save profile' }}
            </button>
          </div>
        </div>

        <div class="card">
          <h3 class="h3">Change password</h3>
          <p class="muted">Use a strong password for your demo account.</p>
          <div class="form">
            <label class="field">
              <span class="lbl">Current password</span>
              <input v-model="pw.currentPassword" type="password" autocomplete="current-password" />
            </label>
            <label class="field">
              <span class="lbl">New password</span>
              <input v-model="pw.newPassword" type="password" autocomplete="new-password" />
            </label>
            <button class="btnGhost" type="button" :disabled="saving" @click="changePassword">
              {{ saving ? 'Updating...' : 'Update password' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <p v-if="ok" class="success">{{ ok }}</p>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'
import { siteLogoUrl } from '../utils/images'

const auth = useAuthStore()
auth.hydrate()

const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const ok = ref(null)
const resending = ref(false)

const form = reactive({ name: '', phoneNumber: '', address: '' })
const pw = reactive({ currentPassword: '', newPassword: '' })

const email = computed(() => auth.email || '')

const showDevInbox = computed(() => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL ?? ''
  return !apiUrl || apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')
})

const initials = computed(() => {
  const n = String(form.name || email.value || 'C').trim()
  const parts = n.split(/\s+/g).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return n.slice(0, 1).toUpperCase() || 'C'
})

const memberSince = 'November 2024'

const stats = reactive({ totalOrders: 0, totalSpent: 0, completed: 0, pending: 0 })

async function resend() {
  resending.value = true
  ok.value = null
  error.value = null
  const sent = await auth.resendVerification()
  resending.value = false
  if (sent) ok.value = showDevInbox.value ? 'Verification email sent. Open Mailpit at http://localhost:8025' : 'Verification email sent. Check your inbox.'
}

async function loadStats() {
  try {
    const res = await api.get('/api/orders/mine')
    const rows = Array.isArray(res.data) ? res.data : []
    stats.totalOrders = rows.length
    stats.totalSpent = rows.reduce((acc, o) => acc + Number(o.totalPrice || 0), 0)
    stats.completed = rows.filter((o) => String(o.orderStatus || '').toLowerCase().includes('deliver')).length
    stats.pending = rows.filter((o) => {
      const s = String(o.orderStatus || '').toLowerCase()
      if (s.includes('deliver')) return false
      if (s.includes('cancel')) return false
      return true
    }).length
  } catch {
    // stats are cosmetic-only; ignore failures
  }
}

async function load() {
  loading.value = true
  error.value = null
  ok.value = null
  try {
    const res = await api.get('/api/profile')
    form.name = res.data.name
    form.phoneNumber = res.data.phoneNumber
    form.address = res.data.address
    if (res.data.emailVerified) auth.markEmailVerified()
    await loadStats()
  } catch (e) {
    error.value = e?.response?.data || 'Failed to load profile'
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  saving.value = true
  error.value = null
  ok.value = null
  try {
    await api.put('/api/profile', {
      name: form.name,
      phoneNumber: form.phoneNumber,
      address: form.address,
    })
    ok.value = 'Profile updated.'
  } catch (e) {
    error.value = e?.response?.data || 'Failed to update profile'
  } finally {
    saving.value = false
  }
}

async function changePassword() {
  saving.value = true
  error.value = null
  ok.value = null
  try {
    await api.post('/api/profile/password', {
      currentPassword: pw.currentPassword,
      newPassword: pw.newPassword,
    })
    pw.currentPassword = ''
    pw.newPassword = ''
    ok.value = 'Password updated.'
  } catch (e) {
    error.value = e?.response?.data || 'Failed to change password'
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
.brandBar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--shadow-sm);
}
.storeLogo {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  object-fit: cover;
}
.storeName {
  font-weight: 950;
  color: var(--text-h);
  letter-spacing: -0.2px;
}
.storeTag {
  margin-top: 2px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 650;
}
.h1 {
  margin: 0;
  font-size: 34px;
  font-weight: 950;
  letter-spacing: -0.9px;
  color: var(--text-h);
}
.stack {
  display: grid;
  gap: 12px;
}
.card {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px;
  background: #fff;
  box-shadow: var(--shadow-sm);
}

.topCard {
  display: grid;
  gap: 14px;
}
.profileRow {
  display: flex;
  gap: 14px;
  align-items: center;
}
.avatar {
  width: 72px;
  height: 72px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 950;
  letter-spacing: 0.4px;
  background: linear-gradient(135deg, var(--brand-teal), var(--brand-blue));
  box-shadow: var(--shadow-sm);
}
.name {
  font-size: 20px;
  font-weight: 950;
  color: var(--text-h);
  letter-spacing: -0.3px;
}
.roleLine {
  margin-top: 4px;
  color: var(--text);
  font-weight: 650;
}

.gridInfo {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 720px) {
  .gridInfo {
    grid-template-columns: 1fr;
  }
}
.info {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  gap: 12px;
  align-items: start;
  background: #fff;
}
.icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  border: 1px solid var(--border);
  flex: 0 0 auto;
  font-weight: 950;
}
.icon.blue {
  color: var(--brand-blue);
  background: rgba(37, 99, 235, 0.08);
}
.icon.green {
  color: #047857;
  background: rgba(16, 185, 129, 0.10);
}
.icon.purple {
  color: #6d28d9;
  background: rgba(139, 92, 246, 0.10);
}
.icon.orange {
  color: #b45309;
  background: rgba(245, 158, 11, 0.14);
}
.lbl {
  font-size: 12px;
  font-weight: 900;
  color: var(--muted);
}
.val {
  margin-top: 4px;
  font-weight: 850;
  color: var(--text-h);
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 900px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.stat {
  border-radius: 14px;
  padding: 12px;
  border: 1px solid var(--border);
}
.stat.a {
  background: rgba(37, 99, 235, 0.08);
}
.stat.b {
  background: rgba(16, 185, 129, 0.10);
}
.stat.c {
  background: rgba(139, 92, 246, 0.10);
}
.stat.d {
  background: rgba(245, 158, 11, 0.14);
}
.sNum {
  font-size: 22px;
  font-weight: 950;
  letter-spacing: -0.5px;
  color: var(--text-h);
}
.stat.a .sNum {
  color: #1d4ed8;
}
.stat.b .sNum {
  color: #047857;
}
.stat.c .sNum {
  color: #6d28d9;
}
.stat.d .sNum {
  color: #b45309;
}
.sLbl {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 900;
  color: #334155;
}

.muted {
  margin: 6px 0 0;
  color: var(--text);
}
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
@media (min-width: 980px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }
}
.h3 {
  margin: 0;
  color: var(--text-h);
  font-weight: 950;
  letter-spacing: -0.2px;
}
.form {
  margin-top: 12px;
  display: grid;
  gap: 10px;
}
.field {
  display: grid;
  gap: 8px;
}
.lbl {
  font-size: 12px;
  font-weight: 900;
  color: #334155;
}
input {
  width: 100%;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: #fff;
  box-sizing: border-box;
  font-weight: 650;
  color: var(--text-h);
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
  cursor: pointer;
  background: #fff;
  color: var(--text-h);
  padding: 12px 14px;
  border-radius: 14px;
  font-weight: 950;
}
.error {
  margin-top: 12px;
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border: 1px solid rgba(180, 35, 24, 0.2);
  padding: 8px 10px;
  border-radius: 12px;
}
.verifyBanner {
  border: 1px solid rgba(23, 92, 211, 0.25);
  background: rgba(23, 92, 211, 0.06);
  border-radius: 14px;
  padding: 12px 14px;
  display: grid;
  gap: 10px;
}
.verifyBanner p {
  margin: 0;
  color: #175cd3;
  font-weight: 700;
  font-size: 14px;
}
.devInbox {
  margin: 0;
  color: #334155 !important;
  font-weight: 650 !important;
  font-size: 13px !important;
}
.devInbox a {
  color: #175cd3;
  font-weight: 900;
}
.btnVerify {
  border: 0;
  cursor: pointer;
  background: var(--brand-blue);
  color: #fff;
  padding: 10px 12px;
  border-radius: 12px;
  font-weight: 900;
  justify-self: start;
}
.success {
  margin-top: 12px;
  color: #05603a;
  background: rgba(5, 96, 58, 0.08);
  border: 1px solid rgba(5, 96, 58, 0.18);
  padding: 8px 10px;
  border-radius: 12px;
}
</style>

