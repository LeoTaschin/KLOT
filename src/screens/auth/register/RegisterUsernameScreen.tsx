import React, { useCallback, useEffect, useRef, useState } from 'react'
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

import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'

import { KlotLogo } from '../../../components/KlotLogo'
import { CheckCircleIcon, ErrorCircleIcon, Text } from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import { useAuthStore } from '../../../store/useAuthStore'
import { useRegisterStore } from '../../../store/useRegisterStore'
import type { AuthScreenProps } from '../../../navigation/types'

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function RegisterUsernameScreen({ navigation }: AuthScreenProps<'RegisterUsername'>) {
  const { t } = useTranslation()
  const { bottom: bottomInset } = useSafeAreaInsets()
  const login = useAuthStore((state) => state.login)
  const { name, email, birthdate, photoUri, sessionToken, userId, setInRegistrationFlow, reset } =
    useRegisterStore()

  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const footerBottom = useRef(new Animated.Value(0)).current

  // ── Validação ────────────────────────────────────────────────────

  const isUsernameFormatValid = /^[a-zA-Z0-9_]{3,20}$/.test(username)

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

  // ── Verificação de disponibilidade com debounce ──────────────────

  const checkAvailability = useCallback(async (value: string) => {
    if (!value || !/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
      setIsAvailable(null)
      return
    }
    setChecking(true)
    try {
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', value.toLowerCase())
        .maybeSingle()

      if (dbError) throw dbError
      setIsAvailable(data === null) // null = não encontrado = disponível
    } catch {
      setIsAvailable(null)
    } finally {
      setChecking(false)
    }
  }, [])

  const handleUsernameChange = (value: string) => {
    const clean = value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20)
    setUsername(clean)
    setError(null)
    setIsAvailable(null)

    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => checkAvailability(clean), 500)
  }

  // ── Handler final ─────────────────────────────────────────────────

  const handleNext = async () => {
    if (!username) {
      setError(t('auth.register.username.errorRequired'))
      return
    }
    if (!isUsernameFormatValid) {
      setError(t('auth.register.username.errorInvalid'))
      return
    }
    if (isAvailable === false) {
      setError(t('auth.register.username.errorTaken'))
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Converte DD/MM/YYYY → YYYY-MM-DD para o banco
      const [day, month, year] = birthdate.split('/')
      const isoDate = `${year}-${month}-${day}`

      // Upload da foto para o Supabase Storage (se escolheu uma)
      let avatarUrl: string | null = null
      if (photoUri && userId) {
        try {
          const base64 = await FileSystem.readAsStringAsync(photoUri, {
            encoding: 'base64' as FileSystem.EncodingType,
          })
          const arrayBuffer = decode(base64)
          const ext = photoUri.split('.').pop()?.split('?')[0] ?? 'jpg'
          const path = `${userId}/avatar.${ext}`

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(path, arrayBuffer, { contentType: `image/${ext}`, upsert: true })

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(path)
            avatarUrl = publicUrl
            console.log('[Upload] sucesso! url:', publicUrl)
          } else {
            console.error('[Upload] erro:', JSON.stringify(uploadError))
          }
        } catch (uploadErr) {
          console.error('[Upload] exception:', String(uploadErr))
          // Continua sem foto — não bloqueia o cadastro
        }
      }

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        email,
        name,
        username: username.toLowerCase(),
        date_of_birth: isoDate,
        avatar_url: avatarUrl,
      })
      if (profileError) throw profileError

      // Cadastro concluído — libera o onAuthStateChange e loga
      setInRegistrationFlow(false)
      if (sessionToken) {
        login(sessionToken)
      }
      reset()
    } catch (e: any) {
      console.error('[RegisterUsername] erro:', JSON.stringify(e))
      setError(`Erro: ${e?.message || e?.error_description || JSON.stringify(e)}`)
    } finally {
      setLoading(false)
    }
  }

  // ── Ícone de status ───────────────────────────────────────────────

  const StatusIcon = () => {
    if (checking) return null
    if (!username || !isUsernameFormatValid) return null
    if (isAvailable === true) return <CheckCircleIcon size={18} />
    if (isAvailable === false) return <ErrorCircleIcon size={18} />
    return null
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  const canSubmit = isUsernameFormatValid && isAvailable === true && !loading

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
          {t('auth.register.username.title')}
        </Text>
        <Text variant="body" color={Colors.neutral.secondary} style={styles.subtitle}>
          {t('auth.register.username.subtitle')}
        </Text>

        {/* ── Input com prefixo @ ── */}
        <View style={[styles.inputRow, error && styles.inputRowError]}>
          <Text variant="bodyLg" color={Colors.brand.primary} weight="600" style={styles.atPrefix}>
            @
          </Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={handleUsernameChange}
            placeholder={t('auth.register.username.placeholder')}
            placeholderTextColor={Colors.neutral.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={canSubmit ? handleNext : Keyboard.dismiss}
            autoFocus
          />
          <StatusIcon />
        </View>

        {error && (
          <Text variant="caption" color={Colors.status.debt} style={styles.errorText}>
            {error}
          </Text>
        )}
      </View>

      {/* ── Rodapé animado ── */}
      <Animated.View style={[styles.footerWrap, { bottom: footerBottom }]}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={!canSubmit}
          style={[styles.nextButton, !canSubmit && styles.nextButtonDisabled]}
          activeOpacity={0.8}
        >
          <Text variant="label" color={Colors.neutral.white} weight="600">
            {loading ? t('common.loading') : t('auth.register.username.next')}
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
    marginBottom: Spacing.sm,
  },
  subtitle: {
    marginBottom: Spacing.xxl,
  },

  // Input customizado com @
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.neutral.border,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  inputRowError: {
    borderBottomColor: Colors.status.debt,
  },
  atPrefix: {
    lineHeight: 24,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.neutral.primary,
    padding: 0,
  },
  errorText: {
    marginTop: Spacing.sm,
    lineHeight: 18,
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
})
