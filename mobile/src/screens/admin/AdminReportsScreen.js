import { useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useApi } from '../../api/useApi'
import { Card, Chip, Empty, ErrorBox, Loading, Row, Screen, SectionTitle, StatCard } from '../../components/ui'
import { useCurrency } from '../../context/CurrencyContext'
import { tp, useI18n } from '../../i18n'
import { colors, fonts } from '../../theme'
import { formatDate } from '../../utils/format'

const RANGES = [7, 30, 60]

// The order lifecycle used everywhere in the system (same colors as the website report).
const STATUSES = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
const STATUS_COLORS = {
  Placed: '#8A8273',
  Processing: '#B45309',
  Shipped: '#B8914F',
  Delivered: '#1F7A4D',
  Cancelled: '#9A2A16',
}

function normalizeStatus(raw) {
  const s = String(raw || '').toLowerCase()
  if (s.includes('cancel')) return 'Cancelled'
  if (s.includes('deliver') || s.includes('complete')) return 'Delivered'
  if (s.includes('ship')) return 'Shipped'
  if (s.includes('process')) return 'Processing'
  return 'Placed'
}

export default function AdminReportsScreen() {
  const { format } = useCurrency()
  const { statusLabel, textAlign } = useI18n()
  const { data, error, loading, refreshing, refresh, reload } = useApi('/api/admin/reports/sales', { params: { dailyLimit: 90 } })
  const [range, setRange] = useState(30)

  const daily = useMemo(() => {
    const rows = [...(data?.daily || [])].sort((a, b) => new Date(b.day) - new Date(a.day))
    const cutoff = Date.now() - range * 24 * 60 * 60 * 1000
    return rows.filter((r) => new Date(r.day).getTime() >= cutoff)
  }, [data, range])

  const totals = useMemo(() => {
    const revenue = daily.reduce((a, r) => a + Number(r.revenue || 0), 0)
    const orders = daily.reduce((a, r) => a + Number(r.orders || 0), 0)
    return { revenue, orders, avg: orders ? revenue / orders : 0 }
  }, [daily])

  const statusRows = useMemo(() => {
    const acc = Object.fromEntries(STATUSES.map((s) => [s, { orders: 0, revenue: 0 }]))
    for (const row of data?.statusBreakdown || []) {
      const s = normalizeStatus(row.orderStatus)
      acc[s].orders += Number(row.orders) || 0
      acc[s].revenue += Number(row.revenue) || 0
    }
    const total = Object.values(acc).reduce((n, x) => n + x.orders, 0) || 1
    return STATUSES.map((s) => ({ status: s, ...acc[s], share: (acc[s].orders / total) * 100 }))
  }, [data])

  if (loading) return <Loading label={tp('Loading...')} />

  const maxRevenue = Math.max(1, ...daily.map((r) => Number(r.revenue || 0)))
  const delivered = statusRows.find((s) => s.status === 'Delivered')?.revenue || 0

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <ErrorBox message={error} onRetry={reload} />
      <View style={styles.ranges}>
        {RANGES.map((r) => (
          <Chip key={r} label={tp('Last {n} days').replace('{n}', r)} active={range === r} onPress={() => setRange(r)} />
        ))}
      </View>

      <View style={styles.statRow}>
        <StatCard icon="cash-outline" label={tp('Gross revenue')} value={format(totals.revenue)} tint={colors.goldText} />
        <StatCard icon="receipt-outline" label={tp('Total orders')} value={String(totals.orders)} tint={colors.ink} />
      </View>
      <View style={styles.statRow}>
        <StatCard icon="trending-up-outline" label={tp('Avg order value')} value={format(totals.avg)} tint={colors.goldText} />
        <StatCard icon="checkmark-circle-outline" label={tp('Delivered revenue')} value={format(delivered)} tint={colors.success} />
      </View>

      <SectionTitle>{tp('Order Status Breakdown')}</SectionTitle>
      <Card>
        {statusRows.map((s) => (
          <View key={s.status} style={styles.statusItem}>
            <View style={styles.statusTop}>
              <View style={styles.statusName}>
                <View style={[styles.dot, { backgroundColor: STATUS_COLORS[s.status] }]} />
                <Text style={styles.statusText}>{statusLabel(s.status)}</Text>
              </View>
              <Text style={styles.small}>
                {s.orders} {tp('orders')} · {format(s.revenue)}
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${s.share}%`, backgroundColor: STATUS_COLORS[s.status] }]} />
            </View>
          </View>
        ))}
      </Card>

      <SectionTitle>{tp('Daily revenue')}</SectionTitle>
      {daily.length === 0 ? (
        <Empty icon="bar-chart-outline" title={tp('No sales in this period')} />
      ) : (
        <Card>
          {daily.map((r) => (
            <View key={r.day} style={styles.statusItem}>
              <View style={styles.statusTop}>
                <Text style={[styles.statusText, { textAlign }]}>{formatDate(r.day)}</Text>
                <Text style={styles.small}>
                  {r.orders} {tp('orders')} · <Text style={styles.strong}>{format(r.revenue)}</Text>
                </Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${(Number(r.revenue) / maxRevenue) * 100}%`, backgroundColor: colors.gold }]} />
              </View>
            </View>
          ))}
          <Row label={tp('Average per order')} value={format(totals.avg)} />
        </Card>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  ranges: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12, rowGap: 8 },
  statRow: { flexDirection: 'row', marginHorizontal: -4 },
  statusItem: { marginBottom: 12 },
  statusTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 },
  statusName: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
  small: { color: colors.textSoft, fontFamily: fonts.regular, fontSize: 12, flexShrink: 1 },
  strong: { color: colors.text, fontFamily: fonts.bold },
  track: { height: 8, backgroundColor: colors.sand2, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
})
