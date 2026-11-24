import { Ionicons } from '@expo/vector-icons'
import { Text, View } from 'react-native'
import { useApi } from '../../api/useApi'
import { Button, Card, Empty, ErrorBox, Loading, Screen, SectionTitle, StatCard } from '../../components/ui'
import { colors } from '../../theme'
import { formatDate } from '../../utils/format'

export function ActivityItem({ a }) {
  const positive = a.deltaQuantity > 0
  return (
    <Card style={{ padding: 12, flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: positive ? colors.successSoft : colors.primarySoft,
        }}
      >
        <Ionicons name={positive ? 'arrow-down' : 'clipboard-outline'} size={18} color={positive ? colors.success : colors.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontWeight: '700', color: colors.text }} numberOfLines={1}>
          {a.productName || a.action}
        </Text>
        {a.productName || a.note ? (
          <Text style={{ color: colors.textSoft, fontSize: 12 }}>
            {[a.productName ? a.action : null, a.note].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
        <Text style={{ color: colors.muted, fontSize: 11 }}>{formatDate(a.createdAt, true)}</Text>
      </View>
      {a.deltaQuantity ? (
        <Text style={{ fontWeight: '800', color: positive ? colors.success : colors.danger }}>
          {positive ? '+' : ''}
          {a.deltaQuantity}
        </Text>
      ) : null}
    </Card>
  )
}

export default function WarehouseDashboardScreen({ navigation }) {
  const { data, error, loading, refreshing, refresh, reload } = useApi('/api/dashboard/warehouse')

  if (loading) return <Loading />

  const low = data?.lowStock || []
  const activity = data?.recentInventoryActivity || []

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <ErrorBox message={error} onRetry={reload} />
      {data ? (
        <>
          <View style={{ flexDirection: 'row', marginHorizontal: -4 }}>
            <StatCard icon="alert-circle-outline" label="Low stock items" value={String(low.length)} tint={low.length ? colors.warning : colors.success} />
            <StatCard icon="swap-vertical-outline" label="Recent movements" value={String(activity.length)} />
          </View>

          <SectionTitle right={<Button title="Inventory" small variant="ghost" onPress={() => navigation.navigate('Inventory')} />}>
            Low stock
          </SectionTitle>
          {low.length === 0 ? (
            <Card>
              <Text style={{ color: colors.success, fontWeight: '600' }}>All products are well stocked.</Text>
            </Card>
          ) : (
            low.map((p) => (
              <Card key={p.productID} style={{ padding: 12, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="warning" size={20} color={p.stockLevel === 0 ? colors.danger : colors.warning} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ fontWeight: '700', color: colors.text }} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={{ color: colors.textSoft, fontSize: 12 }}>{p.productID}</Text>
                </View>
                <Text style={{ fontWeight: '800', color: p.stockLevel === 0 ? colors.danger : colors.warning }}>
                  {p.stockLevel} left
                </Text>
              </Card>
            ))
          )}

          <SectionTitle>Recent inventory activity</SectionTitle>
          {activity.length === 0 ? <Empty icon="time-outline" title="No activity yet" /> : activity.map((a) => <ActivityItem key={a.auditID} a={a} />)}
        </>
      ) : null}
    </Screen>
  )
}
