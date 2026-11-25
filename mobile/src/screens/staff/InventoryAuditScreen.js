import { useLayoutEffect } from 'react'
import { useApi } from '../../api/useApi'
import { Empty, ErrorBox, Loading, Screen } from '../../components/ui'
import { ActivityItem } from './WarehouseDashboardScreen'
import { tp } from '../../i18n'

export default function InventoryAuditScreen({ navigation, route }) {
  const { inventoryID, productName } = route.params || {}
  const { data, error, loading, refreshing, refresh, reload } = useApi(`/api/inventory/${encodeURIComponent(inventoryID)}/audit`, {
    params: { limit: 100 },
    initial: [],
  })

  useLayoutEffect(() => {
    if (productName) navigation.setOptions({ title: productName })
  }, [navigation, productName])

  if (loading) return <Loading />

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <ErrorBox message={error} onRetry={reload} />
      {(data || []).length === 0 && !error ? <Empty icon="time-outline" title={tp('No history yet')} /> : null}
      {(data || []).map((a) => (
        <ActivityItem key={a.auditID} a={{ ...a, productName: null }} />
      ))}
    </Screen>
  )
}
