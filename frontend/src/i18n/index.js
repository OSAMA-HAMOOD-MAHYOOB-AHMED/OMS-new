// Tiny i18n layer: Arabic (RTL) + English, no extra dependency.
// `t('home.title')` reads the active language and falls back to English, then the key.
import { computed, ref, watch } from 'vue'
import { messages } from './messages'
import { arPhrases } from './phrases'

const STORAGE_KEY = 'oms_lang'

function initialLocale() {
  try {
    // A shared link can force a language: ?lang=ar or ?lang=en
    const fromUrl = new URLSearchParams(window.location.search).get('lang')
    if (fromUrl === 'ar' || fromUrl === 'en') return fromUrl
  } catch {
    /* not in a browser */
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'ar' || saved === 'en') return saved
  } catch {
    /* storage unavailable */
  }
  const nav = typeof navigator !== 'undefined' ? String(navigator.language || '') : ''
  return nav.toLowerCase().startsWith('ar') ? 'ar' : 'en'
}

export const locale = ref(initialLocale())
export const isRtl = computed(() => locale.value === 'ar')

function applyDocument(lang) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
}
applyDocument(locale.value)

watch(locale, (lang) => {
  applyDocument(lang)
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* ignore */
  }
})

function lookup(table, key) {
  return key.split('.').reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), table)
}

export function t(key, params) {
  let text = lookup(messages[locale.value], key)
  if (typeof text !== 'string') text = lookup(messages.en, key)
  if (typeof text !== 'string') return key
  if (params) {
    text = text.replace(/\{(\w+)\}/g, (m, name) => (params[name] !== undefined ? String(params[name]) : m))
  }
  return text
}

/** Translate an English UI phrase (templates, validation and server messages). */
export function tp(text) {
  if (locale.value !== 'ar' || text === null || text === undefined) return text
  const key = String(text)
  return arPhrases[key] ?? arPhrases[key.trim()] ?? text
}

export function setLocale(lang) {
  locale.value = lang === 'ar' ? 'ar' : 'en'
}

export function toggleLocale() {
  setLocale(locale.value === 'ar' ? 'en' : 'ar')
}

/** Order statuses come from the API in English; show them in the active language. */
export function statusLabel(status) {
  const key = `status.${String(status || '').trim()}`
  const text = t(key)
  return text === key ? String(status || '') : text
}

/**
 * Product categories in the catalog are not consistent ("Charger" vs "Chargers"),
 * so group them by keyword. Returns chargers | powerbanks | earphones | cases | other.
 */
export function categoryGroup(category) {
  const c = String(category || '').toLowerCase()
  if (c.includes('power')) return 'powerbanks'
  if (c.includes('charg')) return 'chargers'
  if (c.includes('ear') || c.includes('head') || c.includes('buds')) return 'earphones'
  if (c.includes('case') || c.includes('cover')) return 'cases'
  return 'other'
}

export function categoryLabel(category) {
  const group = categoryGroup(category)
  return group === 'other' ? String(category || '') : t(`cats.${group}`)
}

export function useI18n() {
  return { t, tp, locale, isRtl, setLocale, toggleLocale, statusLabel, categoryGroup, categoryLabel }
}
