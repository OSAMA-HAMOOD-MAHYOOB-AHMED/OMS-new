<template>
  <!-- Two steps on one page: ask for the email, then (from the email link) choose a new password. -->
  <div class="wrap">
    <div class="card">
      <img class="avatar" :src="siteLogoUrl" :alt="tp('Al-Wakeel Al-Shamel')" />

      <template v-if="!token">
        <h1 class="h2">{{ tp('Forgot your password?') }}</h1>
        <p class="sub">{{ tp('Enter the email on your account and we will send you a link to choose a new password.') }}</p>
        <form v-if="!sent" class="form" novalidate @submit.prevent="requestLink">
          <label class="field">
            <span class="lbl">{{ tp('Email Address') }}</span>
            <input v-model.trim="email" type="email" dir="ltr" autocomplete="email" :placeholder="tp('you@example.com')" required />
          </label>
          <button class="btn" type="submit" :disabled="busy || !email">{{ busy ? tp('Sending…') : tp('Send reset link') }}</button>
        </form>
        <p v-else class="okBox" role="status">
          {{ tp('If an account exists for this email, we have sent a link to reset the password.') }}
          {{ tp('If it is not in your inbox within a few minutes, check your spam folder.') }}
        </p>
      </template>

      <template v-else>
        <h1 class="h2">{{ tp('Choose a new password') }}</h1>
        <form v-if="!done" class="form" novalidate @submit.prevent="resetPassword">
          <label class="field">
            <span class="lbl">{{ tp('New password') }}</span>
            <input v-model="password" type="password" autocomplete="new-password" required />
          </label>
          <label class="field">
            <span class="lbl">{{ tp('Confirm password') }}</span>
            <input v-model="confirm" type="password" autocomplete="new-password" required />
          </label>
          <p class="hint">{{ tp('At least 8 characters with a letter and a number.') }}</p>
          <button class="btn" type="submit" :disabled="busy">{{ busy ? tp('Saving…') : tp('Save new password') }}</button>
        </form>
        <div v-else class="okBox" role="status">
          {{ tp('Your password has been changed. You can now sign in.') }}
          <RouterLink class="btn inline" :to="{ name: 'login' }">{{ tp('Sign in') }}</RouterLink>
        </div>
      </template>

      <p v-if="error" class="error" role="alert">{{ tp(error) }}</p>
      <RouterLink class="back" :to="{ name: 'login' }">{{ tp('Back to sign in') }}</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { api } from '../api/client'
import { useI18n } from '../i18n'
import { siteLogoUrl } from '../utils/images'

const { tp } = useI18n()
const route = useRoute()
const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))

const email = ref(typeof route.query.email === 'string' ? route.query.email : '')
const password = ref('')
const confirm = ref('')
const busy = ref(false)
const sent = ref(false)
const done = ref(false)
const error = ref(null)

function apiError(e, fallback) {
  const d = e?.response?.data
  return (typeof d === 'string' && d) || d?.message || fallback
}

async function requestLink() {
  error.value = null
  busy.value = true
  try {
    await api.post('/api/auth/forgot-password', { email: email.value })
    sent.value = true
  } catch (e) {
    error.value = apiError(e, 'Could not send the link. Please try again.')
  } finally {
    busy.value = false
  }
}

async function resetPassword() {
  error.value = null
  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match.'
    return
  }
  busy.value = true
  try {
    await api.post('/api/auth/reset-password', { token: token.value, password: password.value })
    done.value = true
  } catch (e) {
    error.value = apiError(e, 'Could not change the password. Please try again.')
  } finally {
    busy.value = false
  }
}
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
  padding: 24px 22px 20px;
  background: #fff;
  box-shadow: var(--shadow-md);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.avatar {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  margin: 0 auto 4px;
  object-fit: cover;
}
.h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
}
.sub {
  margin: 0;
  color: var(--text);
  line-height: 1.6;
}
.form {
  display: grid;
  gap: 12px;
  margin-top: 8px;
  text-align: start;
}
.field {
  display: grid;
  gap: 6px;
}
.lbl {
  font-size: 13px;
  font-weight: 600;
}
.field input {
  height: 46px;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  padding: 0 12px;
  font: inherit;
  font-size: 15px;
}
.hint {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}
.btn {
  height: 48px;
  border: 0;
  border-radius: 12px;
  background: var(--ink);
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  display: inline-grid;
  place-items: center;
  text-decoration: none;
}
.btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.btn.inline {
  margin-top: 12px;
  padding: 0 22px;
}
.okBox {
  margin: 8px 0 0;
  padding: 14px;
  border-radius: 12px;
  background: #e6f2ec;
  color: var(--success);
  line-height: 1.7;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.error {
  margin: 0;
  color: var(--danger);
  font-size: 14px;
}
.back {
  margin-top: 6px;
  color: var(--gold-text);
  font-weight: 600;
  font-size: 14px;
}
</style>
