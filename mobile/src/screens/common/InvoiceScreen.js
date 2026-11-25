import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { authHeader } from '../../api/client'
import { useApi } from '../../api/useApi'
import { Button, Card, Divider, ErrorBox, Loading, Row, Screen, StatusBadge } from '../../components/ui'
import { API_URL } from '../../config'
import { useCurrency } from '../../context/CurrencyContext'
import { colors } from '../../theme'
import { formatDate, paymentMethodLabel } from '../../utils/format'
import { tp } from '../../i18n'

export default function InvoiceScreen({ route }) {
  const orderID = route.params?.orderID
  const { code, rate, format } = useCurrency()
  const { data: inv, error, loading, reload } = useApi(`/api/invoices/${encodeURIComponent(orderID)}`)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [pdfError, setPdfError] = useState(null)

  async function sharePdf() {
    setPdfBusy(true)
    setPdfError(null)
    try {
      const url = `${API_URL}/api/invoices/${encodeURIComponent(orderID)}/pdf?currencyCode=${encodeURIComponent(code)}&rate=${rate}`
      const target = new File(Paths.cache, `invoice-${orderID}.pdf`)
      const file = await File.downloadFileAsync(url, target, { headers: authHeader(), idempotent: true })
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: `Invoice ${orderID}`, UTI: 'com.adobe.pdf' })
      } else {
        setPdfError('Sharing is not available on this device.')
      }
    } catch (e) {
      setPdfError(e?.message ? `Could not download the PDF: ${e.message}` : 'Could not download the PDF.')
    } finally {
      setPdfBusy(false)
    }
  }

  if (loading) return <Loading label={tp('Loading invoice…')} />
  if (!inv) return <Screen><ErrorBox message={error || 'Invoice not found.'} onRetry={reload} /></Screen>

  return (
    <Screen>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: colors.textSoft }}>INVOICE #{inv.invoiceId}</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{tp('Order')} {inv.orderId}</Text>
          </View>
          <StatusBadge status={inv.orderStatus} />
        </View>
        <Divider />
        <Row label={tp('Date')} value={formatDate(inv.orderDate, true)} />
        <Row label={tp('Customer')} value={inv.customerName} />
        <Row label={tp('Email')} value={inv.email} />
        <Row label={tp('Payment')} value={tp(paymentMethodLabel(inv.paymentMethod))} />
        {inv.paymentStatus ? <Row label={tp('Payment status')} value={inv.paymentStatus} /> : null}
        {inv.transactionReference ? <Row label={tp('Transaction')} value={inv.transactionReference} /> : null}
      </Card>

      <Card>
        <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 6 }}>{tp('Items')}</Text>
        {(inv.items || []).map((it) => (
          <View key={it.productId} style={{ paddingVertical: 6 }}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{it.name}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.textSoft }}>
                {it.quantity} × {format(it.unitPrice)}
              </Text>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{format(it.subtotal)}</Text>
            </View>
          </View>
        ))}
        <Divider />
        <Row label={tp('Shipping')} value={inv.shippingCostLabel} />
        <Row label={tp('Total')} value={format(inv.totalPrice)} bold />
      </Card>

      <Card>
        <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 6 }}>{tp('Shipping')}</Text>
        <Row label={tp('Service')} value={inv.shippingService} />
        <Row label={tp('Estimated delivery')} value={inv.shippingEstimatedDelivery} />
        <Row label={tp('Tracking number')} value={inv.shippingTrackingNumber} />
      </Card>

      <ErrorBox message={pdfError} />
      <Button title={tp('Download / share PDF')} icon="share-outline" onPress={sharePdf} loading={pdfBusy} />
    </Screen>
  )
}
