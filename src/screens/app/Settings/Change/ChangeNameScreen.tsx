import React, { useEffect, useRef, useState } from 'react'
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
import { Text } from '../../../../components/ui'
import { ScreenTransition } from '../../../../components/ScreenTransition'
import { Colors, Radius, Shadows, Spacing } from '../../../../constants/theme'
import { supabase } from '../../../../lib/supabase'
import type { AppStackParamList } from '../../../../navigation/types'

type Props = NativeStackScreenProps<AppStackParamList, 'ChangeName'>

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

export function ChangeNameScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null)

  const [userId, setUserId] = useState('')
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()

      if (data) setValue(data.name ?? '')
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    load()
  }, [])

  async function handleSave() {
    const trimmed = value.trim()
    if (!trimmed) {
      setError('Nome não pode ser vazio')
      return
    }

    setSaving(true)
    const { error: dbError } = await supabase
      .from('profiles')
      .update({ name: trimmed })
      .eq('id', userId)
    setSaving(false)

    if (dbError) {
      Alert.alert('Erro ao salvar', dbError.message)
      return
    }

    navigation.goBack()
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
                Alterar nome
              </Text>
              <Text variant="body" color={Colors.neutral.secondary} style={styles.subtitle}>
                Como você quer ser chamado no app?
              </Text>

              {!loading && (
                <Input
                  label="Nome completo"
                  value={value}
                  onChangeText={(t) => { setValue(t); setError(null) }}
                  error={error}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                  inputRef={inputRef}
                />
              )}
            </View>

            {/* Rodapé fixo */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
              <TouchableOpacity
                style={[styles.saveBtn, (saving || !value.trim()) && styles.saveBtnDisabled]}
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={saving || !value.trim()}
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
