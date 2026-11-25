import { computed, ref } from 'vue'
import { api } from '../api/client'
import { locale } from '../i18n'

// Store details the admin sets in "Store settings" (promo strip, WhatsApp, contact).
export const settings = ref({})
let loaded = null

export function loadSettings(force = false) {
  if (loaded && !force) return loaded
  loaded = api
    .get('/api/settings')
    .then((res) => {
      settings.value = res.data || {}
    })
    .catch(() => {
      loaded = null
    })
  return loaded
}

/** A setting in the current language (falls back to the other language). */
export function localized(key) {
  const en = settings.value[`${key}En`] || ''
  const ar = settings.value[`${key}Ar`] || ''
  return locale.value === 'ar' ? ar || en : en || ar
}

export const whatsappLink = computed(() =>
  settings.value.whatsapp ? `https://wa.me/${settings.value.whatsapp}` : '',
)
