import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import Svg, { Path, Rect } from 'react-native-svg'

import { ScreenTransition } from '../../../components/ScreenTransition'
import { Text } from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import type { PaymentStackParamList } from '../../../navigation/types'

type Props = NativeStackScreenProps<PaymentStackParamList, 'PaymentValueSelector'>
type Tab = 'dividas' | 'valor'

interface DebtRow {
  id: string
  title: string
  amount: number
  date: string
}

// ─── Icons ────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={Colors.neutral.primary} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function CheckboxIcon({ checked }: { checked: boolean }) {
  if (checked) {
    return (
      <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
        <Rect x={1} y={1} width={20} height={20} rx={6} fill={Colors.brand.primary} />
        <Path d="M6 11l3.5 3.5L16 7"
          stroke={Colors.neutral.white} strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    )
  }
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Rect x={1} y={1} width={20} height={20} rx={6}
        stroke={Colors.neutral.border} strokeWidth={1.5} />
    </Svg>
  )
}

// ─── Componente ───────────────────────────────────────────────────

function formatCents(cents: number): string {
  const reais = Math.floor(cents / 100)
  const centavos = cents % 100
  return `${reais},${String(centavos).padStart(2, '0')}`
}

export function PaymentValueSelectorScreen({ navigation, route }: Props) {
  const { friendId, friendName, avatarUrl, pixKey } = route.params

  const [loading, setLoading] = useState(true)
  const [debts, setDebts] = useState<DebtRow[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<Tab>('dividas')
  const [cents, setCents] = useState(0)
  const slideAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('expense_splits')
        .select('id, amount, expenses!inner(title, date, payer_id)')
        .eq('user_id', user.id)
        .eq('paid', false)
        .eq('expenses.payer_id', friendId)

      const rows: DebtRow[] = (data ?? []).map((r: any) => ({
        id: r.id,
        title: r.expenses.title,
        amount: Number(r.amount),
        date: r.expenses.date,
      }))
      setDebts(rows)
      setSelectedIds(new Set(rows.map((r) => r.id)))
      setLoading(false)
    }
    load()
  }, [friendId])

  function switchTab(tab: Tab) {
    setActiveTab(tab)
    Animated.spring(slideAnim, {
      toValue: tab === 'dividas' ? 0 : 1,
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
    }).start()
  }

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelectedIds(
      selectedIds.size === debts.length ? new Set() : new Set(debts.map((d) => d.id))
    )
  }

  function handleDigit(digit: string) {
    setCents((prev) => {
      const next = prev * 10 + Number(digit)
      return next > 999999 ? prev : next
    })
  }

  function handleBackspace() {
    setCents((prev) => Math.floor(prev / 10))
  }

  const totalDebt = debts.reduce((s, d) => s + d.amount, 0)

  const totalSelected = debts
    .filter((d) => selectedIds.has(d.id))
    .reduce((s, d) => s + d.amount, 0)

  const continueDisabled =
    activeTab === 'dividas' ? selectedIds.size === 0 : cents === 0

  function handleContinue() {
    if (activeTab === 'dividas') {
      navigation.navigate('PaymentPix', {
        friendId,
        friendName,
        avatarUrl,
        pixKey,
        amount: totalSelected,
        splitIds: Array.from(selectedIds),
      })
    } else {
      navigation.navigate('PaymentPix', {
        friendId,
        friendName,
        avatarUrl,
        pixKey,
        amount: cents / 100,
        splitIds: [],
      })
    }
  }

  const fmtBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const displayTotal = activeTab === 'dividas' ? totalSelected : cents / 100

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>
        <View style={styles.container}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={12}>
              <BackIcon />
            </TouchableOpacity>
            <Text variant="label" color={Colors.neutral.primary} weight="700">
              Escolher valor
            </Text>
            <View style={styles.iconBtn} />
          </View>

          {/* ── Seletor de tab ── */}
          <View style={styles.selectorWrap}>
            <View style={styles.selector}>
              <Animated.View
                style={[
                  styles.selectorPill,
                  {
                    left: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['2%', '50%'],
                    }),
                  },
                ]}
              />
              <TouchableOpacity
                style={styles.selectorItem}
                onPress={() => switchTab('dividas')}
                activeOpacity={0.8}
              >
                <Text
                  variant="label"
                  color={activeTab === 'dividas' ? Colors.brand.primary : Colors.neutral.placeholder}
                  weight={activeTab === 'dividas' ? '600' : '400'}
                >
                  Dívidas
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectorItem}
                onPress={() => switchTab('valor')}
                activeOpacity={0.8}
              >
                <Text
                  variant="label"
                  color={activeTab === 'valor' ? Colors.brand.primary : Colors.neutral.placeholder}
                  weight={activeTab === 'valor' ? '600' : '400'}
                >
                  Valor
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Conteúdo ── */}
          {activeTab === 'dividas' ? (
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {loading ? null : debts.length === 0 ? (
                <View style={styles.empty}>
                  <Text variant="body" color={Colors.neutral.placeholder}>
                    Nenhuma dívida pendente
                  </Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.selectAll}
                    onPress={toggleAll}
                    activeOpacity={0.7}
                  >
                    <CheckboxIcon checked={selectedIds.size === debts.length} />
                    <Text variant="label" color={Colors.neutral.secondary} weight="500">
                      {selectedIds.size === debts.length ? 'Desmarcar todos' : 'Selecionar todos'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.listCard}>
                    {debts.map((debt, i) => {
                      const checked = selectedIds.has(debt.id)
                      const dateStr = new Date(debt.date).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'short',
                      })
                      return (
                        <React.Fragment key={debt.id}>
                          {i > 0 && <View style={styles.listDivider} />}
                          <TouchableOpacity
                            style={styles.debtRow}
                            onPress={() => toggleItem(debt.id)}
                            activeOpacity={0.7}
                          >
                            <CheckboxIcon checked={checked} />
                            <View style={styles.debtInfo}>
                              <Text
                                variant="label"
                                color={checked ? Colors.neutral.primary : Colors.neutral.secondary}
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
                              color={checked ? Colors.brand.primary : Colors.neutral.secondary}
                              weight="700"
                            >
                              {fmtBRL(debt.amount)}
                            </Text>
                          </TouchableOpacity>
                        </React.Fragment>
                      )
                    })}
                  </View>
                </>
              )}
            </ScrollView>
          ) : (
            <View style={styles.numpadContainer}>
              {/* Display do valor */}
              <View style={styles.displayWrap}>
                <Text variant="caption" color={Colors.neutral.secondary} style={styles.currencyLabel}>
                  R$
                </Text>
                <Text
                  style={StyleSheet.flatten([
                    styles.amountDisplay,
                    { color: cents === 0 ? Colors.neutral.placeholder : Colors.neutral.primary },
                  ])}
                >
                  {cents === 0 ? '0,00' : formatCents(cents)}
                </Text>
              </View>
              {totalDebt > 0 && (
                <Text variant="caption" color={Colors.neutral.secondary} style={styles.debtHint}>
                  Dívida total: {fmtBRL(totalDebt)}
                </Text>
              )}

              {/* Teclado numérico */}
              <View style={styles.numpad}>
                {[
                  ['1', '2', '3'],
                  ['4', '5', '6'],
                  ['7', '8', '9'],
                  ['', '0', '⌫'],
                ].map((row, rowIdx) => (
                  <View key={rowIdx} style={styles.numpadRow}>
                    {row.map((key, keyIdx) => {
                      if (key === '') {
                        return <View key={keyIdx} style={styles.numpadKeyEmpty} />
                      }
                      const isBackspace = key === '⌫'
                      return (
                        <TouchableOpacity
                          key={keyIdx}
                          style={styles.numpadKey}
                          onPress={() => isBackspace ? handleBackspace() : handleDigit(key)}
                          activeOpacity={0.6}
                        >
                          <Text
                            variant="h2"
                            color={isBackspace ? Colors.neutral.secondary : Colors.neutral.primary}
                            weight={isBackspace ? '400' : '600'}
                          >
                            {key}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text variant="body" color={Colors.neutral.secondary} weight="500">
                Total a pagar
              </Text>
              <Text variant="h3" color={Colors.neutral.primary} weight="800">
                {fmtBRL(displayTotal)}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.continueBtn, continueDisabled && styles.continueBtnDisabled]}
              onPress={handleContinue}
              activeOpacity={0.85}
              disabled={continueDisabled}
            >
              <Text variant="label" color={Colors.neutral.white} weight="700">
                Continuar
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScreenTransition>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  container: {
    flex: 1,
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
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Seletor
  selectorWrap: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  selector: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.full,
    padding: 4,
    position: 'relative',
    height: 48,
  },
  selectorPill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '48%',
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.full,
    ...Shadows.sm,
  },
  selectorItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  // Lista de dívidas
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  selectAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: 2,
  },
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
  listDivider: {
    height: 1,
    backgroundColor: Colors.neutral.border,
    marginLeft: Spacing.md + 22 + Spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },

  // Numpad
  numpadContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  debtHint: {
    textAlign: 'center',
    marginTop: -Spacing.sm,
  },
  displayWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.lg,
  },
  currencyLabel: {
    marginBottom: 8,
    fontSize: 20,
  },
  amountDisplay: {
    fontSize: 56,
    fontWeight: '700',
    lineHeight: 64,
    letterSpacing: -1,
  },
  numpad: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  numpadRow: {
    flexDirection: 'row',
    gap: 4,
  },
  numpadKey: {
    flex: 1,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    backgroundColor: Colors.neutral.surface,
  },
  numpadKeyEmpty: {
    flex: 1,
    height: 66,
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
    shadowOpacity: 0,
    elevation: 0,
  },
})
