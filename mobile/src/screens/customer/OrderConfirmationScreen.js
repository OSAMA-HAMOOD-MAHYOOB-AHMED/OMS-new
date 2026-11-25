import { Ionicons } from '@expo/vector-icons'
import { Text, View } from 'react-native'
import { Button, Card, Row, Screen, Subtitle, Title } from '../../components/ui'
import { useCurrency } from '../../context/CurrencyContext'
import { colors } from '../../theme'
import { paymentMethodLabel } from '../../utils/format'
import { tp } from '../../i18n'

export default function OrderConfirmationScreen({ navigation, route }) {
  const order = route.params?.order || {}
  const { format } = useCurrency()

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginVertical: 16 }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: colors.successSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="checkmark" size={52} color={colors.success} />
        </View>
        <Title style={{ marginTop: 16, textAlign: 'center' }}>Thank you for your order!</Title>
        <Subtitle style={{ textAlign: 'center', marginTop: 6 }}>
          A confirmation email with your invoice is on its way.
        </Subtitle>
      </View>

      <Card>
        <Row label={tp('Order ID')} value={order.orderID} />
        <Row label={tp('Total')} value={format(order.totalPrice)} bold />
        <Row label={tp('Payment')} value={tp(paymentMethodLabel(order.paymentMethod))} />
        {order.transactionId ? <Row label={tp('Transaction')} value={order.transactionId} /> : null}
      </Card>

      <Card>
        <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 6 }}>{tp('Shipping')}</Text>
        <Row label={tp('Carrier')} value={order.shippingService || order.shippingCarrier} />
        <Row label={tp('Cost')} value={order.shippingCostLabel} />
        <Row label={tp('Estimated delivery')} value={order.shippingEstimatedDelivery} />
        <Row label={tp('Tracking number')} value={order.shippingTrackingNumber} />
      </Card>

      <Button title={tp('View invoice')} icon="document-text" onPress={() => navigation.replace('Invoice', { orderID: order.orderID })} />
      <Button
        title={tp('Continue shopping')}
        variant="secondary"
        style={{ marginTop: 10 }}
        onPress={() => navigation.navigate('CustomerHome', { screen: 'Shop' })}
      />
      <Button
        title={tp('My orders')}
        variant="ghost"
        style={{ marginTop: 4 }}
        onPress={() => navigation.navigate('CustomerHome', { screen: 'MyOrders' })}
      />
    </Screen>
  )
}
