/**
 * Componente Badge - Tag de status reutilizável
 *
 * Variantes: 'credit' | 'debt' | 'settled' | 'pending' | 'brand'
 * Tamanhos: 'sm' | 'md'
 */

import React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'

import { Colors, Radius, Spacing, Typography } from '../../constants/theme'
import { Text } from './Text'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

export type BadgeVariant = 'credit' | 'debt' | 'settled' | 'pending' | 'brand'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  /** Variante visual */
  variant: BadgeVariant
  /** Texto do badge */
  label: string
  /** Tamanho do badge */
  size?: BadgeSize
  /** Estilos customizados */
  style?: ViewStyle
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
})

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export const Badge = React.forwardRef<View, BadgeProps>(
  (
    {
      variant,
      label,
      size = 'md',
      style,
    },
    ref
  ) => {
    // Determina cores baseado na variante
    const getVariantStyles = (): { bg: string; textColor: string } => {
      switch (variant) {
        case 'credit':
          return { bg: Colors.status.creditBg, textColor: Colors.status.credit }
        case 'debt':
          return { bg: Colors.status.debtBg, textColor: Colors.status.debt }
        case 'settled':
          return { bg: Colors.neutral.surface, textColor: Colors.neutral.secondary }
        case 'pending':
          return { bg: Colors.status.pendingBg, textColor: Colors.status.pending }
        case 'brand':
          return { bg: Colors.brand.xlight, textColor: Colors.brand.primary }
        default:
          return { bg: Colors.brand.xlight, textColor: Colors.brand.primary }
      }
    }

    // Determina padding baseado no tamanho
    const getSizeStyles = (): { paddingVertical: number; paddingHorizontal: number } => {
      switch (size) {
        case 'sm':
          return { paddingVertical: 4, paddingHorizontal: 12 }
        case 'md':
        default:
          return { paddingVertical: 6, paddingHorizontal: 16 }
      }
    }

    const variantStyles = getVariantStyles()
    const sizeStyles = getSizeStyles()
    const textVariant = size === 'sm' ? 'caption' : 'label'

    return (
      <View
        ref={ref}
        style={[
          styles.badge,
          {
            backgroundColor: variantStyles.bg,
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
          },
          style,
        ]}
      >
        <Text
          variant={textVariant}
          color={variantStyles.textColor}
          weight="500"
        >
          {label}
        </Text>
      </View>
    )
  }
)

Badge.displayName = 'Badge'

/**
 * EXEMPLOS DE USO:
 *
 * // Badge de crédito
 * <Badge variant="credit" label="Crédito" />
 *
 * // Badge de débito pequeno
 * <Badge variant="debt" label="Débito" size="sm" />
 *
 * // Badge de status resolvido
 * <Badge variant="settled" label="Resolvido" />
 *
 * // Badge de pendente
 * <Badge variant="pending" label="Pendente" />
 *
 * // Badge brand com estilos customizados
 * <Badge
 *   variant="brand"
 *   label="KLOT Pro"
 *   style={{ marginTop: 8 }}
 * />
 *
 * // Múltiplos badges juntos
 * <View style={{ flexDirection: 'row', gap: 8 }}>
 *   <Badge variant="credit" label="Crédito" />
 *   <Badge variant="debt" label="Débito" size="sm" />
 * </View>
 */
