import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import Svg, { Path, Rect } from 'react-native-svg'

import { ScreenTransition } from '../../../components/ScreenTransition'
import { Input } from '../../../components/ui/Input'
import { Text } from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import type { AppStackParamList } from '../../../navigation/types'

type Props = NativeStackScreenProps<AppStackParamList, 'PixSettings'>

const PIX_TYPES = [
  { label: 'CPF / CNPJ', hint: 'Ex: 123.456.789-00' },
  { label: 'E-mail',     hint: 'Ex: voce@email.com' },
  { label: 'Telefone',   hint: 'Ex: +55 11 91234-5678' },
  { label: 'Chave aleatória', hint: 'Cole a chave aleatória gerada pelo banco' },
] as const

type PixType = typeof PIX_TYPES[number]['label']

function BackIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={Colors.neutral.primary} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  )
}

function PixIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        stroke={Colors.brand.primary} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  )
}

function QRIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={7} height={7} rx={1} stroke={Colors.neutral.secondary} strokeWidth={2} />
      <Rect x={14} y={3} width={7} height={7} rx={1} stroke={Colors.neutral.secondary} strokeWidth={2} />
      <Rect x={3} y={14} width={7} height={7} rx={1} stroke={Colors.neutral.secondary} strokeWidth={2} />
      <Path d="M14 14h2v2h-2zM18 14h3M14 18h3M20 18v3M20 14v2" stroke={Colors.neutral.secondary} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

export function PixSettingsScreen({ navigation }: Props) {
  const [currentKey, setCurrentKey] = useState<string | null>(null)
  const [newKey, setNewKey] = useState('')
  const [selectedType, setSelectedType] = useState<PixType>('CPF / CNPJ')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  const [keyError, setKeyError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('profiles')
        .select('pix_key')
        .eq('id', user.id)
        .single()

      if (data) setCurrentKey(data.pix_key ?? null)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    if (!newKey.trim()) {
      setKeyError('Informe a chave PIX')
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ pix_key: newKey.trim() })
      .eq('id', userId)
    setSaving(false)

    if (error) {
      Alert.alert('Erro ao salvar', error.message)
      return
    }
    setCurrentKey(newKey.trim())
    setNewKey('')
    Alert.alert('Chave PIX salva', 'Sua chave PIX foi atualizada com sucesso.')
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.brand.primary} />
      </SafeAreaView>
    )
  }

  const hint = PIX_TYPES.find((t) => t.label === selectedType)?.hint ?? ''

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
              <BackIcon />
            </TouchableOpacity>
            <Text variant="h3" color={Colors.neutral.primary} weight="600">
              Chave PIX
            </Text>
            <View style={styles.backBtn} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Chave atual ── */}
            {currentKey && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <PixIcon />
                  <Text variant="label" color={Colors.neutral.primary} weight="600">
                    Chave atual
                  </Text>
                </View>
                <Text variant="body" color={Colors.brand.primary} weight="500">
                  {currentKey}
                </Text>
              </View>
            )}

            {/* ── Tipo de chave ── */}
            <View style={styles.section}>
              <Text variant="caption" color={Colors.neutral.secondary} weight="600" style={styles.sectionTitle}>
                TIPO DE CHAVE
              </Text>
              <View style={styles.typeCard}>
                {PIX_TYPES.map((type, i) => (
                  <React.Fragment key={type.label}>
                    {i > 0 && <View style={styles.typeDivider} />}
                    <TouchableOpacity
                      style={styles.typeRow}
                      onPress={() => setSelectedType(type.label)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radio, selectedType === type.label && styles.radioSelected]}>
                        {selectedType === type.label && <View style={styles.radioDot} />}
                      </View>
                      <Text
                        variant="label"
                        color={selectedType === type.label ? Colors.brand.primary : Colors.neutral.primary}
                        weight={selectedType === type.label ? '600' : '400'}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* ── Campo da chave ── */}
            <View style={styles.inputCard}>
              <Input
                label={selectedType}
                value={newKey}
                onChangeText={(t) => { setNewKey(t); setKeyError(null) }}
                error={keyError}
                placeholder={hint}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />
            </View>

            {/* ── Botão salvar ── */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={Colors.neutral.white} size="small" />
              ) : (
                <Text variant="label" color={Colors.neutral.white} weight="700">
                  Salvar chave PIX
                </Text>
              )}
            </TouchableOpacity>

            {/* ── BRCode ── */}
            <View style={styles.brCodeSection}>
              <View style={styles.brCodeHeader}>
                <QRIcon />
                <Text variant="label" color={Colors.neutral.secondary} weight="600">
                  BRCode
                </Text>
              </View>
              <Text variant="caption" color={Colors.neutral.placeholder}>
                Em breve você poderá gerar seu QR Code para receber pagamentos diretamente pelo app.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenTransition>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },

  // Chave atual
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  // Tipo
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    paddingHorizontal: 4,
    letterSpacing: 0.5,
  },
  typeCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  typeDivider: {
    height: 1,
    backgroundColor: Colors.neutral.border,
    marginLeft: Spacing.lg + 20 + Spacing.md,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.brand.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.brand.primary,
  },

  // Input
  inputCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    ...Shadows.sm,
  },

  // Botão
  saveBtn: {
    height: 52,
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

  // BRCode
  brCodeSection: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.neutral.border,
  },
  brCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
})
