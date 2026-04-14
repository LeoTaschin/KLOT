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
import { Text } from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import { useRegisterStore } from '../../../store/useRegisterStore'
import type { AuthScreenProps } from '../../../navigation/types'

// Tamanho do código enviado pelo Supabase (8 por padrão no flow de signup)
const CODE_LENGTH = 8

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function RegisterVerifyScreen({ navigation }: AuthScreenProps<'RegisterVerify'>) {
  const { t } = useTranslation()
  const { bottom: bottomInset } = useSafeAreaInsets()
  const { email, setSession, setInRegistrationFlow } = useRegisterStore()

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)

  const hiddenInputRef = useRef<TextInput | null>(null)
  const footerBottom = useRef(new Animated.Value(0)).current

  // ── Countdown para reenviar ──────────────────────────────────────

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true)
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

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

  // ── Handlers ─────────────────────────────────────────────────────

  const handleVerify = async (codeToVerify: string) => {
    if (codeToVerify.length !== CODE_LENGTH) return
    setLoading(true)
    setError(null)

    try {
      // Bloqueia o onAuthStateChange de fazer login automático
      setInRegistrationFlow(true)

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: codeToVerify,
        type: 'signup',
      })

      if (verifyError) {
        setInRegistrationFlow(false)
        const msg = verifyError.message?.includes('expired')
          ? t('auth.register.verify.errorExpired')
          : t('auth.register.verify.errorInvalid')
        setError(msg)
        setCode('')
        return
      }

      if (data.session) {
        setSession(data.session.access_token, data.session.user.id)
      }

      navigation.navigate('RegisterPassword')
    } catch {
      setInRegistrationFlow(false)
      setError(t('auth.register.verify.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  const handleCodeChange = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, CODE_LENGTH)
    setCode(digits)
    setError(null)
    if (digits.length === CODE_LENGTH) {
      Keyboard.dismiss()
      handleVerify(digits)
    }
  }

  const handleResend = async () => {
    if (!canResend) return
    setCanResend(false)
    setCountdown(60)
    setCode('')
    setError(null)
    await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })
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
          {t('auth.register.verify.title')}
        </Text>

        <Text variant="body" color={Colors.neutral.secondary} style={styles.subtitle}>
          {t('auth.register.verify.subtitle')}
        </Text>
        <Text variant="body" color={Colors.neutral.primary} weight="600" style={styles.emailText}>
          {email}
        </Text>

        {/* ── Caixas OTP ── */}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.otpWrapper}
          onPress={() => hiddenInputRef.current?.focus()}
        >
          <View style={styles.otpRow}>
            {Array.from({ length: CODE_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.otpBox,
                  code.length > i && styles.otpBoxFilled,
                  error && styles.otpBoxError,
                ]}
              >
                <Text
                  variant="h2"
                  color={Colors.neutral.primary}
                  weight="700"
                >
                  {code[i] ?? ''}
                </Text>
              </View>
            ))}
          </View>

          {/* Input invisível que captura a digitação */}
          <TextInput
            ref={hiddenInputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={handleCodeChange}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            autoFocus
            caretHidden
          />
        </TouchableOpacity>

        {error && (
          <Text variant="caption" color={Colors.status.debt} style={styles.errorText}>
            {error}
          </Text>
        )}

        {/* ── Reenviar ── */}
        <TouchableOpacity
          onPress={handleResend}
          disabled={!canResend}
          hitSlop={8}
          style={styles.resendButton}
        >
          <Text
            variant="body"
            color={canResend ? Colors.brand.primary : Colors.neutral.secondary}
            weight={canResend ? '600' : '400'}
          >
            {canResend
              ? t('auth.register.verify.resend')
              : t('auth.register.verify.resendTimer', { seconds: countdown })}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Rodapé animado ── */}
      <Animated.View style={[styles.footerWrap, { bottom: footerBottom }]}>
        <TouchableOpacity
          onPress={() => handleVerify(code)}
          disabled={code.length !== CODE_LENGTH || loading}
          style={[styles.nextButton, (code.length !== CODE_LENGTH || loading) && styles.nextButtonDisabled]}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={styles.loadingDot} />
          ) : (
            <Text variant="label" color={Colors.neutral.white} weight="600">
              {t('auth.register.verify.next')}
            </Text>
          )}
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
    marginBottom: Spacing.md,
  },
  subtitle: {
    marginBottom: Spacing.xs,
  },
  emailText: {
    marginBottom: Spacing.xxl,
  },

  // OTP
  otpWrapper: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  otpRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  otpBox: {
    flex: 1,
    aspectRatio: 0.85,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral.surface,
  },
  otpBoxFilled: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.xlight,
  },
  otpBoxError: {
    borderColor: Colors.status.debt,
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
  },

  errorText: {
    marginBottom: Spacing.md,
  },
  resendButton: {
    alignSelf: 'flex-start',
  },

  // Rodapé
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
  loadingDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.neutral.white,
    borderTopColor: 'transparent',
  },
})
