import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardEvent,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { KlotLogo } from '../../../components/KlotLogo'
import { CheckCircleIcon, Input, Text } from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import { useRegisterStore } from '../../../store/useRegisterStore'
import type { AuthScreenProps } from '../../../navigation/types'

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function formatBirthdate(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function validateBirthdate(date: string): { valid: boolean; ageError: boolean } {
  if (date.length !== 10) return { valid: false, ageError: false }
  const [day, month, year] = date.split('/').map(Number)
  const d = new Date(year, month - 1, day)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return { valid: false, ageError: false }
  }
  const now = new Date()
  const age =
    now.getFullYear() -
    year -
    (now < new Date(now.getFullYear(), month - 1, day) ? 1 : 0)
  return { valid: age >= 13, ageError: age < 13 }
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function RegisterInfoScreen({ navigation }: AuthScreenProps<'RegisterInfo'>) {
  const { t } = useTranslation()
  const { bottom: bottomInset } = useSafeAreaInsets()
  const { setName, setEmail, setBirthdate } = useRegisterStore()

  const [name, setNameLocal] = useState('')
  const [email, setEmailLocal] = useState('')
  const [birthdate, setBirthdateLocal] = useState('')
  const [loading, setLoading] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [birthdateError, setBirthdateError] = useState<string | null>(null)

  const emailRef = useRef<React.ComponentRef<typeof TextInput>>(null)
  const birthdateRef = useRef<React.ComponentRef<typeof TextInput>>(null)
  const footerBottom = useRef(new Animated.Value(0)).current

  // ── Animação de teclado ──────────────────────────────────────────

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    const onShow = (e: KeyboardEvent) => {
      Animated.timing(footerBottom, {
        toValue: e.endCoordinates.height - bottomInset,
        duration: e.duration || 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start()
    }
    const onHide = (e: KeyboardEvent) => {
      Animated.timing(footerBottom, {
        toValue: 0,
        duration: e.duration || 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start()
    }

    const showSub = Keyboard.addListener(showEvent, onShow)
    const hideSub = Keyboard.addListener(hideEvent, onHide)
    return () => { showSub.remove(); hideSub.remove() }
  }, [])

  // ── Validação ────────────────────────────────────────────────────

  const isNameValid = name.trim().length >= 2
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const bdValidation = validateBirthdate(birthdate)
  const allValid = isNameValid && isEmailValid && bdValidation.valid

  // ── Handlers ─────────────────────────────────────────────────────

  const handleNext = async () => {
    setNameError(null)
    setEmailError(null)
    setBirthdateError(null)

    if (!isNameValid) {
      setNameError(t('auth.register.info.errorNameRequired'))
      return
    }
    if (!isEmailValid) {
      setEmailError(t('auth.register.info.errorEmailInvalid'))
      return
    }
    if (!bdValidation.valid) {
      setBirthdateError(
        bdValidation.ageError
          ? t('auth.register.info.errorBirthdateAge')
          : t('auth.register.info.errorBirthdateInvalid'),
      )
      return
    }

    setLoading(true)
    try {
      const { data: exists, error } = await supabase.rpc('check_email_exists', {
        p_email: email.trim().toLowerCase(),
      })
      if (error) throw error
      if (exists) {
        setEmailError(t('auth.register.info.errorEmailExists'))
        return
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: true },
      })
      if (otpError) throw otpError

      setName(name.trim())
      setEmail(email.trim().toLowerCase())
      setBirthdate(birthdate)

      navigation.navigate('RegisterVerify')
    } catch (e: any) {
      console.error('[RegisterInfo] erro:', JSON.stringify(e))
      const msg = e?.message || e?.error_description || ''
      if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
        setEmailError('Muitas tentativas. Aguarde alguns minutos e tente novamente.')
      } else {
        setEmailError(`Erro: ${msg || 'desconhecido'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={12}>
          <Text variant="h2" color={Colors.neutral.primary}>‹</Text>
        </TouchableOpacity>
        <KlotLogo size={40} />
        <View style={styles.backButton} />
      </View>

      {/* ── Conteúdo ── */}
      <View style={styles.content}>
        <Text variant="h1" color={Colors.neutral.primary} style={styles.title}>
          {t('auth.register.info.title')}
        </Text>

        <Input
          label={t('auth.register.info.name')}
          value={name}
          onChangeText={(v) => { setNameLocal(v); setNameError(null) }}
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          error={nameError}
          rightElement={isNameValid ? <CheckCircleIcon size={18} /> : null}
        />

        <Input
          inputRef={emailRef}
          label={t('auth.register.info.email')}
          value={email}
          onChangeText={(v) => { setEmailLocal(v); setEmailError(null) }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          onSubmitEditing={() => birthdateRef.current?.focus()}
          error={emailError}
          rightElement={isEmailValid ? <CheckCircleIcon size={18} /> : null}
        />

        <Input
          inputRef={birthdateRef}
          label={t('auth.register.info.birthdate')}
          value={birthdate}
          onChangeText={(v) => { setBirthdateLocal(formatBirthdate(v)); setBirthdateError(null) }}
          keyboardType="numeric"
          returnKeyType="done"
          onSubmitEditing={allValid ? handleNext : Keyboard.dismiss}
          error={birthdateError}
          rightElement={bdValidation.valid ? <CheckCircleIcon size={18} /> : null}
        />

        <Text variant="caption" color={Colors.neutral.secondary} style={styles.note}>
          {t('auth.register.info.birthdateNote')}
        </Text>
      </View>

      {/* ── Rodapé animado ── */}
      <Animated.View style={[styles.footerWrap, { bottom: footerBottom }]}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={!allValid || loading}
          style={[styles.nextButton, (!allValid || loading) && styles.nextButtonDisabled]}
          activeOpacity={0.8}
        >
          <Text variant="label" color={Colors.neutral.white} weight="600">
            {loading ? t('common.loading') : t('auth.register.info.next')}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 100,
  },
  title: {
    marginBottom: Spacing.xxl,
  },
  note: {
    marginTop: Spacing.md,
    lineHeight: 18,
  },
  footerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.neutral.white,
  },
  nextButton: {
    backgroundColor: Colors.brand.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    alignItems: 'center',
    ...Shadows.sm,
  },
  nextButtonDisabled: {
    opacity: 0.35,
  },
})
