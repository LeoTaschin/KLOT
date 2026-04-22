import React, { useState } from 'react'
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenTransition } from '../../../components/ScreenTransition'
import { Text } from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import type { DebtStackParamList } from '../../../navigation/types'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

type Props = NativeStackScreenProps<DebtStackParamList, 'DebtValue'>

// Valores rápidos em centavos
const QUICK_AMOUNTS = [1000, 2000, 5000, 10000] // R$10, R$20, R$50, R$100

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

/** Formata centavos para exibição: 15050 → "150,50" */
function formatCents(cents: number): string {
  const reais = Math.floor(cents / 100)
  const centavos = cents % 100
  return `${reais},${String(centavos).padStart(2, '0')}`
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function DebtValueScreen({ navigation, route }: Props) {
  const { type, targetId, targetName, avatarUrl } = route.params

  // Valor em centavos — o usuário digita como se fosse uma calculadora:
  // pressionar "5" vira 5 centavos, depois "0" vira 50, depois "0" vira 500 (R$5,00)
  const [cents, setCents] = useState(0)

  const handleDigit = (digit: string) => {
    setCents((prev) => {
      const next = prev * 10 + Number(digit)
      // Limite: R$9999,99 = 999999 centavos
      return next > 999999 ? prev : next
    })
  }

  const handleBackspace = () => {
    setCents((prev) => Math.floor(prev / 10))
  }

  const handleQuickAmount = (amount: number) => {
    setCents((prev) => {
      const next = prev + amount
      return next > 999999 ? 999999 : next
    })
  }

  const handleContinue = () => {
    if (cents === 0) return

    if (type === 'friend') {
      navigation.navigate('DebtReviewIndividual', {
        friendId: targetId,
        friendName: targetName,
        avatarUrl,
        amount: cents,
      })
    } else {
      navigation.navigate('DebtReviewGroup', {
        groupId: targetId,
        groupName: targetName,
        amount: cents,
      })
    }
  }

  const isEmpty = cents === 0

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>
      <View style={styles.container}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
            <Text variant="body" color={Colors.brand.primary}>← Voltar</Text>
          </TouchableOpacity>
          <Text variant="body" color={Colors.neutral.secondary}>
            Dívida com{' '}
            <Text variant="body" color={Colors.neutral.primary} weight="600">
              {targetName}
            </Text>
          </Text>
        </View>

        {/* ── Display do valor ── */}
        <View style={styles.displayWrap}>
          <Text variant="caption" color={Colors.neutral.placeholder} style={styles.currencyLabel}>
            R$
          </Text>
          <Text
            style={[
              styles.amountDisplay,
              { color: isEmpty ? Colors.neutral.placeholder : Colors.neutral.primary },
            ]}
          >
            {isEmpty ? '0,00' : formatCents(cents)}
          </Text>
        </View>

        {/* ── Botões de valor rápido ── */}
        <View style={styles.quickRow}>
          {QUICK_AMOUNTS.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={styles.quickBtn}
              onPress={() => handleQuickAmount(amount)}
              activeOpacity={0.7}
            >
              <Text variant="caption" color={Colors.brand.primary} weight="600">
                +R${amount / 100}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Teclado numérico ── */}
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
                    style={[styles.numpadKey, isBackspace && styles.numpadKeyBackspace]}
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

        {/* ── Continuar ── */}
        <TouchableOpacity
          style={[styles.continueBtn, isEmpty && styles.continueBtnDisabled]}
          onPress={handleContinue}
          activeOpacity={isEmpty ? 1 : 0.8}
        >
          <Text variant="label" color={Colors.neutral.white} weight="700">
            Continuar
          </Text>
        </TouchableOpacity>

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
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    gap: Spacing.xs,
  },
  backBtn: {
    alignSelf: 'flex-start',
  },

  // Display
  displayWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.lg,
  },
  currencyLabel: {
    marginBottom: 10,
    fontSize: 20,
  },
  amountDisplay: {
    fontSize: 64,
    fontWeight: '700',
    lineHeight: 72,
    letterSpacing: -1,
  },

  // Quick amounts
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  quickBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.xlight,
    borderWidth: 1,
    borderColor: Colors.brand.light,
  },

  // Numpad
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
  numpadKeyBackspace: {
    backgroundColor: Colors.neutral.surface,
  },

  // Botão continuar
  continueBtn: {
    height: 54,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    shadowColor: Colors.brand.primary,
    shadowOpacity: 0.3,
  },
  continueBtnDisabled: {
    backgroundColor: Colors.neutral.border,
    shadowOpacity: 0,
    elevation: 0,
  },
})
