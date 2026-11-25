import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { api } from '../api/client'
import { ROLES, useAuth } from '../context/AuthContext'
import { tp, useI18n } from '../i18n'
import { colors, fonts, radius } from '../theme'
import { formatApiError } from '../utils/apiError'
import { formatDate } from '../utils/format'
import { Button } from './ui'

/** Description / Specifications / Reviews for a product (same as the website's tabs). */
export default function ProductTabs({ product: p, onChanged }) {
  const { t, textAlign, inputAlign, categoryLabel } = useI18n()
  const { role } = useAuth()
  const [tab, setTab] = useState('desc')
  const [reviews, setReviews] = useState([])
  const [draft, setDraft] = useState({ rating: 0, comment: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const loadReviews = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/products/${encodeURIComponent(p.productID)}/reviews`)
      setReviews(data || [])
      const mine = (data || []).find((r) => r.mine)
      setDraft(mine ? { rating: mine.rating, comment: mine.comment || '' } : { rating: 0, comment: '' })
    } catch {
      setReviews([])
    }
  }, [p.productID])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  const mine = reviews.find((r) => r.mine)

  // Admin-entered "Label: value" lines plus the basics every product has.
  const specs = useMemo(() => {
    const rows = String(p.specs || '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const i = l.indexOf(':')
        return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : ['•', l]
      })
    return [[t('product.sku'), p.productID], [tp('Category'), categoryLabel(p.category)], ...rows]
  }, [p, t, categoryLabel])

  async function save() {
    setError(null)
    setSaving(true)
    try {
      await api.post(`/api/products/${encodeURIComponent(p.productID)}/reviews`, draft)
      await loadReviews()
      onChanged?.()
    } catch (e) {
      setError(formatApiError(e))
    } finally {
      setSaving(false)
    }
  }

  function remove(r) {
    Alert.alert(tp('Delete this review?'), '', [
      { text: tp('Cancel'), style: 'cancel' },
      {
        text: tp('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/products/${encodeURIComponent(p.productID)}/reviews/${r.reviewId}`)
            await loadReviews()
            onChanged?.()
          } catch (e) {
            setError(formatApiError(e))
          }
        },
      },
    ])
  }

  const tabs = [
    ['desc', t('product.description')],
    ['specs', tp('Specifications')],
    ['reviews', `${tp('Reviews')} (${p.reviewCount || 0})`],
  ]

  return (
    <View style={styles.wrap}>
      <View style={styles.tabs}>
        {tabs.map(([key, label]) => (
          <Pressable key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && styles.tabOn]} accessibilityRole="tab">
            <Text style={[styles.tabText, tab === key && styles.tabTextOn]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'desc' ? (
        <Text style={[styles.body, { textAlign }]}>{p.description || t('product.defaultDesc')}</Text>
      ) : null}

      {tab === 'specs'
        ? specs.map(([k, v], i) => (
            <View key={`${k}${i}`} style={[styles.specRow, i > 0 && styles.specBorder]}>
              <Text style={styles.specKey}>{k}</Text>
              <Text style={styles.specVal}>{v}</Text>
            </View>
          ))
        : null}

      {tab === 'reviews' ? (
        <View style={{ gap: 12 }}>
          <View style={styles.summary}>
            <Text style={styles.score}>{p.reviewCount ? Number(p.rating).toFixed(1) : '–'}</Text>
            <View style={{ gap: 2 }}>
              <StarRow value={p.rating} size={16} />
              <Text style={styles.muted}>
                {p.reviewCount || 0} {tp(p.reviewCount === 1 ? 'review' : 'reviews')}
              </Text>
            </View>
          </View>

          {role === ROLES.Customer ? (
            <View style={styles.form}>
              <Text style={[styles.formTitle, { textAlign }]}>{mine ? tp('Edit your review') : tp('Write a review')}</Text>
              <View style={styles.pickRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable key={n} onPress={() => setDraft((d) => ({ ...d, rating: n }))} hitSlop={6} accessibilityLabel={`${n} / 5`}>
                    <Ionicons name={n <= draft.rating ? 'star' : 'star-outline'} size={30} color={colors.gold} />
                  </Pressable>
                ))}
              </View>
              <TextInput
                value={draft.comment}
                onChangeText={(comment) => setDraft((d) => ({ ...d, comment }))}
                placeholder={tp('What did you think of this product?')}
                placeholderTextColor={colors.muted}
                multiline
                maxLength={1000}
                style={[styles.input, { textAlign: inputAlign }]}
              />
              {error ? <Text style={styles.error}>{tp(error)}</Text> : null}
              <Button title={tp('Post review')} onPress={save} loading={saving} disabled={!draft.rating} small />
              {mine ? (
                <Pressable onPress={() => remove(mine)} style={{ alignSelf: 'center', padding: 6 }}>
                  <Text style={styles.deleteText}>{tp('Delete my review')}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {reviews.length === 0 ? (
            <Text style={[styles.muted, { textAlign }]}>{tp('No reviews yet. Be the first to review this product.')}</Text>
          ) : (
            reviews.map((r) => (
              <View key={r.reviewId} style={styles.review}>
                <View style={styles.reviewHead}>
                  <Text style={styles.reviewName}>{r.name}</Text>
                  {r.verifiedBuyer ? (
                    <View style={styles.verified}>
                      <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                      <Text style={styles.verifiedText}>{tp('Verified buyer')}</Text>
                    </View>
                  ) : null}
                  <Text style={[styles.muted, { marginStart: 'auto' }]}>{formatDate(r.createdAt)}</Text>
                </View>
                <StarRow value={r.rating} size={13} />
                {r.comment ? <Text style={[styles.body, { textAlign, marginTop: 4 }]}>{r.comment}</Text> : null}
                {role === ROLES.Admin ? (
                  <Pressable onPress={() => remove(r)} style={{ paddingTop: 4 }}>
                    <Text style={styles.deleteText}>{tp('Delete')}</Text>
                  </Pressable>
                ) : null}
              </View>
            ))
          )}
        </View>
      ) : null}
    </View>
  )
}

function StarRow({ value, size }) {
  // Stars always fill from the left, like on the website.
  return (
    <View style={{ flexDirection: 'row', direction: 'ltr', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={value >= n ? 'star' : value >= n - 0.5 ? 'star-half' : 'star-outline'}
          size={size}
          color={colors.gold}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabOn: { borderBottomColor: colors.gold },
  tabText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  tabTextOn: { color: colors.ink },
  body: { fontSize: 14, lineHeight: 24, fontFamily: fonts.regular, color: '#3A352D' },
  specRow: { flexDirection: 'row', paddingVertical: 9, gap: 12 },
  specBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  specKey: { width: '38%', fontFamily: fonts.regular, color: colors.textSoft, fontSize: 13, textAlign: 'left' },
  specVal: { flex: 1, fontFamily: fonts.semibold, color: colors.text, fontSize: 13, textAlign: 'left' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  score: { fontFamily: fonts.headingHeavy, fontSize: 34, color: colors.ink },
  muted: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  form: { backgroundColor: colors.sand2, borderRadius: radius.md, padding: 14, gap: 10 },
  formTitle: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  pickRow: { flexDirection: 'row', direction: 'ltr', gap: 6, alignSelf: 'center' },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    backgroundColor: '#fff',
    padding: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
  },
  error: { color: colors.danger, fontFamily: fonts.regular, fontSize: 13 },
  deleteText: { color: colors.danger, fontFamily: fonts.semibold, fontSize: 13 },
  review: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10, gap: 3 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewName: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  verifiedText: { fontFamily: fonts.medium, fontSize: 11, color: colors.success },
})
