import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import { CasaIcon, ComidaIcon, FestaIcon, Text, TrabalhoIcon, TransporteIcon, ViagemIcon } from './ui'
import { Colors, Radius, Shadows, Spacing } from '../constants/theme'

// ═══════════════════════════════════════════════════════════════════
// CATEGORIAS
// ═══════════════════════════════════════════════════════════════════

export type ExpenseCategory = 'comida' | 'transporte' | 'casa' | 'viagem' | 'trabalho' | 'festa' | 'outro'

const CATEGORY_ICONS: Record<ExpenseCategory, React.FC<{ size?: number; color?: string }>> = {
  comida:     ComidaIcon,
  transporte: TransporteIcon,
  casa:       CasaIcon,
  viagem:     ViagemIcon,
  trabalho:   TrabalhoIcon,
  festa:      FestaIcon,
  outro:      ComidaIcon,
}

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

export interface ExpenseItem {
  id: string
  title: string
  category: ExpenseCategory
  date: string        // já formatado: "Ontem 18:45", "9 de julho de 2024 18:45"
  amount: number
  isCredit?: boolean  // true = verde (você recebeu), false/undefined = vermelho (você deve)
}

interface ExpensesShortcutItemProps {
  item: ExpenseItem
  onPress?: () => void
}

interface ExpensesShortcutProps {
  expenses: ExpenseItem[]
  onViewAll?: () => void
  onPressExpense?: (item: ExpenseItem) => void
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ═══════════════════════════════════════════════════════════════════
// ITEM
// ═══════════════════════════════════════════════════════════════════

export function ExpensesShortcutItem({ item, onPress }: ExpensesShortcutItemProps) {
  const Icon = CATEGORY_ICONS[item.category]
  const amountColor = item.isCredit ? Colors.status.credit : Colors.status.debt

  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>

      {/* Ícone de categoria */}
      <View style={styles.iconWrap}>
        <Icon size={22} color={Colors.neutral.white} />
      </View>

      {/* Título + data */}
      <View style={styles.textWrap}>
        <Text variant="label" color={Colors.neutral.primary} weight="600">
          {item.title}
        </Text>
        <Text variant="caption" color={Colors.neutral.placeholder}>
          {item.date}
        </Text>
      </View>

      {/* Valor */}
      <Text variant="label" color={amountColor} weight="700">
        {formatBRL(item.amount)}
      </Text>

    </TouchableOpacity>
  )
}

// ═══════════════════════════════════════════════════════════════════
// LISTA
// ═══════════════════════════════════════════════════════════════════

export function ExpensesShortcut({ expenses, onViewAll, onPressExpense }: ExpensesShortcutProps) {

  return (
    <View style={styles.wrapper}>

      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text variant="label" color={Colors.neutral.primary} weight="700">
          Despesas recentes
        </Text>
        <TouchableOpacity onPress={onViewAll} hitSlop={8}>
          <Text variant="label" color={Colors.brand.primary} weight="600">
            Ver todas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Itens ou empty state */}
      {expenses.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="body" color={Colors.neutral.placeholder} style={styles.emptyText}>
            Ainda sem despesas registradas
          </Text>
          <Text variant="caption" color={Colors.neutral.placeholder}>
            Toque em + para adicionar a primeira
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {expenses.map((expense, index) => (
            <React.Fragment key={expense.id}>
              <ExpensesShortcutItem
                item={expense}
                onPress={() => onPressExpense?.(expense)}
              />
              {index < expenses.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
      )}

    </View>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const ICON_SIZE = 48

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    gap: Spacing.sm,
    ...Shadows.sm,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xs,
  },

  list: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },

  iconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textWrap: {
    flex: 1,
    gap: 2,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.neutral.border,
    marginLeft: ICON_SIZE + Spacing.md * 2,
  },

  empty: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
  },
})
