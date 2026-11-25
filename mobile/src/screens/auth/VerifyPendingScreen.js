import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { Button, Card, ErrorBox, InfoBox, Screen, Subtitle, Title } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { colors } from '../../theme'
import { tp } from '../../i18n'

export default function VerifyPendingScreen({ navigation, route }) {
  const { resendVerification } = useAuth()
  const email = route.params?.email || ''
  const [info, setInfo] = useState(route.params?.message || null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function onResend() {
    setLoading(true)
    setError(null)
    const res = await resendVerification(email)
    setLoading(false)
    if (res.ok) setInfo(res.message || 'A new verification link has been sent.')
    else setError(res.message)
  }

  return (
    <Screen contentStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <Ionicons name="mail-unread-outline" size={64} color={colors.primary} />
      </View>
      <Title style={{ textAlign: 'center' }}>Verify your email</Title>
      <Subtitle style={{ textAlign: 'center', marginTop: 8, marginBottom: 20 }}>
        We sent a verification link to{'\n'}
        <Text style={{ fontWeight: '700', color: colors.text }}>{email}</Text>
      </Subtitle>
      <Card>
        <InfoBox tone="info" message={info} />
        <ErrorBox message={error} />
        <Text style={{ color: colors.textSoft, marginBottom: 16 }}>{tp('Open the link in the email (on this phone or any device), then come back and sign in.')}</Text>
        <Button title={tp('Back to sign in')} onPress={() => navigation.navigate('Login')} />
        <Button title={tp('Resend verification email')} variant="ghost" onPress={onResend} loading={loading} style={{ marginTop: 8 }} />
      </Card>
    </Screen>
  )
}
