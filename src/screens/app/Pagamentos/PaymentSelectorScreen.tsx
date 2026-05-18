import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import Svg, { Path, Rect } from 'react-native-svg'

import { ScreenTransition } from '../../../components/ScreenTransition'
import { Text } from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import type { PaymentStackParamList } from '../../../navigation/types'

type Props = NativeStackScreenProps<PaymentStackParamList, 'PaymentSelector'>

interface DebtRow {
  id: string
  title: string
  amount: number
  date: string
}

function CloseIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={Colors.neutral.primary}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  )
}

function CheckboxIcon({ checked }: { checked: boolean }) {
  if (checked) {
    return (
      <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
        <Rect x={1} y={1} width={20} height={20} rx={6} fill={Colors.brand.primary} />
        <Path
          d="M6 11l3.5 3.5L16 7"
          stroke={Colors.neutral.white}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    )
  }
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Rect x={1} y={1} width={20} height={20} rx={6} stroke={Colors.neutral.border} strokeWidth={1.5} />
    </Svg>
  )
}

export function PaymentSelectorScreen({ navigation, route }: Props) {
  const { friendId, friendName, avatarUrl, direction } = route.params
  const firstName = friendName.split(' ')[0]
  const isPay = direction === 'pay'

  const [debts, setDebts] = useState<DebtRow[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [resolvedPixKey, setResolvedPixKey] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useFocusEffect(
    useCallback(() => {
      async function load() {
        setLoading(true)
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          const [splitsRes, pixRes] = await Promise.all([
            isPay
              // splits que o user deve ao amigo
              ? supabase
                  .from('expense_splits')
                  .select('id, amount, expenses!inner(title, date, payer_id)')
                  .eq('user_id', user.id)
                  .eq('paid', false)
                  .eq('expenses.payer_id', friendId)
              // splits que o amigo deve ao user
              : supabase
                  .from('expense_splits')
                  .select('id, amount, expenses!inner(title, date, payer_id)')
                  .eq('user_id', friendId)
                  .eq('paid', false)
                  .eq('expenses.payer_id', user.id),

            // PIX key: amigo (pay) ou eu mesmo (charge)
            supabase
              .from('profiles')
              .select('pix_key')
              .eq('id', isPay ? friendId : user.id)
              .single(),
          ])

          const rows: DebtRow[] = (splitsRes.data ?? []).map((r: any) => ({
            id: r.id,
            title: r.expenses.title,
            amount: Number(r.amount),
            date: r.expenses.date,
          }))

          setDebts(rows)
          setSelected(new Set(rows.map((r) => r.id)))
          setResolvedPixKey(pixRes.data?.pix_key ?? null)
        } finally {
          setLoading(false)
        }
      }
      load()
    }, [friendId, isPay])
  )

  const total = debts
    .filter((d) => selected.has(d.id))
    .reduce((s, d) => s + d.amount, 0)

  const toggleAll = () => {
    if (selected.size === debts.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(debts.map((d) => d.id)))
    }
  }

  const toggleItem = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleContinue = () => {
    if (selected.size === 0) return
    setSubmitting(true)
    navigation.navigate('PaymentCheckout', {
      friendId,
      friendName,
      avatarUrl,
      direction,
      amount: total,
      splitIds: Array.from(selected),
      pixKey: resolvedPixKey,
    })
    setSubmitting(false)
  }

  const allSelected = debts.length > 0 && selected.size === debts.length

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={12}>
            <CloseIcon />
          </TouchableOpacity>
          <Text variant="label" color={Colors.neutral.primary} weight="700">
            {isPay ? `Pagar ${firstName}` : `Cobrar de ${firstName}`}
          </Text>
          <View style={styles.iconBtn} />
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: Spacing.xl }} />
        ) : debts.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="body" color={Colors.neutral.placeholder}>
              Nenhuma dívida pendente
            </Text>
          </View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Selecionar todos */}
              <TouchableOpacity style={styles.selectAll} onPress={toggleAll} activeOpacity={0.7}>
                <CheckboxIcon checked={allSelected} />
                <Text variant="label" color={Colors.neutral.primary} weight="500">
                  {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                </Text>
              </TouchableOpacity>

              {/* Lista de dívidas */}
              <View style={styles.listCard}>
                {debts.map((debt, i) => {
                  const isChecked = selected.has(debt.id)
                  const dateStr = new Date(debt.date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                  })
                  return (
                    <React.Fragment key={debt.id}>
                      {i > 0 && <View style={styles.divider} />}
                      <TouchableOpacity
                        style={styles.debtRow}
                        onPress={() => toggleItem(debt.id)}
                        activeOpacity={0.7}
                      >
                        <CheckboxIcon checked={isChecked} />
                        <View style={styles.debtInfo}>
                          <Text
                            variant="label"
                            color={isChecked ? Colors.neutral.primary : Colors.neutral.secondary}
                            weight="600"
                            numberOfLines={1}
                          >
                            {debt.title}
                          </Text>
                          <Text variant="caption" color={Colors.neutral.secondary}>
                            {dateStr}
                          </Text>
                        </View>
                        <Text
                          variant="label"
                          color={isChecked ? Colors.brand.primary : Colors.neutral.secondary}
                          weight="700"
                        >
                          R$ {debt.amount.toFixed(2).replace('.', ',')}
                        </Text>
                      </TouchableOpacity>
                    </React.Fragment>
                  )
                })}
              </View>
            </ScrollView>

            {/* ── Footer ── */}
            <View style={styles.footer}>
              <View style={styles.totalRow}>
                <Text variant="body" color={Colors.neutral.secondary} weight="500">
                  Total selecionado
                </Text>
                <Text variant="h3" color={Colors.neutral.primary} weight="800">
                  R$ {total.toFixed(2).replace('.', ',')}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.continueBtn, selected.size === 0 && styles.continueBtnDisabled]}
                onPress={handleContinue}
                activeOpacity={0.85}
                disabled={selected.size === 0 || submitting}
              >
                <Text variant="label" color={Colors.neutral.white} weight="700">
                  {isPay ? 'Gerar pagamento PIX' : 'Gerar cobrança PIX'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScreenTransition>
    </SafeAreaView>
  )
}

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
    paddingVertical: Spacing.md,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },

  // Select all
  selectAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },

  // List card
  listCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: Colors.neutral.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  debtInfo: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.neutral.border,
    marginLeft: Spacing.md + 22 + Spacing.md,
  },

  // Empty
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Footer
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  continueBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.full,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  continueBtnDisabled: {
    backgroundColor: Colors.neutral.border,
  },
})
