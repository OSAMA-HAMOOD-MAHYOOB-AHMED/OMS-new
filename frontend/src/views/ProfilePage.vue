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
          <div class="avatarWrap">
            <img v-if="avatarUrl" :src="avatarUrl" class="avatarImg" alt="Profile photo" />
            <div v-else class="avatar" aria-hidden="true">{{ initials }}</div>
            <button class="avatarEditBtn" type="button" :disabled="uploadingAvatar" title="Change photo" @click="avatarFileInput.click()">
              {{ uploadingAvatar ? '…' : '📷' }}
            </button>
            <button v-if="avatarUrl" class="avatarDelBtn" type="button" title="Remove photo" @click="removeAvatar">✕</button>
          </div>
          <input ref="avatarFileInput" type="file" accept="image/*" class="hiddenInput" @change="onAvatarFile" />
          <div>
            <div class="name">{{ form.name || 'Customer' }}</div>
            <div class="roleLine">{{ roleLabel }}</div>
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
          <div class="cardHeader">
            <div>
              <h3 class="h3">Personal info</h3>
              <p class="muted">{{ editingProfile ? 'Update your account information.' : 'Your account information.' }}</p>
            </div>
            <button v-if="!editingProfile" class="btnEdit" type="button" @click="startEditProfile">Edit</button>
          </div>
          <div v-if="!editingProfile" class="infoList">
            <div class="infoRow"><span class="infoLbl">Name</span><span class="infoVal">{{ form.name || '—' }}</span></div>
            <div class="infoRow"><span class="infoLbl">Phone</span><span class="infoVal">{{ form.phoneNumber || '—' }}</span></div>
            <div class="infoRow"><span class="infoLbl">Address</span><span class="infoVal">{{ form.address || '—' }}</span></div>
          </div>
          <div v-else class="form">
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
            <div class="btnRow">
              <button class="btnPrimary" type="button" :disabled="saving" @click="saveProfile">
                {{ saving ? 'Saving...' : 'Save profile' }}
              </button>
              <button class="btnGhost" type="button" :disabled="saving" @click="cancelEditProfile">Cancel</button>
            </div>
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

      <div v-if="!isDemoAccount" class="card danger">
        <h3 class="h3 dangerTitle">Delete account</h3>
        <p class="muted">
          Permanently remove your account, profile details, and order history. This action cannot be undone.
        </p>
        <div class="form">
          <label class="field">
            <span class="lbl">Confirm with your password</span>
            <input
              v-model="deletePassword"
              type="password"
              autocomplete="current-password"
              placeholder="Enter your password"
            />
          </label>
          <button class="btnDanger" type="button" :disabled="deleting" @click="deleteAccount">
            {{ deleting ? 'Deleting...' : 'Delete my account' }}
          </button>
        </div>
      </div>
    </div>

    <p v-if="ok" class="success">{{ ok }}</p>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { formatApiError } from '../utils/apiError'
import { siteLogoUrl } from '../utils/images'

const auth = useAuthStore()
const cart = useCartStore()
const router = useRouter()
auth.hydrate()
cart.hydrate()

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const uploadingAvatar = ref(false)
const error = ref(null)
const ok = ref(null)
const resending = ref(false)
const avatarUrl = ref(null)
const avatarFileInput = ref(null)

const form = reactive({ name: '', phoneNumber: '', address: '' })
const formSnapshot = reactive({ name: '', phoneNumber: '', address: '' })
const editingProfile = ref(false)
const pw = reactive({ currentPassword: '', newPassword: '' })
const deletePassword = ref('')
const profileRole = ref('')

const email = computed(() => auth.email || '')

const isDemoAccount = computed(() => String(email.value).toLowerCase().endsWith('@demo.local'))

const roleLabel = computed(() => {
  const role = profileRole.value || auth.role || 'Customer'
  if (role === 'Customer') return 'Customer Account'
  if (role === 'Admin') return 'Administrator Account'
  if (role === 'Warehouse Manager') return 'Warehouse Manager Account'
  if (role === 'Retail Salesperson') return 'Sales Account'
  return `${role} Account`
})

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
    profileRole.value = res.data.role || auth.role || ''
    avatarUrl.value = res.data.avatarUrl || null
    if (res.data.emailVerified) auth.markEmailVerified()
    await loadStats()
  } catch (e) {
    error.value = e?.response?.data || 'Failed to load profile'
  } finally {
    loading.value = false
  }
}

