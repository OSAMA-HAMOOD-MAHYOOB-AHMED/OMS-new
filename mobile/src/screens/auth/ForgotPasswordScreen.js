import { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, Text } from 'react-native'
import { api } from '../../api/client'
import { Button, Card, ErrorBox, InfoBox, Input, Screen } from '../../components/ui'
import { tp, useI18n } from '../../i18n'
import { colors, fonts } from '../../theme'
import { formatApiError } from '../../utils/apiError'

/**
 * Asks for a reset link. The link in the email opens the website, where the new password is set;
 * after that the customer signs in here as usual.
 */
export default function ForgotPasswordScreen({ navigation, route }) {
  const { textAlign } = useI18n()
  const [email, setEmail] = useState(route.params?.email || '')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  async function send() {
    setError(null)
    if (!email.trim()) {
      setError('Email address is required.')
      return
    }
    setBusy(true)
    try {
      await api.post('/api/auth/forgot-password', { email: email.trim().toLowerCase() })
      setSent(true)
    } catch (e) {
      setError(formatApiError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <Card>
          <Text style={[styles.title, { textAlign }]}>{tp('Forgot your password?')}</Text>
          <Text style={[styles.sub, { textAlign }]}>
            {tp('Enter the email on your account and we will send you a link to choose a new password.')}
          </Text>
          <ErrorBox message={error} />
          {sent ? (
            <>
              <InfoBox
                tone="success"
                message={`${tp('If an account exists for this email, we have sent a link to reset the password.')} ${tp(
                  'If it is not in your inbox within a few minutes, check your spam folder.',
                )}`}
              />
              <Button title={tp('Back to sign in')} onPress={() => navigation.goBack()} style={{ marginTop: 12 }} />
            </>
          ) : (
            <>
              <Input
                label={tp('Email')}
                value={email}
                onChangeText={setEmail}
                placeholder={tp('you@example.com')}
                keyboardType="email-address"
                autoComplete="email"
              />
              <Button title={tp('Send reset link')} onPress={send} loading={busy} />
            </>
          )}
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.heading, fontSize: 20, color: colors.text, marginBottom: 6 },
  sub: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: colors.textSoft, marginBottom: 12 },
})
