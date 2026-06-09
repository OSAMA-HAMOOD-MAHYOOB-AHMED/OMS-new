<template>
  <div class="wrap">
    <div class="card">
      <div class="icon" aria-hidden="true">✉</div>
      <h2 class="h2">Check your email</h2>
      <p class="sub">
        We sent a verification link to
        <strong>{{ email }}</strong>.
        Open the email and click <strong>Verify email address</strong> to activate your account.
      </p>

      <ol class="steps">
        <li>Open your inbox (and spam/junk folder if needed).</li>
        <li>Click the verification button in the email from Al-Wakeel Al-Shamel.</li>
        <li>Return here and sign in once verification succeeds.</li>
      </ol>

      <p v-if="showDevInbox" class="devInbox">
        Local testing: open <a href="http://localhost:8025" target="_blank" rel="noopener">Mailpit inbox</a>
        to read the verification email (real inboxes are used only when SMTP is configured).
      </p>

      <p v-if="resent" class="success">Verification email sent again. Check your inbox.</p>
      <p v-if="error" class="error">{{ error }}</p>

      <div class="actions">
        <button class="btn" type="button" :disabled="loading || cooldown > 0" @click="resend">
          {{ resendLabel }}
        </button>
        <RouterLink class="btnGhost" to="/login">Go to Sign In</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { api } from '../api/client'

const route = useRoute()
const router = useRouter()

const email = ref('')
const loading = ref(false)
const error = ref(null)
const resent = ref(false)
const cooldown = ref(0)
let timer = null

const showDevInbox = computed(() => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL ?? ''
  return !apiUrl || apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')
})

const resendLabel = computed(() => {
  if (loading.value) return 'Sending…'
  if (cooldown.value > 0) return `Resend available in ${cooldown.value}s`
  return 'Resend verification email'
})

function startCooldown(seconds = 60) {
  cooldown.value = seconds
  timer = window.setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0) {
      window.clearInterval(timer)
      timer = null
    }
  }, 1000)
}

async function resend() {
  if (!email.value || cooldown.value > 0) return
  loading.value = true
  error.value = null
  resent.value = false
  try {
    await api.post('/api/auth/resend-verification', { email: email.value })
    resent.value = true
    startCooldown()
  } catch (e) {
    error.value = e?.response?.data?.message || e?.response?.data || 'Unable to resend verification email.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const raw = route.query.email
  const value = Array.isArray(raw) ? raw[0] : raw
  email.value = String(value ?? '').trim().toLowerCase()
  if (!email.value) router.replace({ name: 'register' })
})

onUnmounted(() => {
  if (timer) window.clearInterval(timer)
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
  width: min(560px, 100%);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px 22px;
  background: #fff;
  box-shadow: var(--shadow-md);
  text-align: center;
}
.icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 12px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(37, 99, 235, 0.1);
  color: var(--brand-blue);
  font-size: 28px;
}
.h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 950;
  color: var(--text-h);
}
.sub {
  margin: 10px 0 0;
  color: var(--text);
  font-weight: 650;
  line-height: 1.55;
}
.steps {
  margin: 18px 0 0;
  padding-left: 20px;
  text-align: left;
  color: var(--text);
  font-weight: 650;
  line-height: 1.55;
  font-size: 14px;
}
.devInbox {
  margin: 14px 0 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid var(--border);
  font-size: 13px;
  color: #334155;
  text-align: left;
}
.devInbox a {
  color: #175cd3;
  font-weight: 900;
}
.success {
  margin: 12px 0 0;
  color: #05603a;
  background: rgba(5, 96, 58, 0.08);
  border: 1px solid rgba(5, 96, 58, 0.18);
  padding: 8px 10px;
  border-radius: 12px;
  font-size: 14px;
}
.error {
  margin: 12px 0 0;
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border: 1px solid rgba(180, 35, 24, 0.2);
  padding: 8px 10px;
  border-radius: 12px;
  font-size: 14px;
  text-align: left;
}
.actions {
  margin-top: 18px;
  display: grid;
  gap: 10px;
}
.btn,
.btnGhost {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  padding: 12px 14px;
  border-radius: 12px;
  font-weight: 950;
  text-decoration: none;
  cursor: pointer;
}
.btn {
  border: 0;
  background: var(--brand-blue);
  color: #fff;
}
.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
.btnGhost {
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text-h);
}
</style>
