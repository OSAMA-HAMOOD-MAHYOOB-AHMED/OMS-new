import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Text } from 'react-native'
import { Button, Card, ErrorBox, Input, Screen, Subtitle, Title } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { colors } from '../../theme'
import { validateRegistrationForm } from '../../utils/validation'
import { tp } from '../../i18n'

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth()
  const [fields, setFields] = useState({ name: '', email: '', phone: '', address: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (key) => (value) => setFields((f) => ({ ...f, [key]: value }))

  async function onSubmit() {
    const { valid, errors: errs } = validateRegistrationForm(fields)
    if (fields.password !== fields.confirm) errs.confirm = 'Passwords do not match.'
    setErrors(errs)
    if (!valid || errs.confirm) return

    setLoading(true)
    setError(null)
    const res = await register(fields)
    setLoading(false)
    if (!res.ok) {
      setError(res.message)
      return
    }
    navigation.replace('VerifyPending', { email: res.email, message: res.message, justRegistered: true })
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <Title>Create account</Title>
        <Subtitle style={{ marginBottom: 16 }}>Register as a customer to start ordering.</Subtitle>
        <Card>
          <ErrorBox message={error} />
          <Input label={tp('Full name')} value={fields.name} onChangeText={set('name')} autoCapitalize="words" error={errors.name} />
          <Input
            label={tp('Email')}
            value={fields.email}
            onChangeText={set('email')}
            keyboardType="email-address"
            autoComplete="email"
            error={errors.email}
          />
          <Input label={tp('Phone')} value={fields.phone} onChangeText={set('phone')} keyboardType="phone-pad" error={errors.phone} />
          <Input
            label={tp('Delivery address')}
            value={fields.address}
            onChangeText={set('address')}
            autoCapitalize="sentences"
            multiline
            error={errors.address}
          />
          <Input label={tp('Password')} value={fields.password} onChangeText={set('password')} secure error={errors.password} />
          <Input label={tp('Confirm password')} value={fields.confirm} onChangeText={set('confirm')} secure error={errors.confirm} />
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 12 }}>{tp('At least 8 characters with a letter and a number. We will email you a verification link.')}</Text>
          <Button title={tp('Create account')} onPress={onSubmit} loading={loading} />
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  )
}