function startEditProfile() {
  formSnapshot.name = form.name
  formSnapshot.phoneNumber = form.phoneNumber
  formSnapshot.address = form.address
  editingProfile.value = true
}

function cancelEditProfile() {
  form.name = formSnapshot.name
  form.phoneNumber = formSnapshot.phoneNumber
  form.address = formSnapshot.address
  editingProfile.value = false
  error.value = null
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
    editingProfile.value = false
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

async function deleteAccount() {
  if (!deletePassword.value) {
    error.value = 'Enter your password to confirm account deletion.'
    ok.value = null
    return
  }

  const confirmed = window.confirm(
    'This permanently deletes your account and all associated order history. This cannot be undone. Continue?',
  )
  if (!confirmed) return

  deleting.value = true
  error.value = null
  ok.value = null
  try {
    await api.post('/api/profile/delete', { password: deletePassword.value })
    cart.clear()
    auth.logout()
    await router.push({ name: 'home' })
  } catch (e) {
    error.value = formatApiError(e) || 'Failed to delete account'
  } finally {
    deleting.value = false
  }
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please select an image file.'))
    if (file.size > 5 * 1024 * 1024) return reject(new Error('Image must be under 5MB.'))
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to load image.'))
      img.onload = () => {
        const MAX = 256
        const scale = Math.min(MAX / img.width, MAX / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

async function onAvatarFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  e.target.value = ''
  uploadingAvatar.value = true
  error.value = null
  ok.value = null
  try {
    const dataUrl = await compressImage(file)
    await api.put('/api/profile/avatar', { avatarUrl: dataUrl })
    avatarUrl.value = dataUrl
    ok.value = 'Profile photo updated.'
  } catch (e) {
    error.value = e?.response?.data || e?.message || 'Failed to upload photo.'
  } finally {
    uploadingAvatar.value = false
  }
}

async function removeAvatar() {
  if (!confirm('Remove your profile photo?')) return
  uploadingAvatar.value = true
  error.value = null
  ok.value = null
  try {
    await api.delete('/api/profile/avatar')
    avatarUrl.value = null
    ok.value = 'Profile photo removed.'
  } catch (e) {
    error.value = e?.response?.data || 'Failed to remove photo.'
  } finally {
    uploadingAvatar.value = false
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
.avatarWrap {
  position: relative;
  width: 72px;
  height: 72px;
  flex-shrink: 0;
}
.avatarImg {
  width: 72px;
  height: 72px;
  border-radius: 999px;
  object-fit: cover;
  box-shadow: var(--shadow-sm);
  display: block;
}
.avatarEditBtn {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  border: 2px solid #fff;
  background: var(--brand-blue);
  color: #fff;
  font-size: 11px;
  cursor: pointer;
  display: grid;
  place-items: center;
  padding: 0;
}
.avatarDelBtn {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: 2px solid #fff;
  background: #b42318;
  color: #fff;
  font-size: 9px;
  font-weight: 950;
  cursor: pointer;
  display: grid;
  place-items: center;
  padding: 0;
}
.hiddenInput {
  display: none;
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

.cardHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.btnEdit {
  flex-shrink: 0;
  border: 1px solid var(--border);
  cursor: pointer;
  background: #fff;
  color: var(--brand-blue);
  padding: 6px 14px;
  border-radius: 10px;
  font-weight: 900;
  font-size: 13px;
}
.infoList {
  margin-top: 12px;
  display: grid;
  gap: 8px;
}
.infoRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid var(--border);
}
.infoLbl {
  font-size: 12px;
  font-weight: 900;
  color: var(--muted);
}
.infoVal {
  font-weight: 750;
  color: var(--text-h);
}
.btnRow {
  display: flex;
  gap: 8px;
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
.danger {
  border-color: rgba(180, 35, 24, 0.25);
  background: rgba(180, 35, 24, 0.04);
}
.dangerTitle {
  color: #b42318;
}
.btnDanger {
  border: 0;
  cursor: pointer;
  background: #b42318;
  color: #fff;
  padding: 12px 14px;
  border-radius: 14px;
  font-weight: 950;
  box-shadow: var(--shadow-sm);
}
.btnDanger:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>

