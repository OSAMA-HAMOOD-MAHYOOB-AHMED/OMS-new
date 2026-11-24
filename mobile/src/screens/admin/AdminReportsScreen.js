import { useMemo, useState } from 'react'
import { Text, View } from 'react-native'
import { useApi } from '../../api/useApi'
import { Card, Chip, Empty, ErrorBox, Loading, Row, Screen, SectionTitle, StatCard, StatusBadge } from '../../components/ui'
import { useCurrency } from '../../context/CurrencyContext'
import { colors } from '../../theme'
import { formatDate } from '../../utils/format'

const RANGES = [7, 30, 60]

export default function AdminReportsScreen() {
  const { format } = useCurrency()
  const { data, error, loading, refreshing, refresh, reload } = useApi('/api/admin/reports/sales', { params: { dailyLimit: 60 } })
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

  if (loading) return <Loading />

  const maxRevenue = Math.max(1, ...daily.map((r) => Number(r.revenue || 0)))
  const statusRows = data?.statusBreakdown || []
  const maxStatus = Math.max(1, ...statusRows.map((s) => Number(s.orders || 0)))

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <ErrorBox message={error} onRetry={reload} />
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        {RANGES.map((r) => (
          <Chip key={r} label={`Last ${r} days`} active={range === r} onPress={() => setRange(r)} />
        ))}
      </View>

      <View style={{ flexDirection: 'row', marginHorizontal: -4 }}>
        <StatCard icon="cash-outline" label="Revenue" value={format(totals.revenue)} tint={colors.success} />
        <StatCard icon="receipt-outline" label="Orders" value={String(totals.orders)} />
      </View>
      <View style={{ flexDirection: 'row', marginHorizontal: -4 }}>
        <StatCard icon="trending-up-outline" label="Avg. order value" value={format(totals.avg)} tint={colors.teal} />
      </View>

      <SectionTitle>Orders by status</SectionTitle>
      <Card>
        {statusRows.length === 0 ? <Text style={{ color: colors.textSoft }}>No data.</Text> : null}
        {statusRows.map((s) => (
          <View key={s.orderStatus} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <StatusBadge status={s.orderStatus} />
              <Text style={{ color: colors.textSoft, fontSize: 12 }}>
                {s.orders} order{Number(s.orders) === 1 ? '' : 's'} · {format(s.revenue)}
              </Text>
            </View>
            <View style={{ height: 8, backgroundColor: colors.bg, borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ width: `${(Number(s.orders) / maxStatus) * 100}%`, height: '100%', backgroundColor: colors.primary, borderRadius: 4 }} />
            </View>
          </View>
        ))}
      </Card>

      <SectionTitle>Daily revenue</SectionTitle>
      {daily.length === 0 ? (
        <Empty icon="bar-chart-outline" title="No sales in this period" />
      ) : (
        <Card>
          {daily.map((r) => (
            <View key={r.day} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}>{formatDate(r.day)}</Text>
                <Text style={{ color: colors.textSoft, fontSize: 12 }}>
                  {r.orders} order{Number(r.orders) === 1 ? '' : 's'} · <Text style={{ color: colors.text, fontWeight: '700' }}>{format(r.revenue)}</Text>
                </Text>
              </View>
              <View style={{ height: 8, backgroundColor: colors.bg, borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ width: `${(Number(r.revenue) / maxRevenue) * 100}%`, height: '100%', backgroundColor: colors.teal, borderRadius: 4 }} />
              </View>
            </View>
          ))}
          <Row label="Average per order" value={format(totals.avg)} />
        </Card>
      )}
    </Screen>
  )
}
