import { Ionicons } from '@expo/vector-icons'
import { Text, View } from 'react-native'
import { Button, Card, Row, Screen, Subtitle, Title } from '../../components/ui'
import { useCurrency } from '../../context/CurrencyContext'
import { colors } from '../../theme'
import { paymentMethodLabel } from '../../utils/format'

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
        <Row label="Order ID" value={order.orderID} />
        <Row label="Total" value={format(order.totalPrice)} bold />
        <Row label="Payment" value={paymentMethodLabel(order.paymentMethod)} />
        {order.transactionId ? <Row label="Transaction" value={order.transactionId} /> : null}
      </Card>

      <Card>
        <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 6 }}>Shipping</Text>
        <Row label="Carrier" value={order.shippingService || order.shippingCarrier} />
        <Row label="Cost" value={order.shippingCostLabel} />
        <Row label="Estimated delivery" value={order.shippingEstimatedDelivery} />
        <Row label="Tracking number" value={order.shippingTrackingNumber} />
      </Card>

      <Button title="View invoice" icon="document-text" onPress={() => navigation.replace('Invoice', { orderID: order.orderID })} />
      <Button
        title="Continue shopping"
        variant="secondary"
        style={{ marginTop: 10 }}
        onPress={() => navigation.navigate('CustomerHome', { screen: 'Shop' })}
      />
      <Button
        title="My orders"
        variant="ghost"
        style={{ marginTop: 4 }}
        onPress={() => navigation.navigate('CustomerHome', { screen: 'MyOrders' })}
      />
    </Screen>
  )
}
