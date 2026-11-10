import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import Svg, { Path } from 'react-native-svg'

import { Input } from '../../../../components/ui/Input'
import { CheckCircleIcon, ErrorCircleIcon, Text } from '../../../../components/ui'
import { ScreenTransition } from '../../../../components/ScreenTransition'
import { Colors, Radius, Shadows, Spacing } from '../../../../constants/theme'
import { supabase } from '../../../../lib/supabase'
import type { AppStackParamList } from '../../../../navigation/types'

type Props = NativeStackScreenProps<AppStackParamList, 'ChangeUsername'>

const FORMAT_REGEX = /^[a-zA-Z0-9_]{3,20}$/

function BackIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={Colors.neutral.primary} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  )
}

export function ChangeUsernameScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [userId, setUserId] = useState('')
  const [currentUsername, setCurrentUsername] = useState('')
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)

  const isFormatValid = FORMAT_REGEX.test(value)
  const isUnchanged = value.toLowerCase() === currentUsername.toLowerCase()
  const canSave = isFormatValid && (isUnchanged || isAvailable === true) && !saving && !checking

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      if (data) {
        setCurrentUsername(data.username ?? '')
        setValue(data.username ?? '')
      }
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    load()
  }, [])

  const checkAvailability = useCallback(async (val: string) => {
    if (!val || !FORMAT_REGEX.test(val) || val.toLowerCase() === currentUsername.toLowerCase()) {
      setIsAvailable(null)
      return
    }
    setChecking(true)
    try {
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', val.toLowerCase())
        .maybeSingle()

      if (dbError) throw dbError
      setIsAvailable(data === null)
    } catch {
      setIsAvailable(null)
    } finally {
      setChecking(false)
    }
  }, [currentUsername])

  function handleChange(raw: string) {
    const clean = raw.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20)
    setValue(clean)
    setError(null)
    setIsAvailable(null)

    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => checkAvailability(clean), 500)
  }

  async function handleSave() {
    if (!value) {
      setError('Username não pode ser vazio')
      return
    }
    if (!isFormatValid) {
      setError('Mínimo 3 caracteres. Apenas letras, números e _')
      return
    }
    if (!isUnchanged && isAvailable === false) {
      setError('Este username já está em uso')
      return
    }

    setSaving(true)
    const { error: dbError } = await supabase
      .from('profiles')
      .update({ username: value.toLowerCase() })
      .eq('id', userId)
    setSaving(false)

    if (dbError) {
      if (dbError.message.includes('username')) {
        setError('Este username já está em uso')
      } else {
        Alert.alert('Erro ao salvar', dbError.message)
      }
      return
    }

    navigation.goBack()
  }

  function StatusIcon() {
    if (isUnchanged || !value || !isFormatValid) return null
    if (checking) return <ActivityIndicator size="small" color={Colors.neutral.placeholder} />
    if (isAvailable === true) return <CheckCircleIcon size={18} />
    if (isAvailable === false) return <ErrorCircleIcon size={18} />
    return null
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenTransition>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={insets.bottom}
          >
            {/* Navbar */}
            <View style={styles.navbar}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
                <BackIcon />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <Text variant="h1" color={Colors.neutral.primary} weight="700" style={styles.title}>
                Alterar username
              </Text>
              <Text variant="body" color={Colors.neutral.secondary} style={styles.subtitle}>
                Seu @ identifica você para outros usuários.
              </Text>

              {!loading && (
                <>
                  <Input
                    label="Username"
                    value={value}
                    onChangeText={handleChange}
                    error={error ?? undefined}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={canSave ? handleSave : undefined}
                    inputRef={inputRef}
                    rightElement={<StatusIcon />}
                  />

                  {!error && (
                    <Text variant="caption" color={Colors.neutral.placeholder} style={styles.hint}>
                      Entre 3 e 20 caracteres. Letras, números e _ permitidos.
                    </Text>
                  )}

                  {value.length >= 3 && (
                    <View style={styles.previewRow}>
                      <Text variant="caption" color={Colors.neutral.secondary}>
                        Seu perfil:{' '}
                      </Text>
                      <Text variant="caption" color={Colors.brand.primary} weight="600">
                        @{value.toLowerCase()}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Rodapé fixo */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
              <TouchableOpacity
                style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={!canSave}
              >
                {saving
                  ? <ActivityIndicator size="small" color={Colors.neutral.white} />
                  : <Text variant="label" color={Colors.neutral.white} weight="700">Salvar alteração</Text>
                }
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </ScreenTransition>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  navbar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    marginBottom: Spacing.xxl,
  },
  hint: {
    marginTop: -Spacing.sm,
    lineHeight: 18,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.brand.xlight,
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
  },
  saveBtn: {
    height: 54,
    borderRadius: Radius.lg,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    shadowColor: Colors.brand.primary,
    shadowOpacity: 0.3,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.neutral.border,
    shadowOpacity: 0,
    elevation: 0,
  },
})
