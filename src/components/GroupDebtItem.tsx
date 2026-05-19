import React from 'react'
import { StyleSheet, View } from 'react-native'

import {
  CasaIcon,
  ComidaIcon,
  ContasIcon,
  FestaIcon,
  Text,
  TrabalhoIcon,
  TransporteIcon,
  ViagemIcon,
} from './ui'
import { Colors, Spacing } from '../constants/theme'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

export interface GroupExpense {
  id: string
  title: string
  category: string
  amount: number
  date: string
  payer_name: string
  split_count: number
  direction: 'credit' | 'debt' | 'neutral'
}

interface Props {
  expense: GroupExpense
}

const CATEGORY_ICON: Record<string, React.FC<{ size?: number; color?: string }>> = {
  comida:     ComidaIcon,
  transporte: TransporteIcon,
  casa:       CasaIcon,
  viagem:     ViagemIcon,
  trabalho:   TrabalhoIcon,
  festa:      FestaIcon,
  outro:      ContasIcon,
}

const AMOUNT_COLOR: Record<GroupExpense['direction'], string> = {
  credit:  Colors.status.credit,
  debt:    Colors.status.debt,
  neutral: Colors.neutral.secondary,
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function GroupDebtItem({ expense }: Props) {
  const Icon = CATEGORY_ICON[expense.category] ?? ContasIcon
  const firstName = expense.payer_name.split(' ')[0]
  const amountStr = `R$ ${expense.amount.toFixed(2).replace('.', ',')}`
  const dateStr = new Date(expense.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  const perPerson = expense.split_count > 0
    ? `R$ ${(expense.amount / expense.split_count).toFixed(2).replace('.', ',')} cada`
    : null

  return (
    <View style={styles.row}>
      <View style={styles.iconCircle}>
        <Icon size={18} color={Colors.brand.primary} />
      </View>

      <View style={styles.info}>
        <Text variant="label" color={Colors.neutral.primary} weight="600" numberOfLines={1}>
          {expense.title}
        </Text>
        <Text variant="caption" color={Colors.neutral.secondary} numberOfLines={1}>
          Pago por {firstName}
        </Text>
        {perPerson && (
          <Text variant="caption" color={Colors.neutral.placeholder} numberOfLines={1}>
            {expense.split_count} pessoa{expense.split_count > 1 ? 's' : ''} · {perPerson}
          </Text>
        )}
      </View>

      <View style={styles.right}>
        <Text variant="label" color={AMOUNT_COLOR[expense.direction]} weight="700">
          {amountStr}
        </Text>
        <Text variant="caption" color={Colors.neutral.secondary}>
          {dateStr}
        </Text>
      </View>
    </View>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const ICON_SIZE = 40

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  iconCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: Colors.brand.xlight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
    flexShrink: 0,
  },
})
