import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import { CobrancaIcon, PixIcon } from './ui'
import { Text } from './ui'
import { Colors, Radius, Shadows, Spacing } from '../constants/theme'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

interface Shortcut {
  label: string
  Icon: React.FC<{ size?: number; color?: string }>
  onPress: () => void
}

interface HomeShortcutsProps {
  onPix?: () => void
  onCobrar?: () => void
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function HomeShortcuts({ onPix, onCobrar }: HomeShortcutsProps) {
  const shortcuts: Shortcut[] = [
    { label: 'Pagar com PIX', Icon: PixIcon,      onPress: onPix    ?? (() => {}) },
    { label: 'Cobrar',        Icon: CobrancaIcon, onPress: onCobrar ?? (() => {}) },
  ]

  return (
    <View style={styles.row}>
      {shortcuts.map((item) => (
        <TouchableOpacity
          key={item.label}
          style={styles.card}
          onPress={item.onPress}
          activeOpacity={0.7}
        >
          <View style={styles.iconWrap}>
            <item.Icon size={20} color={Colors.neutral.secondary} />
          </View>
          <Text variant="label" color={Colors.neutral.primary} weight="600" style={styles.label}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    ...Shadows.sm,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flexShrink: 1,
  },
})
