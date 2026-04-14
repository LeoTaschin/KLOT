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
  TouchableOpacity,
  View,
} from 'react-native'

import { KlotLogo } from '../../../components/KlotLogo'
import { EyeIcon, EyeOffIcon, Input, Text } from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import type { AuthScreenProps } from '../../../navigation/types'

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function RegisterPasswordScreen({ navigation }: AuthScreenProps<'RegisterPassword'>) {
  const { t } = useTranslation()
  const { bottom: bottomInset } = useSafeAreaInsets()

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // ── Handlers ─────────────────────────────────────────────────────

  const isPasswordValid = password.length >= 8

  const handleNext = async () => {
    if (!isPasswordValid) {
      setError(t('auth.register.password.errorTooShort'))
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      navigation.navigate('RegisterPhoto')
    } catch {
      setError(t('auth.register.password.errorGeneric'))
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
          {t('auth.register.password.title')}
        </Text>

        <Text variant="body" color={Colors.neutral.secondary} style={styles.subtitle}>
          {t('auth.register.password.subtitle')}
        </Text>

        <Input
          label={t('auth.register.password.password')}
          value={password}
          onChangeText={(v) => { setPassword(v); setError(null) }}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={handleNext}
          error={error}
          autoFocus
          rightElement={
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </TouchableOpacity>
          }
        />
      </View>

      {/* ── Rodapé animado ── */}
      <Animated.View style={[styles.footerWrap, { bottom: footerBottom }]}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={!isPasswordValid || loading}
          style={[styles.nextButton, (!isPasswordValid || loading) && styles.nextButtonDisabled]}
          activeOpacity={0.8}
        >
          <Text variant="label" color={Colors.neutral.white} weight="600">
            {loading ? t('common.loading') : t('auth.register.password.next')}
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
    marginBottom: Spacing.md,
  },
  subtitle: {
    marginBottom: Spacing.xxl,
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
