<template>
  <section class="card">
    <h2>Profile</h2>
    <p class="muted">Update your account information and password.</p>

    <div v-if="loading" class="muted">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="grid">
      <div class="panel">
        <h3 class="h3">Personal info</h3>
        <div class="form">
          <label>
            <span>Name</span>
            <input v-model.trim="form.name" />
          </label>
          <label>
            <span>Phone</span>
            <input v-model.trim="form.phoneNumber" />
          </label>
          <label>
            <span>Address</span>
            <input v-model.trim="form.address" />
          </label>
          <button class="btn" :disabled="saving" @click="saveProfile">
            {{ saving ? 'Saving...' : 'Save profile' }}
          </button>
        </div>
      </div>

      <div class="panel">
        <h3 class="h3">Change password</h3>
        <div class="form">
          <label>
            <span>Current password</span>
            <input v-model="pw.currentPassword" type="password" />
          </label>
          <label>
            <span>New password</span>
            <input v-model="pw.newPassword" type="password" />
          </label>
          <button class="btn secondary" :disabled="saving" @click="changePassword">
            {{ saving ? 'Updating...' : 'Update password' }}
          </button>
        </div>
      </div>
    </div>

    <p v-if="ok" class="success">{{ ok }}</p>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { api } from '../api/client'

const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const ok = ref(null)

const form = reactive({ name: '', phoneNumber: '', address: '' })
const pw = reactive({ currentPassword: '', newPassword: '' })

async function load() {
  loading.value = true
  error.value = null
  ok.value = null
  try {
    const res = await api.get('/api/profile')
    form.name = res.data.name
    form.phoneNumber = res.data.phoneNumber
    form.address = res.data.address
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
.card {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px;
}
.muted {
  color: var(--text);
}
.grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
@media (min-width: 980px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }
}
.panel {
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
  gap: 10px;
}
label span {
  display: block;
  font-size: 13px;
  color: var(--text);
  margin-bottom: 6px;
}
input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.6);
  box-sizing: border-box;
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
.error {
  margin-top: 12px;
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border: 1px solid rgba(180, 35, 24, 0.2);
  padding: 8px 10px;
  border-radius: 12px;
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

