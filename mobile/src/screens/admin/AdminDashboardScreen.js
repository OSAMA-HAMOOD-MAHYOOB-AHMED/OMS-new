import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useState } from 'react'
import { Text, View } from 'react-native'
import { api } from '../../api/client'
import { Button, Card, ErrorBox, Loading, Screen, SectionTitle, StatCard } from '../../components/ui'
import { useCurrency } from '../../context/CurrencyContext'
import { colors } from '../../theme'
import { formatApiError } from '../../utils/apiError'
import { RecentOrdersList } from '../staff/SalesDashboardScreen'
import { tp } from '../../i18n'

export default function AdminDashboardScreen({ navigation }) {
  const { format } = useCurrency()
  const [state, setState] = useState({ loading: true, refreshing: false, error: null, dash: null, products: [], users: [] })

  const load = useCallback(async (refreshing = false) => {
    setState((s) => ({ ...s, refreshing, error: null }))
    try {
      const [dash, products, users] = await Promise.all([
        api.get('/api/admin/dashboard'),
        api.get('/api/admin/products'),
        api.get('/api/admin/customers'),
      ])
      setState({ loading: false, refreshing: false, error: null, dash: dash.data, products: products.data, users: users.data })
    } catch (e) {
      setState((s) => ({ ...s, loading: false, refreshing: false, error: formatApiError(e) }))
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load(false)
    }, [load]),
  )

  if (state.loading) return <Loading />
  const { dash, products, users } = state
  const customers = users.filter((u) => u.role === 'Customer').length
  const lowStock = products.filter((p) => p.stockLevel <= 10)

  return (
    <Screen refreshing={state.refreshing} onRefresh={() => load(true)}>
      <ErrorBox message={state.error} onRetry={() => load(false)} />
      {dash ? (
        <>
          <View style={{ flexDirection: 'row', marginHorizontal: -4 }}>
            <StatCard icon="receipt-outline" label={tp('Orders')} value={String(dash.totalOrders)} />
            <StatCard icon="people-outline" label={tp('Customers')} value={String(customers)} tint={colors.teal} />
          </View>
          <View style={{ flexDirection: 'row', marginHorizontal: -4 }}>
            <StatCard icon="pricetags-outline" label={tp('Products')} value={String(products.length)} tint="#7c3aed" />
            <StatCard icon="wallet-outline" label={tp('Cash revenue')} value={format(dash.cashRevenue)} tint={colors.success} />
          </View>

          <Button title={tp('Sales reports')} icon="bar-chart-outline" variant="secondary" onPress={() => navigation.navigate('AdminReports')} style={{ marginBottom: 8 }} />
          <Button title={tp('Discount codes')} icon="pricetag-outline" variant="secondary" onPress={() => navigation.navigate('AdminCoupons')} style={{ marginBottom: 8 }} />

          {lowStock.length > 0 ? (
            <>
              <SectionTitle>{`${tp('Low Stock')} (${lowStock.length})`}</SectionTitle>
              <Card>
                {lowStock.slice(0, 6).map((p) => (
                  <View key={p.productID} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
                    <Text style={{ color: colors.text, flex: 1, marginEnd: 8 }} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={{ fontWeight: '800', color: p.stockLevel === 0 ? colors.danger : colors.warning }}>{p.stockLevel}</Text>
                  </View>
                ))}
              </Card>
            </>
          ) : null}

          <SectionTitle right={<Button title={tp('All orders')} small variant="ghost" onPress={() => navigation.navigate('AdminOrders')} />}>
            {tp('Recent Orders')}
          </SectionTitle>
          <RecentOrdersList
            orders={dash.recentOrders}
            format={format}
            onPressOrder={(o) => navigation.navigate('Invoice', { orderID: o.orderID })}
          />
        </>
      ) : null}
    </Screen>
  )
}
