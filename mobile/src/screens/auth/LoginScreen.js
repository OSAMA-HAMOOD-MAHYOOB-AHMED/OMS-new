import { useState } from 'react'
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native'
import { Button, Card, ErrorBox, InfoBox, Input, Screen } from '../../components/ui'
import { APP_NAME } from '../../config'
import { useAuth } from '../../context/AuthContext'
import { colors } from '../../theme'
import { logo } from '../../utils/images'

export default function LoginScreen({ navigation }) {
  const { login, sessionExpired, clearSessionExpired } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function onSubmit() {
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    setLoading(true)
    setError(null)
    clearSessionExpired()
    const res = await login(email, password)
    setLoading(false)
    if (res.status === 'unverified') {
      navigation.navigate('VerifyPending', { email: email.trim().toLowerCase(), message: res.message })
    } else if (res.status === 'failed') {
      setError(res.message)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen contentStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={styles.header}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brand}>{APP_NAME}</Text>
          <Text style={styles.tagline}>Phone accessories — order management</Text>
        </View>

        <Card>
          <Text style={styles.cardTitle}>Sign in</Text>
          {sessionExpired ? <InfoBox tone="warning" message="Your session expired. Please sign in again." /> : null}
          <ErrorBox message={error} />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secure
            autoComplete="password"
            onSubmitEditing={onSubmit}
            returnKeyType="go"
          />
          <Button title="Sign in" onPress={onSubmit} loading={loading} />
          <Text style={styles.hint}>Customers, sales staff, warehouse managers and admins all sign in here.</Text>
        </Card>

        <View style={styles.footer}>
          <Text style={{ color: colors.textSoft }}>New customer? </Text>
          <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
            Create an account
          </Text>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 96, height: 96, borderRadius: 20, marginBottom: 12, backgroundColor: '#fff' },
  brand: { fontSize: 24, fontWeight: '800', color: colors.text },
  tagline: { color: colors.textSoft, marginTop: 4 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 16 },
  hint: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  link: { color: colors.primary, fontWeight: '700' },
})
