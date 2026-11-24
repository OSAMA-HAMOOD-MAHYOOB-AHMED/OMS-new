import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useApi } from '../../api/useApi'
import { Button, Card, Chip, Divider, Empty, ErrorBox, Loading, Row, Screen, StatusBadge } from '../../components/ui'
import { useCurrency } from '../../context/CurrencyContext'
import { colors } from '../../theme'
import { formatDate, ORDER_STATUSES, paymentMethodLabel } from '../../utils/format'

// Order lifecycle shown as a simple progress tracker.
const STEPS = ['Placed', 'Processing', 'Shipped', 'Delivered']

function Tracker({ status }) {
  if (status === 'Cancelled') {
    return <Text style={{ color: colors.danger, fontWeight: '600', marginTop: 8 }}>This order was cancelled.</Text>
  }
  const idx = Math.max(0, STEPS.indexOf(status))
  return (
    <View style={styles.tracker}>
      {STEPS.map((s, i) => (
        <View key={s} style={{ flex: 1, alignItems: 'center' }}>
          <View style={[styles.dot, i <= idx && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
            {i <= idx ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
          </View>
          <Text style={[styles.stepLabel, i <= idx && { color: colors.text, fontWeight: '700' }]}>{s}</Text>
        </View>
      ))}
    </View>
  )
}

export default function MyOrdersScreen({ navigation }) {
  const { data, error, loading, refreshing, refresh, reload } = useApi('/api/orders/mine', { initial: [] })
  const { format } = useCurrency()
  const [open, setOpen] = useState(null)
  const [filter, setFilter] = useState('All')

  if (loading) return <Loading label="Loading your orders…" />

  const orders = (data || []).filter((o) => filter === 'All' || o.orderStatus === filter)

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <ErrorBox message={error} onRetry={reload} />
      {(data || []).length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, rowGap: 8 }}>
          {['All', ...ORDER_STATUSES].map((s) => (
            <Chip key={s} label={s} active={filter === s} onPress={() => setFilter(s)} />
          ))}
        </View>
      ) : null}

      {orders.length === 0 && !error ? (
        <Empty
          icon="receipt-outline"
          title={filter === 'All' ? 'No orders yet' : `No ${filter.toLowerCase()} orders`}
          message={filter === 'All' ? 'Your orders will appear here after checkout.' : undefined}
          action={filter === 'All' ? <Button title="Start shopping" onPress={() => navigation.navigate('Shop')} /> : null}
        />
      ) : null}

      {orders.map((o) => {
        const expanded = open === o.orderID
        return (
          <Card key={o.orderID}>
            <Pressable onPress={() => setOpen(expanded ? null : o.orderID)}>
              <View style={styles.head}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.id}>#{o.orderID}</Text>
                  <Text style={styles.soft}>{formatDate(o.orderDate, true)}</Text>
                </View>
                <StatusBadge status={o.orderStatus} />
              </View>
              <View style={[styles.head, { marginTop: 8 }]}>
                <Text style={styles.soft}>
                  {o.items?.length || 0} item{o.items?.length === 1 ? '' : 's'} · {paymentMethodLabel(o.paymentMethod)}
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
                <Row label="Shipping" value={`${o.shippingService} — ${o.shippingCostLabel}`} />
                {o.shippingTrackingNumber ? <Row label="Tracking" value={o.shippingTrackingNumber} /> : null}
                {o.paymentStatus ? <Row label="Payment status" value={o.paymentStatus} /> : null}
                <Button
                  title="View invoice"
                  icon="document-text-outline"
                  variant="secondary"
                  small
                  style={{ marginTop: 10 }}
                  onPress={() => navigation.navigate('Invoice', { orderID: o.orderID })}
                />
              </View>
            ) : (
              <Text style={[styles.soft, { textAlign: 'center', marginTop: 10, fontSize: 12 }]}>Tap for details</Text>
            )}
          </Card>
        )
      })}
    </Screen>
  )
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  id: { fontWeight: '800', color: colors.text, fontSize: 15 },
  soft: { color: colors.textSoft, fontSize: 13 },
  total: { fontWeight: '800', color: colors.text, fontSize: 16 },
  tracker: { flexDirection: 'row', marginTop: 14 },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: { fontSize: 10, color: colors.muted, marginTop: 4 },
})
