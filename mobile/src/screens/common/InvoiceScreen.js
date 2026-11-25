import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { useState } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { authHeader } from '../../api/client'
import { useApi } from '../../api/useApi'
import { Button, Card, Divider, ErrorBox, Loading, Row, Screen, StatusBadge } from '../../components/ui'
import { API_URL } from '../../config'
import { useCurrency } from '../../context/CurrencyContext'
import { tp, useI18n } from '../../i18n'
import { colors, fonts, radius } from '../../theme'
import { formatDate, paymentMethodLabel } from '../../utils/format'
import { logo } from '../../utils/images'

// Card orders are paid at checkout; cash orders only once delivered.
function isPaid(inv) {
  const status = String(inv.paymentStatus || '').toLowerCase()
  if (inv.paymentMethod !== 'Cash') return status !== 'failed'
  return String(inv.orderStatus || '').toLowerCase() === 'delivered' || status === 'completed' || status === 'paid'
}

export default function InvoiceScreen({ route }) {
  const orderID = route.params?.orderID
  const { code, rate, format } = useCurrency()
  const { textAlign } = useI18n()
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
        setPdfError(tp('Sharing is not available on this device.'))
      }
    } catch (e) {
      setPdfError(tp('Could not download the PDF.'))
    } finally {
      setPdfBusy(false)
    }
  }

  if (loading) return <Loading label={tp('Loading invoice…')} />
  if (!inv)
    return (
      <Screen>
        <ErrorBox message={error || tp('Invoice not found for this order.')} onRetry={reload} />
      </Screen>
    )

  const paid = isPaid(inv)

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroLabel, { textAlign }]}>{tp('INVOICE').toUpperCase()}</Text>
            <Text style={[styles.heroId, { textAlign }]} numberOfLines={1} ellipsizeMode="middle">
              {inv.orderId}
            </Text>
          </View>
        </View>
        <View style={styles.heroBottom}>
          <View>
            <Text style={[styles.heroSmall, { textAlign }]}>{tp(paid ? 'Total paid' : 'Amount due')}</Text>
            <Text style={styles.heroAmount}>{format(inv.totalPrice)}</Text>
          </View>
          <View style={[styles.payBadge, !paid && styles.payBadgeDue]}>
            <Text style={[styles.payBadgeText, !paid && { color: colors.goldText }]}>{tp(paid ? 'PAID' : 'PAYMENT DUE ON DELIVERY')}</Text>
          </View>
        </View>
      </View>

      <Card>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>{tp('Order')}</Text>
          <StatusBadge status={inv.orderStatus} />
        </View>
        <Row label={tp('Date')} value={formatDate(inv.orderDate, true)} />
        <Row label={tp('Customer')} value={inv.customerName} />
        <Row label={tp('Email')} value={inv.email} />
        <Row label={tp('Payment')} value={tp(paymentMethodLabel(inv.paymentMethod))} />
        <Row label={tp('Payment status')} value={tp(paid ? 'Paid' : 'Due on delivery')} />
        {inv.transactionReference ? <Row label={tp('Transaction')} value={inv.transactionReference} /> : null}
      </Card>

      <Card>
        <Text style={[styles.cardTitle, { marginBottom: 6, textAlign }]}>{tp('Items')}</Text>
        {(inv.items || []).map((it, i) => (
          <View key={it.productId} style={[styles.item, i > 0 && styles.itemBorder]}>
            <Text style={[styles.itemName, { textAlign }]}>{it.name}</Text>
            <View style={styles.itemRow}>
              <Text style={styles.itemMeta}>
                {it.quantity} × {format(it.unitPrice)}
              </Text>
              <Text style={styles.itemTotal}>{format(it.subtotal)}</Text>
            </View>
          </View>
        ))}
        <Divider />
        <Row label={tp('Shipping')} value={tp(inv.shippingCostLabel)} />
        {inv.discount > 0 ? (
          <Row label={`${tp('Discount')}${inv.couponCode ? ` (${inv.couponCode})` : ''}`} value={`-${format(inv.discount)}`} />
        ) : null}
        <Row label={tp(paid ? 'Total paid' : 'Amount due')} value={format(inv.totalPrice)} bold />
      </Card>

      <Card>
        <Text style={[styles.cardTitle, { marginBottom: 6, textAlign }]}>{tp('Shipping')}</Text>
        <Row label={tp('Service')} value={inv.shippingService} />
        <Row label={tp('Estimated delivery')} value={tp(inv.shippingEstimatedDelivery)} />
        <Row label={tp('Tracking number')} value={inv.shippingTrackingNumber} />
      </Card>

      <ErrorBox message={pdfError} />
      <Button title={tp('Download / share PDF')} icon="share-outline" onPress={sharePdf} loading={pdfBusy} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 12,
    borderBottomWidth: 4,
    borderBottomColor: colors.gold,
    gap: 18,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#fff' },
  heroLabel: { color: colors.gold, fontFamily: fonts.headingHeavy, fontSize: 20 },
  heroId: { color: '#fff', fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
  heroBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 },
  heroSmall: { color: '#CFC7B8', fontFamily: fonts.regular, fontSize: 12 },
  heroAmount: { color: '#fff', fontFamily: fonts.headingHeavy, fontSize: 26 },
  payBadge: { backgroundColor: '#E6F2EC', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, flexShrink: 1 },
  payBadgeDue: { backgroundColor: colors.sand },
  payBadgeText: { color: colors.success, fontFamily: fonts.bold, fontSize: 11, textAlign: 'center' },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  item: { paddingVertical: 8 },
  itemBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  itemName: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  itemMeta: { color: colors.textSoft, fontFamily: fonts.regular },
  itemTotal: { color: colors.text, fontFamily: fonts.bold },
})
