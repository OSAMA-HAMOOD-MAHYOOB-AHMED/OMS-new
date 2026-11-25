<template>
  <section class="page">
    <div class="head">
      <h1 class="h1">{{ tp('Store settings') }}</h1>
      <p class="sub">{{ tp('These details appear on the website. Leave a field empty to hide it.') }}</p>
    </div>

    <form class="card" novalidate @submit.prevent="save">
      <h2 class="h2">{{ tp('Promo strip') }}</h2>
      <div class="grid">
        <label class="field">
          <span>{{ tp('Text in English') }}</span>
          <input v-model="form.promoEn" type="text" maxlength="160" dir="ltr" placeholder="Use code WELCOME10 for 10% off" />
        </label>
        <label class="field">
          <span>{{ tp('Text in Arabic') }}</span>
          <input v-model="form.promoAr" type="text" maxlength="160" dir="rtl" placeholder="استخدم الكود WELCOME10 لخصم 10%" />
        </label>
      </div>

      <h2 class="h2">{{ tp('Contact') }}</h2>
      <div class="grid">
        <label class="field">
          <span>{{ tp('WhatsApp number (with country code)') }}</span>
          <input v-model="form.whatsapp" type="tel" dir="ltr" placeholder="9665XXXXXXXX" />
        </label>
        <label class="field">
          <span>{{ tp('Phone') }}</span>
          <input v-model="form.phone" type="tel" dir="ltr" placeholder="+966 5X XXX XXXX" />
        </label>
        <label class="field">
          <span>{{ tp('Email') }}</span>
          <input v-model="form.email" type="email" dir="ltr" />
        </label>
      </div>

      <h2 class="h2">{{ tp('Store location') }}</h2>
      <div class="grid">
        <label class="field">
          <span>{{ tp('Address in English') }}</span>
          <input v-model="form.addressEn" type="text" dir="ltr" />
        </label>
        <label class="field">
          <span>{{ tp('Address in Arabic') }}</span>
          <input v-model="form.addressAr" type="text" dir="rtl" />
        </label>
        <label class="field">
          <span>{{ tp('Opening hours in English') }}</span>
          <input v-model="form.hoursEn" type="text" dir="ltr" placeholder="Sat–Thu, 10am–10pm" />
        </label>
        <label class="field">
          <span>{{ tp('Opening hours in Arabic') }}</span>
          <input v-model="form.hoursAr" type="text" dir="rtl" placeholder="السبت–الخميس، 10 ص – 10 م" />
        </label>
        <label class="field wide">
          <span>{{ tp('Google Maps link') }}</span>
          <input v-model="form.mapUrl" type="url" dir="ltr" placeholder="https://maps.app.goo.gl/..." />
        </label>
      </div>

      <p v-if="error" class="msg error" role="alert">{{ tp(error) }}</p>
      <p v-if="ok" class="msg ok" role="status">{{ tp(ok) }}</p>
      <button class="btnPrimary" type="submit" :disabled="saving || loading">{{ saving ? tp('Saving…') : tp('Save settings') }}</button>
    </form>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { api } from '../../api/client'
import { useI18n } from '../../i18n'
import { loadSettings } from '../../stores/settings'

const { tp } = useI18n()
const form = reactive({})
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const ok = ref(null)

async function load() {
  loading.value = true
  try {
    Object.assign(form, (await api.get('/api/settings')).data)
  } catch {
    error.value = 'Could not load the settings.'
  } finally {
    loading.value = false
  }
}

async function save() {
  error.value = null
  ok.value = null
  saving.value = true
  try {
    await api.put('/api/settings', { ...form })
    ok.value = 'Settings saved.'
    await loadSettings(true)
  } catch (e) {
    error.value = (typeof e?.response?.data === 'string' && e.response.data) || 'Could not save the settings.'
  } finally {
    saving.value = false
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
.sub {
  margin: 6px 0 0;
  color: var(--text);
}
.card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.h2 {
  margin: 8px 0 0;
  font-size: 17px;
  font-family: var(--font-head);
  color: var(--gold-text);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  font-size: 13px;
  color: var(--muted);
}
.field.wide {
  grid-column: 1 / -1;
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
.btnPrimary {
  align-self: flex-start;
  height: 44px;
  padding: 0 20px;
  border: 0;
  border-radius: 12px;
  background: var(--ink);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
.msg {
  margin: 0;
  font-size: 14px;
}
.msg.error {
  color: var(--danger);
}
.msg.ok {
  color: var(--success);
}
</style>
