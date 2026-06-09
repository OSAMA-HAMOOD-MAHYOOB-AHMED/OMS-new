<template>
  <div class="wrap">
    <div class="card">
      <img class="avatar" :src="siteLogoUrl" alt="Al-Wakeel Al-Shamel" />
      <h2 class="h2">Create Account</h2>
      <p class="sub">Sign up with a valid email — we'll send a verification link before you can sign in.</p>

      <form class="form" novalidate @submit.prevent="submit">
        <label class="field" :class="{ invalid: showError('name') }">
          <span class="lbl">Full Name</span>
          <div class="input">
            <span class="glyph" aria-hidden="true">👤</span>
            <input
              v-model.trim="name"
              placeholder="Ahmed Ali"
              autocomplete="name"
              @blur="touch('name')"
              @input="revalidate('name')"
            />
          </div>
          <span v-if="showError('name')" class="fieldError">{{ errors.name }}</span>
        </label>

        <label class="field" :class="{ invalid: showError('phone') }">
          <span class="lbl">Phone</span>
          <div class="input">
            <span class="glyph" aria-hidden="true">📞</span>
            <input
              v-model.trim="phone"
              placeholder="+966 50 123 4567"
              autocomplete="tel"
              @blur="touch('phone')"
              @input="revalidate('phone')"
            />
          </div>
          <span v-if="showError('phone')" class="fieldError">{{ errors.phone }}</span>
        </label>

        <label class="field" :class="{ invalid: showError('email') }">
          <span class="lbl">Email Address</span>
          <div class="input">
            <span class="glyph" aria-hidden="true">✉</span>
            <input
              v-model.trim="email"
              type="email"
              placeholder="you@gmail.com"
              autocomplete="email"
              @blur="touch('email')"
              @input="revalidate('email')"
            />
          </div>
          <span v-if="showError('email')" class="fieldError">{{ errors.email }}</span>
        </label>

        <label class="field" :class="{ invalid: showError('address') }">
          <span class="lbl">Address</span>
          <div class="input">
            <span class="glyph" aria-hidden="true">📍</span>
            <input
              v-model.trim="address"
              placeholder="Riyadh, Saudi Arabia"
              autocomplete="street-address"
              @blur="touch('address')"
              @input="revalidate('address')"
            />
          </div>
          <span v-if="showError('address')" class="fieldError">{{ errors.address }}</span>
        </label>

        <label class="field" :class="{ invalid: showError('password') }">
          <span class="lbl">Password</span>
          <div class="input">
            <span class="glyph" aria-hidden="true">🔒</span>
            <input
              v-model="password"
              type="password"
              placeholder="At least 8 characters"
              autocomplete="new-password"
              @blur="touch('password')"
              @input="revalidate('password')"
            />
          </div>
          <span v-if="showError('password')" class="fieldError">{{ errors.password }}</span>
          <span v-else class="hint">Use at least 8 characters with letters and numbers.</span>
        </label>

        <button class="btn" type="submit" :disabled="auth.loading || !canSubmit">
          {{ auth.loading ? 'Creating account…' : 'Create Account' }}
        </button>
      </form>

      <p v-if="auth.error" class="error">{{ auth.error }}</p>

      <p class="muted center">
        Already have an account?
        <RouterLink class="link" to="/login">Sign In</RouterLink>
      </p>

      <div class="divider" />

      <RouterLink class="adminLink" to="/admin/login">Admin Login →</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { siteLogoUrl } from '../utils/images'
import { validateRegistrationForm } from '../utils/validation'

const auth = useAuthStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const phone = ref('')
const address = ref('')
const password = ref('')
const submitted = ref(false)

const touched = reactive({
  name: false,
  email: false,
  phone: false,
  address: false,
  password: false,
})

const errors = reactive({
  name: null,
  email: null,
  phone: null,
  address: null,
  password: null,
})

const formFields = computed(() => ({
  name: name.value,
  email: email.value,
  phone: phone.value,
  address: address.value,
  password: password.value,
}))

const validation = computed(() => validateRegistrationForm(formFields.value))
const canSubmit = computed(() => validation.value.valid && !auth.loading)

function touch(field) {
  touched[field] = true
  applyValidation()
}

function showError(field) {
  return (touched[field] || submitted.value) && errors[field]
}

function applyValidation() {
  const { errors: next } = validateRegistrationForm(formFields.value)
  for (const key of Object.keys(errors)) errors[key] = next[key] ?? null
}

function revalidate(field) {
  if (touched[field] || submitted.value) applyValidation()
}

async function submit() {
  submitted.value = true
  applyValidation()
  if (!validation.value.valid) return

  const result = await auth.register({
    name: name.value,
    email: email.value,
    phone: phone.value,
    address: address.value,
    role: 'Customer',
    password: password.value,
  })
  if (!result.ok) return

  await router.push({
    name: 'verifyEmailPending',
    query: { email: result.email || email.value },
  })
}

applyValidation()
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
  padding: 22px 22px 18px;
  background: #ffffff;
  box-shadow: var(--shadow-md);
  text-align: center;
}
.avatar {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  object-fit: cover;
  margin: 0 auto 12px;
  box-shadow: var(--shadow-sm);
}
.h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 950;
  letter-spacing: -0.6px;
  color: var(--text-h);
}
.sub {
  margin: 8px 0 0;
  color: var(--muted);
  font-weight: 650;
  line-height: 1.45;
}
.form {
  display: grid;
  gap: 12px;
  margin-top: 16px;
  text-align: left;
}
.field {
  display: grid;
  gap: 8px;
}
.field.invalid .input {
  border-color: #f04438;
  background: #fffbfa;
}
.fieldError {
  font-size: 12px;
  font-weight: 750;
  color: #b42318;
}
.hint {
  font-size: 11px;
  color: var(--muted);
  font-weight: 650;
}
.lbl {
  font-size: 12px;
  font-weight: 900;
  color: #334155;
}
.input {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  background: #fff;
}
.glyph {
  color: var(--muted);
  width: 18px;
  display: grid;
  place-items: center;
}
input {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text-h);
  font-weight: 650;
}
.btn {
  border: 0;
  cursor: pointer;
  background: var(--brand-blue);
  color: white;
  padding: 12px 14px;
  border-radius: 12px;
  font-weight: 950;
  margin-top: 4px;
  box-shadow: var(--shadow-sm);
}
.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
.muted {
  margin-top: 14px;
  color: var(--text);
  font-size: 14px;
}
.center {
  text-align: center;
}
.link {
  font-weight: 900;
}
.error {
  margin-top: 10px;
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border: 1px solid rgba(180, 35, 24, 0.2);
  padding: 8px 10px;
  border-radius: 12px;
  text-align: left;
}
.divider {
  height: 1px;
  background: var(--border);
  margin: 16px 0 12px;
}
.adminLink {
  display: inline-block;
  color: #334155;
  text-decoration: none;
  font-size: 13px;
  font-weight: 800;
}
.adminLink:hover {
  color: var(--brand-blue);
}
</style>
