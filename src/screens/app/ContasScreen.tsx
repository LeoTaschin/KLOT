import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  Animated,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'

import { DebtDetailItem, type DebtDetail } from '../../components/DebtDetailItem'
import { ScreenTransition } from '../../components/ScreenTransition'
import { Text } from '../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../constants/theme'
import { supabase } from '../../lib/supabase'
import type { TabScreenProps } from '../../navigation/types'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

type Direction = 'owe' | 'credit'

type ChipId = 'all' | 'individual' | string // string = groupId

interface Chip {
  id: ChipId
  label: string
}

interface Section {
  title: string
  data: DebtDetail[]
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function getPeriodKey(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()

  // Início da semana (segunda-feira)
  const startOfWeek = new Date(now)
  const day = now.getDay()
  startOfWeek.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  startOfWeek.setHours(0, 0, 0, 0)

  if (date >= startOfWeek) return 'Esta semana'

  return `${MONTHS_PT[date.getMonth()]} ${date.getFullYear()}`
}

function groupByPeriod(items: DebtDetail[]): Section[] {
  const map = new Map<string, DebtDetail[]>()
  for (const item of items) {
    const key = getPeriodKey(item.date)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }))
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function ContasScreen({ navigation }: TabScreenProps<'Contas'>) {
  const [direction, setDirection] = useState<Direction>('owe')
  const slideAnim = useRef(new Animated.Value(0)).current
  const [selectedChip, setSelectedChip] = useState<ChipId>('all')
  const [oweItems, setOweItems] = useState<DebtDetail[]>([])
  const [creditItems, setCreditItems] = useState<DebtDetail[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      async function fetchDebts() {
        setLoading(true)
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          // ── Passo 1: splits com join simples a expenses ───────────
          // Mesmo padrão do HomeScreen que funciona: sem joins de 3 níveis
          const [oweRes, creditRes] = await Promise.all([
            supabase
              .from('expense_splits')
              .select('id, amount, expenses!inner(id, title, category, date, payer_id, group_id)')
              .eq('user_id', user.id)
              .eq('paid', false),

            supabase
              .from('expense_splits')
              .select('id, amount, user_id, expenses!inner(id, title, category, date, group_id)')
              .eq('paid', false)
              .eq('expenses.payer_id', user.id)
              .neq('user_id', user.id),
          ])

          const oweRaw: any[] = (oweRes.data ?? []).filter((r: any) => r.expenses?.payer_id !== user.id)
          const creditRaw: any[] = creditRes.data ?? []

          // ── Passo 2: nomes de todos os payers (owe) e devedores (credit) ──
          const payerIdSet = new Set<string>(oweRaw.map((r: any) => r.expenses?.payer_id).filter(Boolean))
          const debtorIdSet = new Set<string>(creditRaw.map((r: any) => r.user_id).filter(Boolean))
          const allProfileIds = Array.from(new Set([...payerIdSet, ...debtorIdSet]))

          let profileNameMap: Record<string, string> = {}
          let profileAvatarMap: Record<string, string | null> = {}
          if (allProfileIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('id, name, avatar_url')
              .in('id', allProfileIds)
            profileNameMap = Object.fromEntries((profilesData ?? []).map((p: any) => [p.id, p.name]))
            profileAvatarMap = Object.fromEntries((profilesData ?? []).map((p: any) => [p.id, p.avatar_url ?? null]))
          }

          // ── Passo 3: nomes dos grupos ──────────────────────────────
          const groupIdSet = new Set<string>()
          for (const r of [...oweRaw, ...creditRaw]) {
            if (r.expenses?.group_id) groupIdSet.add(r.expenses.group_id)
          }
          let groupNameMap: Record<string, string> = {}
          if (groupIdSet.size > 0) {
            const { data: groupsData } = await supabase
              .from('groups')
              .select('id, name')
              .in('id', Array.from(groupIdSet))
            groupNameMap = Object.fromEntries((groupsData ?? []).map((g: any) => [g.id, g.name]))
          }

          // ── Mapeamento final ───────────────────────────────────────
          setOweItems(
            oweRaw.map((r: any) => ({
              id: r.id,
              title: r.expenses.title,
              category: r.expenses.category ?? 'outro',
              amount: Number(r.amount),
              personName: profileNameMap[r.expenses.payer_id] ?? '',
              avatarUrl: profileAvatarMap[r.expenses.payer_id] ?? null,
              groupId: r.expenses.group_id ?? null,
              groupName: r.expenses.group_id ? (groupNameMap[r.expenses.group_id] ?? null) : null,
              direction: 'owe' as const,
              date: r.expenses.date,
            }))
          )

          setCreditItems(
            creditRaw.map((r: any) => ({
              id: r.id,
              title: r.expenses.title,
              category: r.expenses.category ?? 'outro',
              amount: Number(r.amount),
              personName: profileNameMap[r.user_id] ?? '',
              avatarUrl: profileAvatarMap[r.user_id] ?? null,
              groupId: r.expenses.group_id ?? null,
              groupName: r.expenses.group_id ? (groupNameMap[r.expenses.group_id] ?? null) : null,
              direction: 'credit' as const,
              date: r.expenses.date,
            }))
          )
        } catch (err) {
          console.error('ContasScreen fetchDebts error:', err)
        } finally {
          setLoading(false)
        }
      }
      fetchDebts()
    }, [])
  )

  // ── Chips dinâmicos ──────────────────────────────────────────────
  const chips = useMemo<Chip[]>(() => {
    const base: Chip[] = [
      { id: 'all', label: 'Todos' },
      { id: 'individual', label: 'Individual' },
    ]
    const items = direction === 'owe' ? oweItems : creditItems
    const seen = new Set<string>()
    for (const item of items) {
      if (item.groupId && item.groupName && !seen.has(item.groupId)) {
        seen.add(item.groupId)
        base.push({ id: item.groupId, label: item.groupName })
      }
    }
    return base
  }, [direction, oweItems, creditItems])

  const handleDirectionChange = (dir: Direction) => {
    setDirection(dir)
    setSelectedChip('all')
    Animated.spring(slideAnim, {
      toValue: dir === 'owe' ? 0 : 1,
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
    }).start()
  }

  // ── Filtragem + agrupamento ──────────────────────────────────────
  const sections = useMemo<Section[]>(() => {
    const items = direction === 'owe' ? oweItems : creditItems

    const filtered = items.filter((item) => {
      if (selectedChip === 'all') return true
      if (selectedChip === 'individual') return !item.groupId
      return item.groupId === selectedChip
    })

    const sorted = [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    return groupByPeriod(sorted)
  }, [direction, oweItems, creditItems, selectedChip])

  const handlePress = (item: DebtDetail) => {
    navigation.navigate('DebtDetail', item)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>
        <View style={styles.flex}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <Text variant="h1" color={Colors.neutral.primary} weight="800">
              Contas
            </Text>
            <Text variant="body" color={Colors.neutral.secondary}>
              Veja o que você deve e o que te devem
            </Text>
          </View>

          {/* ── Toggle Você deve / Te devem ── */}
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
              onPress={() => handleDirectionChange('owe')}
              activeOpacity={0.8}
            >
              <Text
                variant="label"
                color={direction === 'owe' ? Colors.brand.primary : Colors.neutral.placeholder}
                weight={direction === 'owe' ? '600' : '400'}
              >
                Você deve
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.selectorItem}
              onPress={() => handleDirectionChange('credit')}
              activeOpacity={0.8}
            >
              <Text
                variant="label"
                color={direction === 'credit' ? Colors.brand.primary : Colors.neutral.placeholder}
                weight={direction === 'credit' ? '600' : '400'}
              >
                Te devem
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Chips de filtro ── */}
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View style={styles.chipsScroll}>
                {chips.map((chip) => (
                  <TouchableOpacity
                    key={chip.id}
                    style={[styles.chip, selectedChip === chip.id && styles.chipActive]}
                    onPress={() => setSelectedChip(chip.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      variant="caption"
                      color={selectedChip === chip.id ? Colors.brand.primary : Colors.neutral.secondary}
                      weight={selectedChip === chip.id ? '600' : '400'}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            }
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text variant="caption" color={Colors.neutral.secondary} weight="600">
                  {section.title.toUpperCase()}
                </Text>
              </View>
            )}
            renderItem={({ item }) => (
              <DebtDetailItem item={item} onPress={handlePress} />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.empty}>
                  <Text variant="body" color={Colors.neutral.placeholder}>
                    {direction === 'owe' ? 'Nenhuma dívida pendente' : 'Ninguém te deve nada'}
                  </Text>
                </View>
              ) : null
            }
          />

        </View>
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },

  // Seletor — mesmo padrão do GruposScreen
  selector: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
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

  // Chips
  chipsScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    backgroundColor: Colors.neutral.white,
  },
  chipActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.xlight,
  },

  // Lista
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  sectionHeader: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    paddingLeft: 2,
  },
  separator: {
    height: Spacing.sm,
  },

  // Vazia
  empty: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
})
