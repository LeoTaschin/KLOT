import React, { useCallback, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenTransition } from '../../../components/ScreenTransition'
import { Text } from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import type { DebtStackParamList } from '../../../navigation/types'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

type Props = NativeStackScreenProps<DebtStackParamList, 'DebtReviewGroup'>

type Category = 'comida' | 'transporte' | 'casa' | 'viagem' | 'trabalho' | 'festa' | 'outro'

interface CategoryOption {
  key: Category
  label: string
}

interface GroupMember {
  id: string
  name: string
  username: string
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

export function DebtReviewGroupScreen({ navigation, route }: Props) {
  const { groupId, groupName, amount } = route.params

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('outro')
  const [members, setMembers] = useState<GroupMember[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  useFocusEffect(
    useCallback(() => {
      async function fetchMembers() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from('group_members')
          .select('profiles(id, name, username)')
          .eq('group_id', groupId)
          .neq('user_id', user.id)  // exclui o usuário atual

        const fetched: GroupMember[] = (data ?? [])
          .map((r: any) => r.profiles)
          .filter(Boolean)

        setMembers(fetched)
        // Seleciona todos por padrão
        setSelectedIds(new Set(fetched.map((m) => m.id)))
      }
      fetchMembers()
    }, [groupId])
  )

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Cada membro selecionado recebe a divisão igualitária
  const perPerson = selectedIds.size > 0 ? Math.floor(amount / selectedIds.size) : 0

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Atenção', 'Dê um nome para essa despesa.')
      return
    }
    if (selectedIds.size === 0) {
      Alert.alert('Atenção', 'Selecione ao menos um membro.')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // 1. Cria a despesa
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          title: title.trim(),
          category,
          amount: amount / 100,
          payer_id: user.id,
          group_id: groupId,
          date: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (expenseError) throw expenseError

      // 2. Cria um split para cada membro selecionado
      const splits = Array.from(selectedIds).map((memberId) => ({
        expense_id: expense.id,
        user_id: memberId,
        amount: perPerson / 100,
        paid: false,
      }))

      const { error: splitError } = await supabase
        .from('expense_splits')
        .insert(splits)

      if (splitError) throw splitError

      Alert.alert(
        'Dívida registrada!',
        `Dividido entre ${selectedIds.size} pessoa(s) — ${formatBRL(perPerson)} cada.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.getParent()?.goBack(),
          },
        ]
      )
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
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
            <Text variant="body" color={Colors.neutral.secondary}>
              Grupo: {groupName}
            </Text>
          </View>

          {/* ── Resumo do valor ── */}
          <View style={styles.summaryCard}>
            <Text variant="caption" color={Colors.neutral.secondary}>
              Total
            </Text>
            <Text variant="h1" color={Colors.brand.primary} weight="800">
              {formatBRL(amount)}
            </Text>
            {selectedIds.size > 0 && (
              <Text variant="caption" color={Colors.neutral.placeholder}>
                {formatBRL(perPerson)} por pessoa ({selectedIds.size} selecionado(s))
              </Text>
            )}
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
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryBtn,
                    category === cat.key && styles.categoryBtnActive,
                  ]}
                  onPress={() => setCategory(cat.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    variant="caption"
                    color={category === cat.key ? Colors.brand.primary : Colors.neutral.secondary}
                    weight={category === cat.key ? '600' : '400'}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Membros ── */}
          {members.length > 0 && (
            <View style={styles.field}>
              <Text variant="label" color={Colors.neutral.secondary} weight="600" style={styles.fieldLabel}>
                Dividir com
              </Text>
              <View style={styles.memberList}>
                {members.map((m) => {
                  const checked = selectedIds.has(m.id)
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={styles.memberRow}
                      onPress={() => toggleMember(m.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                        {checked && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </View>
                      <View style={styles.memberInfo}>
                        <Text variant="label" color={Colors.neutral.primary} weight="600">
                          {m.name}
                        </Text>
                        <Text variant="caption" color={Colors.neutral.secondary}>
                          @{m.username}
                        </Text>
                      </View>
                      {checked && (
                        <Text variant="caption" color={Colors.brand.primary} weight="600">
                          {formatBRL(perPerson)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          )}

          {/* ── Botão salvar ── */}
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

        </ScrollView>
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
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  header: {
    gap: Spacing.xs,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },

  // Resumo
  summaryCard: {
    backgroundColor: Colors.brand.xlight,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.brand.light,
  },

  // Campo
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    backgroundColor: Colors.neutral.white,
  },
  categoryBtnActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.xlight,
  },
  // Membros
  memberList: {
    gap: Spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.neutral.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    ...Shadows.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  checkmark: {
    color: Colors.neutral.white,
    fontSize: 13,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },

  // Botão
  saveBtn: {
    height: 54,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
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
