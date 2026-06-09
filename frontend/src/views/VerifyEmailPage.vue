<template>
  <div class="wrap">
    <div class="card">
      <div v-if="loading" class="icon">⏳</div>
      <div v-else-if="success" class="icon ok">✓</div>
      <div v-else class="icon err">✕</div>

      <h2 class="h2">{{ title }}</h2>
      <p class="sub">{{ message }}</p>

      <RouterLink v-if="!loading && success" class="btn" to="/login">Sign in to your account</RouterLink>
      <RouterLink v-else-if="!loading" class="btn" to="/login">Go to Sign In</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const auth = useAuthStore()
auth.hydrate()

const loading = ref(true)
const success = ref(false)
const title = ref('Verifying your email…')
const message = ref('Please wait while we confirm your account.')

function readApiMessage(data) {
  if (!data) return null
  if (typeof data === 'string') return data
  if (typeof data.message === 'string') return data.message
  if (typeof data.Message === 'string') return data.Message
  return null
}

onMounted(async () => {
  const rawToken = route.query.token
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken
  if (!token) {
    loading.value = false
    title.value = 'Invalid link'
    message.value = 'No verification token was provided.'
    return
  }

  try {
    const res = await api.get('/api/auth/verify-email', { params: { token } })
    success.value = res.data.success ?? true
    title.value = success.value ? 'Email verified!' : 'Verification failed'
    message.value = readApiMessage(res.data) || 'Email verified successfully. You can now place orders.'
    if (success.value) auth.markEmailVerified()
  } catch (e) {
    success.value = false
    title.value = 'Verification failed'
    const apiMsg = readApiMessage(e?.response?.data)
    if (apiMsg) {
      message.value = apiMsg
    } else if (e?.code === 'ERR_NETWORK' || e?.message === 'Network Error') {
      message.value =
        'Cannot reach the API server. Make sure Docker is running (backend on http://localhost:8080), then open the link again.'
    } else {
      message.value =
        'This link is invalid or has expired. Sign in, go to Profile, and click “Resend verification email” for a fresh link.'
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.wrap {
  min-height: calc(100svh - 140px);
  display: grid;
  place-items: center;
  padding: 18px 0;
}
.card {
  width: min(480px, 100%);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px 24px;
  background: #fff;
  box-shadow: var(--shadow-md);
  text-align: center;
}
.icon {
  font-size: 40px;
  margin-bottom: 12px;
}
.icon.ok {
  color: #05603a;
}
.icon.err {
  color: #b42318;
}
.h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 950;
  color: var(--text-h);
}
.sub {
  margin: 10px 0 20px;
  color: var(--muted);
  font-weight: 650;
  line-height: 1.5;
}
.btn {
  display: inline-block;
  text-decoration: none;
  background: var(--brand-blue);
  color: #fff;
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 950;
}
</style>
