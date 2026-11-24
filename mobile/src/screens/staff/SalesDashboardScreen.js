import { Text, View } from 'react-native'
import { useApi } from '../../api/useApi'
import { Button, Card, Empty, ErrorBox, Loading, Screen, SectionTitle, StatCard, StatusBadge } from '../../components/ui'
import { useCurrency } from '../../context/CurrencyContext'
import { colors } from '../../theme'
import { formatDate, paymentMethodLabel } from '../../utils/format'

// Shared by the Retail Salesperson dashboard and (with a different endpoint) the admin dashboard.
export function RecentOrdersList({ orders, format, onPressOrder }) {
  if (!orders?.length) return <Empty icon="receipt-outline" title="No orders yet" />
  return orders.map((o) => (
    <Card key={o.orderID} onPress={onPressOrder ? () => onPressOrder(o) : undefined} style={{ padding: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontWeight: '800', color: colors.text, flex: 1, marginRight: 8 }} numberOfLines={1} ellipsizeMode="middle">
          #{o.orderID}
        </Text>
        <StatusBadge status={o.orderStatus} />
      </View>
      <Text style={{ color: colors.textSoft, marginTop: 4 }} numberOfLines={1}>
        {o.email}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <Text style={{ color: colors.textSoft, fontSize: 12 }}>
          {formatDate(o.orderDate, true)} · {paymentMethodLabel(o.paymentMethod)}
        </Text>
        <Text style={{ fontWeight: '800', color: colors.text }}>{format(o.totalPrice)}</Text>
      </View>
    </Card>
  ))
}

export default function SalesDashboardScreen({ navigation }) {
  const { data, error, loading, refreshing, refresh, reload } = useApi('/api/dashboard/sales')
  const { format } = useCurrency()

  if (loading) return <Loading />

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <ErrorBox message={error} onRetry={reload} />
      {data ? (
        <>
          <View style={{ flexDirection: 'row', marginHorizontal: -4 }}>
            <StatCard icon="receipt-outline" label="Total orders" value={String(data.totalOrders)} />
            <StatCard icon="cash-outline" label="Cash orders" value={String(data.cashOrders)} tint={colors.teal} />
          </View>
          <View style={{ flexDirection: 'row', marginHorizontal: -4 }}>
            <StatCard icon="wallet-outline" label="Cash revenue" value={format(data.cashRevenue)} tint={colors.success} />
          </View>
          <SectionTitle right={<Button title="All orders" small variant="ghost" onPress={() => navigation.navigate('SalesOrders')} />}>
            Recent orders
          </SectionTitle>
          <RecentOrdersList orders={data.recentOrders} format={format} />
        </>
      ) : null}
    </Screen>
  )
}
