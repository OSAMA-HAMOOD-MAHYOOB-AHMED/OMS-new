// Arabic / English for the app. Layout direction is applied with the `direction` style on the
// root view (see App.js), so switching language is instant and needs no app restart.
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getLocales } from 'expo-localization'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { cachedCategories } from '../api/categories'
import { appPhrases } from './appPhrases'
import { messages } from './messages'
import { arPhrases } from './phrases'

const STORAGE_KEY = 'oms_lang'

const AR = { ...arPhrases, ...appPhrases }
// Current language for tp(); kept in sync by LanguageProvider. Screens re-render on change
// because the navigation tree is remounted with the language as its key (App.js).
let currentLang = 'en'

/** Translate an English UI phrase (screens, validation and server messages). */
export function tp(text) {
  if (currentLang !== 'ar' || text === null || text === undefined) return text
  const key = String(text)
  return AR[key] ?? AR[key.trim()] ?? text
}

function deviceLanguage() {
  try {
    const code = getLocales()?.[0]?.languageCode || ''
    return code.toLowerCase() === 'ar' ? 'ar' : 'en'
  } catch {
    return 'en'
  }
}

function lookup(table, key) {
  return key.split('.').reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), table)
}

export function translate(lang, key, params) {
  let text = lookup(messages[lang], key)
  if (typeof text !== 'string') text = lookup(messages.en, key)
  if (typeof text !== 'string') return key
  if (params) text = text.replace(/\{(\w+)\}/g, (m, name) => (params[name] !== undefined ? String(params[name]) : m))
  return text
}

/** Catalog categories are not consistent ("Charger" vs "Chargers"), so group them by keyword. */
export function categoryGroup(category) {
  const c = String(category || '').toLowerCase()
  if (c.includes('power')) return 'powerbanks'
  if (c.includes('charg')) return 'chargers'
  if (c.includes('ear') || c.includes('head') || c.includes('buds')) return 'earphones'
  if (c.includes('case') || c.includes('cover')) return 'cases'
  return 'other'
}

const I18nContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(deviceLanguage())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'ar' || saved === 'en') setLang(saved)
      })
      .finally(() => setReady(true))
  }, [])

  const setLanguage = useCallback((next) => {
    const value = next === 'ar' ? 'ar' : 'en'
    setLang(value)
    AsyncStorage.setItem(STORAGE_KEY, value).catch(() => {})
  }, [])

  currentLang = lang

  const value = useMemo(() => {
    const t = (key, params) => translate(lang, key, params)
    return {
      lang,
      ready,
      isRtl: lang === 'ar',
      t,
      tp,
      setLanguage,
      toggleLanguage: () => setLanguage(lang === 'ar' ? 'en' : 'ar'),
      statusLabel: (status) => {
        const key = `status.${String(status || '').trim()}`
        const text = t(key)
        return text === key ? String(status || '') : text
      },
      // The admin's Arabic name for the category if set, else a built-in translation, else the name.
      categoryLabel: (category) => {
        const name = String(category || '')
        if (lang !== 'ar') return name
        const row = cachedCategories().find((c) => c.name === name)
        if (row?.nameAr) return row.nameAr
        const g = categoryGroup(name)
        return g === 'other' ? name : t(`cats.${g}`)
      },
      // Under `direction: 'rtl'` React Native treats Text textAlign 'left' as the start side,
      // so 'left' lines text up correctly in both languages. TextInput does not swap.
      textAlign: 'left',
      inputAlign: lang === 'ar' ? 'right' : 'left',
    }
  }, [lang, ready, setLanguage])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside LanguageProvider')
  return ctx
}
