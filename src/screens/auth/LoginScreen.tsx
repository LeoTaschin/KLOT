import { useTranslation } from 'react-i18next'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardEvent,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import React, { useEffect, useRef, useState } from 'react'

import { KlotLogo } from '../../components/KlotLogo'
import { Input, Text } from '../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../constants/theme'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import type { AuthScreenProps } from '../../navigation/types'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

type Step = 'email' | 'password'

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { t } = useTranslation()
  const { bottom: bottomInset } = useSafeAreaInsets()
  const resetWelcome = useAuthStore((state) => state.resetWelcome)
  const login = useAuthStore((state) => state.login)

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPasswordError, setHasPasswordError] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  const passwordRef = useRef<TextInput>(null)
  const footerBottom = useRef(new Animated.Value(0)).current  // anima bottom: 0 → keyboardH
  const registerOpacity = useRef(new Animated.Value(1)).current

  // ── Animação de teclado ────────────────────────────────────────

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    const onShow = (e: KeyboardEvent) => {
      setKeyboardVisible(true)
      Animated.parallel([
        Animated.timing(footerBottom, {
          toValue: e.endCoordinates.height - bottomInset,
          duration: e.duration || 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(registerOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start()
    }

    const onHide = (e: KeyboardEvent) => {
      setKeyboardVisible(false)
      Animated.parallel([
        Animated.timing(footerBottom, {
          toValue: 0,
          duration: e.duration || 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(registerOpacity, {
          toValue: 1,
          duration: 200,
          delay: 80,
          useNativeDriver: true,
        }),
      ]).start()
    }

    const showSub = Keyboard.addListener(showEvent, onShow)
    const hideSub = Keyboard.addListener(hideEvent, onHide)

    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  // ── Helpers ────────────────────────────────────────────────────

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  // ── Handlers ───────────────────────────────────────────────────

  const handleBack = () => {
    if (step === 'password') {
      setStep('email')
      setError(null)
    } else {
      resetWelcome()
    }
  }

  const handleNext = async () => {
    setError(null)
    if (!isEmailValid) {
      setError(t('auth.login.errorInvalidEmail'))
      return
    }
    setLoading(true)
    try {
      const { data: exists, error } = await supabase
        .rpc('check_email_exists', { p_email: email.trim().toLowerCase() })

      if (error) throw error

      if (!exists) {
        setError(t('auth.login.errorEmailNotFound'))
        return
      }

      setStep('password')
      setTimeout(() => passwordRef.current?.focus(), 100)
    } catch (e: any) {
      setError(t('auth.login.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!password) {
      setError(t('auth.login.errorPasswordRequired'))
      setHasPasswordError(true)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) throw error

      login(data.session.access_token)
    } catch (e: any) {
      const message = e?.message?.includes('Invalid login credentials')
        ? t('auth.login.errorWrongPassword')
        : t('auth.login.errorGeneric')
      setError(message)
      setHasPasswordError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => navigation.navigate('ForgotPassword')
  const handleGoToRegister = () => navigation.navigate('Register')

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={12}>
          <Text variant="h2" color={Colors.neutral.primary}>‹</Text>
        </TouchableOpacity>

        <KlotLogo size={40} />

        <View style={styles.backButton} />
      </View>

      {/* ── Conteúdo ── */}
      <View style={styles.content}>
        <Text variant="h1" color={Colors.neutral.primary} style={styles.title}>
          {step === 'email'
            ? t('auth.login.titleEmail')
            : t('auth.login.titlePassword')}
        </Text>

        <Input
          label={t('auth.login.email')}
          value={email}
          onChangeText={(v) => { setEmail(v); setError(null) }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          onSubmitEditing={step === 'email' ? handleNext : undefined}
          editable={step === 'email'}
          error={step === 'email' ? error : null}
          rightElement={
            email.length > 0 && step === 'email' ? (
              <TouchableOpacity onPress={() => setEmail('')} hitSlop={8}>
                <Text variant="body" color={Colors.neutral.placeholder}>✕</Text>
              </TouchableOpacity>
            ) : null
          }
        />

        {step === 'password' && (
          <Input
            inputRef={passwordRef}
            label={t('auth.login.password')}
            value={password}
            onChangeText={(v) => { setPassword(v); setError(null) }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            error={error}
            rightElement={
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                <Text variant="body" color={Colors.neutral.placeholder}>
                  {showPassword ? '🙈' : '👁'}
                </Text>
              </TouchableOpacity>
            }
          />
        )}
      </View>

      {/* ── Rodapé animado — sobe com o teclado ── */}
      <Animated.View style={[styles.footerWrap, { bottom: footerBottom }]}>
        <View style={styles.footer}>
          {/* "Esqueceu a senha?" só aparece após o primeiro erro de senha */}
          {step === 'password' && hasPasswordError ? (
            <TouchableOpacity onPress={handleForgotPassword} hitSlop={8}>
              <Text variant="label" color={Colors.neutral.secondary}>
                {t('auth.login.forgotPassword')}
              </Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          <TouchableOpacity
            onPress={step === 'email' ? handleNext : handleLogin}
            disabled={loading || (step === 'email' && !isEmailValid)}
            style={[
              styles.nextButton,
              (loading || (step === 'email' && !isEmailValid)) && styles.nextButtonDisabled,
            ]}
            activeOpacity={0.8}
          >
            <Text variant="label" color={Colors.neutral.white} weight="600">
              {loading
                ? t('common.loading')
                : step === 'email'
                  ? t('auth.login.next')
                  : t('auth.login.submit')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* "Não tem conta?" some com fade quando o teclado abre */}
        <Animated.View
          style={[styles.registerRow, { opacity: registerOpacity }]}
          pointerEvents={keyboardVisible ? 'none' : 'auto'}
        >
          <Text variant="body" color={Colors.neutral.secondary}>
            {t('auth.login.noAccount')}{' '}
          </Text>
          <Pressable onPress={handleGoToRegister}>
            <Text variant="body" color={Colors.brand.primary} weight="600">
              {t('auth.login.createAccount')}
            </Text>
          </Pressable>
        </Animated.View>
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

  // Header
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

  // Conteúdo
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 100,
  },
  title: {
    marginBottom: Spacing.xxl,
  },

  // Campo
  field: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    marginBottom: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    gap: Spacing.sm,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.neutral.primary,
    padding: 0,
  },

  // Erro
  errorText: {
    marginTop: Spacing.xs,
  },

  // Rodapé
  footerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.neutral.white,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  nextButton: {
    backgroundColor: Colors.brand.primary,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    ...Shadows.sm,
  },
  nextButtonDisabled: {
    opacity: 0.45,
  },

  // Link cadastro
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: Spacing.lg,
  },
})
