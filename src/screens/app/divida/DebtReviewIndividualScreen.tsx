import React, { useState } from 'react'
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenTransition } from '../../../components/ScreenTransition'
import { PersonIcon, Text } from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import { notifyUser } from '../../../lib/notifications'
import { supabase } from '../../../lib/supabase'
import type { DebtStackParamList } from '../../../navigation/types'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

type Props = NativeStackScreenProps<DebtStackParamList, 'DebtReviewIndividual'>

type Category = 'comida' | 'transporte' | 'casa' | 'viagem' | 'trabalho' | 'festa' | 'outro'

interface CategoryOption {
  key: Category
  label: string
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════

const CATEGORIES: CategoryOption[] = [
  { key: 'comida',     label: 'Comida'     },
  { key: 'transporte', label: 'Transporte' },
  { key: 'casa',       label: 'Casa'       },
  { key: 'viagem',     label: 'Viagem'     },
  { key: 'trabalho',   label: 'Trabalho'   },
  { key: 'festa',      label: 'Festa'      },
  { key: 'outro',      label: 'Outro'      },
]

const AVATAR_SIZE = 56

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function formatBRL(cents: number): string {
  const value = cents / 100
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function DebtReviewIndividualScreen({ navigation, route }: Props) {
  const { friendId, friendName, avatarUrl, amount } = route.params

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('outro')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Atenção', 'Dê um nome para essa despesa.')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          title: title.trim(),
          category,
          amount: amount / 100,
          payer_id: user.id,
          date: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (expenseError) throw expenseError

      const { error: splitError } = await supabase
        .from('expense_splits')
        .insert({
          expense_id: expense.id,
          user_id: friendId,
          amount: amount / 100,
          paid: false,
        })

      if (splitError) throw splitError

      notifyUser(
        friendId,
        'Nova dívida registrada',
        `Você deve ${formatBRL(amount)} — "${title.trim()}"`,
      )

      Alert.alert('Dívida registrada!', `${friendName} agora te deve ${formatBRL(amount)}.`, [
        { text: 'OK', onPress: () => navigation.getParent()?.goBack() },
      ])
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível salvar a dívida.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* ── Conteúdo rolável ── */}
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Header ── */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
                <Text variant="body" color={Colors.brand.primary}>← Voltar</Text>
              </TouchableOpacity>
              <Text variant="h2" color={Colors.neutral.primary} weight="700">
                Revisar dívida
              </Text>
            </View>

            {/* ── Card de valor com avatar ── */}
            <View style={styles.summaryCard}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <PersonIcon size={24} color={Colors.brand.primary} />
                </View>
              )}
              <Text variant="label" color={Colors.neutral.secondary} weight="500">
                {friendName}
              </Text>
              <Text style={styles.amountText}>
                {formatBRL(amount)}
              </Text>
              <Text variant="caption" color={Colors.neutral.placeholder}>
                vai te dever esse valor
              </Text>
            </View>

            {/* ── Nome da despesa ── */}
            <View style={styles.field}>
              <Text variant="label" color={Colors.neutral.secondary} weight="600" style={styles.fieldLabel}>
                Nome da despesa
              </Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Jantar, Aluguel, Viagem..."
                placeholderTextColor={Colors.neutral.placeholder}
                autoCorrect={false}
                returnKeyType="done"
                maxLength={60}
              />
            </View>

            {/* ── Categoria ── */}
            <View style={styles.field}>
              <Text variant="label" color={Colors.neutral.secondary} weight="600" style={styles.fieldLabel}>
                Categoria
              </Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const active = category === cat.key
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[styles.categoryBtn, active && styles.categoryBtnActive]}
                      onPress={() => setCategory(cat.key)}
                      activeOpacity={0.7}
                    >
                      <Text
                        variant="caption"
                        color={active ? Colors.neutral.white : Colors.neutral.secondary}
                        weight={active ? '700' : '400'}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          </ScrollView>

          {/* ── Botão fixo no rodapé ── */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              activeOpacity={saving ? 1 : 0.8}
              disabled={saving}
            >
              <Text variant="label" color={Colors.neutral.white} weight="700">
                {saving ? 'Salvando...' : 'Confirmar dívida'}
              </Text>
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </ScreenTransition>
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
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },

  // Header
  header: {
    gap: Spacing.xs,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },

  // Card de valor
  summaryCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginBottom: Spacing.xs,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: Colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  amountText: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.brand.primary,
    letterSpacing: -0.5,
    lineHeight: 44,
  },

  // Campos
  field: {
    gap: Spacing.sm,
  },
  fieldLabel: {
    marginLeft: 2,
  },
  input: {
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.neutral.primary,
    backgroundColor: Colors.neutral.white,
  },

  // Categorias
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    backgroundColor: Colors.neutral.white,
  },
  categoryBtnActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.primary,
  },

  // Rodapé fixo
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
  },
  saveBtn: {
    height: 54,
    borderRadius: Radius.full,
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
