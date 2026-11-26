import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { api } from '../../api/client'
import { useApi } from '../../api/useApi'
import { Button, Card, Empty, ErrorBox, Input, Loading, Screen, SectionTitle } from '../../components/ui'
import { tp, useI18n } from '../../i18n'
import { useCurrency } from '../../context/CurrencyContext'
import { colors, fonts } from '../../theme'
import { formatApiError } from '../../utils/apiError'
import { formatDate } from '../../utils/format'

const empty = { code: '', percent: '10', minSubtotal: '0' }

export default function AdminCouponsScreen() {
  const { textAlign } = useI18n()
  const { format } = useCurrency()
  const { data, error, loading, refreshing, refresh, reload } = useApi('/api/admin/coupons', { initial: [] })
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  async function save(coupon) {
    setFormError(null)
    setSaving(true)
    try {
      await api.post('/api/admin/coupons', coupon)
      setForm(empty)
      await reload()
    } catch (e) {
      setFormError(formatApiError(e))
    } finally {
      setSaving(false)
    }
  }

  function remove(c) {
    Alert.alert(tp('Delete this code?'), c.code, [
      { text: tp('Cancel'), style: 'cancel' },
      {
        text: tp('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/admin/coupons/${encodeURIComponent(c.code)}`)
            await reload()
          } catch (e) {
            setFormError(formatApiError(e))
          }
        },
      },
    ])
  }

  if (loading) return <Loading label={tp('Loading...')} />

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Text style={[styles.sub, { textAlign }]}>{tp('Customers type these codes in the cart to get a percentage off.')}</Text>
      <ErrorBox message={error} onRetry={reload} />

      <SectionTitle>{tp('New code')}</SectionTitle>
      <Card>
        <Input
          label={tp('Code')}
          value={form.code}
          onChangeText={(code) => setForm((f) => ({ ...f, code: code.toUpperCase() }))}
          autoCapitalize="characters"
          placeholder="WELCOME10"
          ltr
        />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Input
            style={{ flex: 1 }}
            label={tp('Discount %')}
            value={form.percent}
            onChangeText={(percent) => setForm((f) => ({ ...f, percent }))}
            keyboardType="number-pad"
            ltr
          />
          <Input
            style={{ flex: 1 }}
            label={tp('Minimum cart total (SAR)')}
            value={form.minSubtotal}
            onChangeText={(minSubtotal) => setForm((f) => ({ ...f, minSubtotal }))}
            keyboardType="decimal-pad"
            ltr
          />
        </View>
        <ErrorBox message={formError} />
        <Button
          title={tp('Save code')}
          icon="pricetag-outline"
          loading={saving}
          onPress={() =>
            save({ code: form.code.trim(), percent: Number(form.percent) || 0, minSubtotal: Number(form.minSubtotal) || 0, active: true })
          }
        />
      </Card>

      <SectionTitle>{tp('Discount codes')}</SectionTitle>
      {(data || []).length === 0 ? (
        <Empty icon="pricetag-outline" title={tp('No discount codes yet.')} />
      ) : (
        <Card>
          {data.map((c, i) => {
            const expired = c.expiresAt && new Date(c.expiresAt) < new Date()
            return (
              <View key={c.code} style={[styles.row, i > 0 && styles.border]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.code}>{c.code}</Text>
                  <Text style={styles.meta}>
                    {c.percent}% · {tp('Minimum')} {format(c.minSubtotal)} · {tp('Used')} {c.timesUsed}
                    {c.expiresAt ? ` · ${tp(expired ? 'Expired' : 'Expires')} ${formatDate(c.expiresAt)}` : ''}
                  </Text>
                </View>
                <Switch
                  value={c.active}
                  onValueChange={(active) =>
                    save({ code: c.code, percent: c.percent, minSubtotal: c.minSubtotal, expiresAt: c.expiresAt, active })
                  }
                  trackColor={{ true: colors.gold, false: colors.border }}
                  thumbColor="#fff"
                  accessibilityLabel={tp('Active')}
                />
                <Pressable onPress={() => remove(c)} hitSlop={8} accessibilityLabel={tp('Delete')}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </Pressable>
              </View>
            )
          })}
        </Card>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  sub: { fontFamily: fonts.regular, color: colors.textSoft, fontSize: 13, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  code: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, textAlign: 'left', writingDirection: 'ltr' },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSoft, textAlign: 'left' },
})
