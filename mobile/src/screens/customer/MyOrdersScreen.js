import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useApi } from '../../api/useApi'
import { Button, Card, Chip, Divider, Empty, ErrorBox, Loading, Row, Screen, StatusBadge } from '../../components/ui'
import { useCart } from '../../context/CartContext'
import { useCurrency } from '../../context/CurrencyContext'
import { useI18n } from '../../i18n'
import { colors, fonts } from '../../theme'
import { formatDate, ORDER_STATUSES, paymentMethodLabel } from '../../utils/format'
import { tp } from '../../i18n'

// Order lifecycle shown as a progress tracker.
const STEPS = ['Placed', 'Processing', 'Shipped', 'Delivered']

function stepIndex(status) {
  const s = String(status || '').toLowerCase()
  if (s.includes('deliver') || s.includes('complete')) return 4
  if (s.includes('ship')) return 2
  if (s.includes('process')) return 1
  return 0
}

function Tracker({ status }) {
  const { t, statusLabel } = useI18n()
  if (String(status || '').toLowerCase().includes('cancel')) {
    return <Text style={styles.cancelled}>{t('orders.cancelled')}</Text>
  }
  const at = stepIndex(status)
  return (
    <View style={styles.tracker}>
      {STEPS.map((s, i) => {
        const done = at > i
        const current = at === i
        return (
          <View key={s} style={styles.step}>
            {i < STEPS.length - 1 ? <View style={[styles.line, done && { backgroundColor: colors.ink }]} /> : null}
            <View
              style={[
                styles.dot,
                done && { backgroundColor: colors.ink, borderColor: colors.ink },
                current && { backgroundColor: colors.gold, borderColor: colors.gold },
              ]}
            >
              {done ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
            </View>
            <Text style={[styles.stepLabel, (done || current) && { color: colors.text, fontFamily: fonts.semibold }]} numberOfLines={1}>
              {statusLabel(s)}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

export default function MyOrdersScreen({ navigation }) {
  const { data, error, loading, refreshing, refresh, reload } = useApi('/api/orders/mine', { initial: [] })
  const { format } = useCurrency()
  const { t, statusLabel, textAlign } = useI18n()
  const { add } = useCart()
  const [open, setOpen] = useState(null)
  const [filter, setFilter] = useState('All')

  if (loading) return <Loading label={t('orders.loading')} />

  const orders = (data || []).filter((o) => filter === 'All' || o.orderStatus === filter)

  function reorder(o) {
    for (const it of o.items || []) {
      const price = it.quantity > 0 ? it.subtotal / it.quantity : 0
      add({ productID: it.productID, name: it.name, price, stockLevel: 999, imageUrl: it.imageUrl }, it.quantity)
    }
    navigation.navigate('Cart')
  }

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <ErrorBox message={error} onRetry={reload} />
      {(data || []).length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, rowGap: 8 }}>
          {['All', ...ORDER_STATUSES].map((s) => (
            <Chip key={s} label={s === 'All' ? t('cats.all') : statusLabel(s)} active={filter === s} onPress={() => setFilter(s)} />
          ))}
        </View>
      ) : null}

      {orders.length === 0 && !error ? (
        <Empty
          icon="receipt-outline"
          title={filter === 'All' ? t('orders.empty') : t('orders.emptyFilter')}
          message={filter === 'All' ? t('orders.emptyHint') : undefined}
          action={filter === 'All' ? <Button title={t('orders.startShopping')} onPress={() => navigation.navigate('Shop')} /> : null}
        />
      ) : null}

      {orders.map((o) => {
        const expanded = open === o.orderID
        const n = o.items?.length || 0
        return (
          <Card key={o.orderID}>
            <Pressable onPress={() => setOpen(expanded ? null : o.orderID)} accessibilityRole="button">
              <View style={styles.head}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.id, { textAlign }]} numberOfLines={1} ellipsizeMode="middle">
                    #{o.orderID}
                  </Text>
                  <Text style={[styles.soft, { textAlign }]}>{formatDate(o.orderDate, true)}</Text>
                </View>
                <StatusBadge status={o.orderStatus} />
              </View>
              <View style={[styles.head, { marginTop: 8 }]}>
                <Text style={styles.soft}>
                  {n === 1 ? t('orders.oneItem') : t('orders.items', { n })} · {tp(paymentMethodLabel(o.paymentMethod))}
                </Text>
                <Text style={styles.total}>{format(o.totalPrice)}</Text>
              </View>
              <Tracker status={o.orderStatus} />
            </Pressable>

            {expanded ? (
              <View>
                <Divider />
                {(o.items || []).map((it) => (
                  <Row key={it.productID} label={`${it.quantity} × ${it.name}`} value={format(it.subtotal)} />
                ))}
                <Divider />
                <Row label={t('orders.shipping')} value={`${o.shippingService} — ${o.shippingCostLabel}`} />
                {o.shippingTrackingNumber ? <Row label={t('orders.tracking')} value={o.shippingTrackingNumber} /> : null}
                {o.paymentStatus ? <Row label={t('orders.paymentStatus')} value={o.paymentStatus} /> : null}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <Button
                    title={t('orders.invoice')}
                    icon="document-text-outline"
                    variant="secondary"
                    small
                    style={{ flex: 1 }}
                    onPress={() => navigation.navigate('Invoice', { orderID: o.orderID })}
                  />
                  <Button title={t('orders.reorder')} icon="refresh" small style={{ flex: 1 }} onPress={() => reorder(o)} />
                </View>
              </View>
            ) : (
              <Text style={[styles.soft, { textAlign: 'center', marginTop: 10, fontSize: 12 }]}>{t('orders.tapDetails')}</Text>
            )}
          </Card>
        )
      })}
    </Screen>
  )
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  id: { fontFamily: fonts.bold, color: colors.text, fontSize: 15 },
  soft: { color: colors.textSoft, fontSize: 13, fontFamily: fonts.regular },
  total: { fontFamily: fonts.headingHeavy, color: colors.text, fontSize: 17 },
  cancelled: { color: colors.danger, fontFamily: fonts.semibold, marginTop: 10 },
  tracker: { flexDirection: 'row', marginTop: 16 },
  step: { flex: 1, alignItems: 'center' },
  line: {
    position: 'absolute',
    top: 10,
    start: '50%',
    width: '100%',
    height: 2,
    backgroundColor: colors.borderStrong,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: { fontSize: 11, color: colors.muted, marginTop: 5, fontFamily: fonts.regular },
})
