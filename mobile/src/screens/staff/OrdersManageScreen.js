import { Ionicons } from '@expo/vector-icons'
import { useMemo, useState } from 'react'
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { api } from '../../api/client'
import { useApi } from '../../api/useApi'
import { Card, Chip, Empty, ErrorBox, InfoBox, Loading, StatusBadge } from '../../components/ui'
import { ROLES, useAuth } from '../../context/AuthContext'
import { useCurrency } from '../../context/CurrencyContext'
import { colors, radius } from '../../theme'
import { formatApiError } from '../../utils/apiError'
import { formatDate, ORDER_STATUSES, paymentMethodLabel } from '../../utils/format'
import { tp } from '../../i18n'

// Order list for Retail Salesperson and Admin, with status updates.
export default function OrdersManageScreen({ navigation }) {
  const { role } = useAuth()
  const isAdmin = role === ROLES.Admin
  const { format } = useCurrency()
  const { data, error, loading, refreshing, refresh, reload, setData } = useApi('/api/orders', {
    params: { limit: 200 },
    initial: [],
  })
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(null)
  const [busy, setBusy] = useState(null)
  const [message, setMessage] = useState(null)
  const [actionError, setActionError] = useState(null)

  const counts = useMemo(() => {
    const c = { All: data?.length || 0 }
    for (const o of data || []) c[o.orderStatus] = (c[o.orderStatus] || 0) + 1
    return c
  }, [data])

  const orders = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data || []).filter((o) => {
      if (filter !== 'All' && o.orderStatus !== filter) return false
      if (q && !`${o.orderID} ${o.email}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [data, filter, query])

  async function updateStatus(order, status) {
    if (status === order.orderStatus) return
    const run = async () => {
      setBusy(order.orderID)
      setActionError(null)
      setMessage(null)
      try {
        await api.patch(`/api/admin/orders/${encodeURIComponent(order.orderID)}/status`, { status })
        setData((list) => list.map((o) => (o.orderID === order.orderID ? { ...o, orderStatus: status } : o)))
        setMessage(`Order ${order.orderID} marked as ${status}.`)
      } catch (e) {
        setActionError(formatApiError(e))
      } finally {
        setBusy(null)
      }
    }
    if (status === 'Cancelled') {
      Alert.alert(tp('Cancel order?'), `${tp('Order')} ${order.orderID} ${tp('will be marked as cancelled.')}`, [
        { text: tp('Keep order'), style: 'cancel' },
        { text: tp('Cancel order'), style: 'destructive', onPress: run },
      ])
    } else {
      run()
    }
  }

  if (loading) return <Loading label={tp('Loading orders…')} />

  const header = (
    <View>
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={tp('Search by order ID or email')}
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCapitalize="none"
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {['All', ...ORDER_STATUSES].map((s) => (
          <Chip key={s} label={`${s}${counts[s] ? ` (${counts[s]})` : ''}`} active={filter === s} onPress={() => setFilter(s)} />
        ))}
      </ScrollView>
      <ErrorBox message={error} onRetry={reload} />
      <ErrorBox message={actionError} />
      <InfoBox tone="success" message={message} />
    </View>
  )

  return (
    <FlatList
      data={orders}
      keyExtractor={(o) => o.orderID}
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      ListHeaderComponent={header}
      refreshing={refreshing}
      onRefresh={refresh}
      ListEmptyComponent={!error ? <Empty icon="receipt-outline" title={tp('No orders match')} /> : null}
      renderItem={({ item: o }) => {
        const expanded = open === o.orderID
        return (
          <Card style={{ padding: 14 }}>
            <Pressable onPress={() => setOpen(expanded ? null : o.orderID)}>
              <View style={styles.head}>
                <Text style={styles.id} numberOfLines={1} ellipsizeMode="middle">
                  #{o.orderID}
                </Text>
                <StatusBadge status={o.orderStatus} />
              </View>
              <Text style={styles.soft} numberOfLines={1}>
                {o.email}
              </Text>
              <View style={[styles.head, { marginTop: 6 }]}>
                <Text style={[styles.soft, { fontSize: 12 }]}>
                  {formatDate(o.orderDate, true)} · {tp(paymentMethodLabel(o.paymentMethod))}
                </Text>
                <Text style={styles.total}>{format(o.totalPrice)}</Text>
              </View>
            </Pressable>
            {expanded ? (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.soft, { marginBottom: 8, fontWeight: '600' }]}>{tp('Change status')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 }}>
                  {ORDER_STATUSES.map((s) => (
                    <Chip key={s} label={s} active={o.orderStatus === s} onPress={() => busy ? null : updateStatus(o, s)} />
                  ))}
                </View>
                {busy === o.orderID ? <Text style={[styles.soft, { marginTop: 8 }]}>{tp('Saving…')}</Text> : null}
                {isAdmin ? (
                  <Text
                    style={{ color: colors.primary, fontWeight: '700', marginTop: 12 }}
                    onPress={() => navigation.navigate('Invoice', { orderID: o.orderID })}
                  >
                    View order details & invoice →
                  </Text>
                ) : null}
              </View>
            ) : null}
          </Card>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, minHeight: 44, marginStart: 8, fontSize: 15, color: colors.text },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  id: { fontWeight: '800', color: colors.text, fontSize: 15, flex: 1, marginEnd: 8 },
  soft: { color: colors.textSoft, marginTop: 4 },
  total: { fontWeight: '800', color: colors.text },
})
