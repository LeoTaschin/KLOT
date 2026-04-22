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
import { Colors, Radius, Shadows, Spacing } from '../constants/theme'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

export interface GroupExpense {
  id: string
  title: string
  category: string
  amount: number
  payer_name: string
  split_count: number
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

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function GroupDebtItem({ expense }: Props) {
  const Icon = CATEGORY_ICON[expense.category] ?? ContasIcon
  const firstName = expense.payer_name.split(' ')[0]
  const total = `R$ ${expense.amount.toFixed(2).replace('.', ',')}`
  const perPerson = expense.split_count > 0
    ? `R$ ${(expense.amount / expense.split_count).toFixed(2).replace('.', ',')}`
    : null

  return (
    <View style={styles.row}>

      {/* ── Ícone com tag dentro dos limites ── */}
      <View style={styles.iconWrap}>
        <View style={styles.iconBg}>
          <Icon size={20} color={Colors.brand.primary} />
        </View>
        <View style={styles.payerTag}>
          <Text style={styles.payerTagText} numberOfLines={1}>
            {firstName}
          </Text>
        </View>
      </View>

      {/* ── Info: título + duas linhas de detalhe ── */}
      <View style={styles.info}>
        <Text variant="label" color={Colors.neutral.primary} weight="600" numberOfLines={1}>
          {expense.title}
        </Text>
        <Text variant="caption" color={Colors.neutral.secondary} numberOfLines={1}>
          Pago por {firstName}
        </Text>
        {expense.split_count > 0 && perPerson && (
          <Text variant="caption" color={Colors.neutral.placeholder} numberOfLines={1}>
            {expense.split_count} pessoa{expense.split_count > 1 ? 's' : ''} · {perPerson} cada
          </Text>
        )}
      </View>

      {/* ── Valor total destacado ── */}
      <View style={styles.valueWrap}>
        <Text variant="h3" color={Colors.neutral.primary} weight="700">
          {total}
        </Text>
      </View>

    </View>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const ICON_SIZE = 50

const styles = StyleSheet.create({
  row: {
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

  // Ícone
  iconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    flexShrink: 0,
  },
  iconBg: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: Radius.lg,
    backgroundColor: Colors.brand.xlight,
    borderWidth: 1,
    borderColor: Colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payerTag: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: Colors.neutral.white,
    maxWidth: 40,
  },
  payerTagText: {
    color: Colors.neutral.white,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  // Info
  info: {
    flex: 1,
    gap: 2,
  },

  // Valor
  valueWrap: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
})
