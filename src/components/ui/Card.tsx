/**
 * Componente Card - Container base reutilizável
 *
 * Proporciona padding, border-radius, shadow e opcionalmente borda
 * Pode ser Pressable se passar onPress
 */

import React from 'react'
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native'

import { Colors, Radius, Shadows, Spacing } from '../../constants/theme'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

export type ShadowVariant = 'sm' | 'md' | 'lg'

export interface CardProps {
  /** Padding interno */
  padding?: number
  /** Border radius */
  radius?: number
  /** Variante de sombra */
  shadow?: ShadowVariant
  /** Mostra borda */
  border?: boolean
  /** Conteúdo do card */
  children: React.ReactNode
  /** Callback ao pressionar (torna o card Pressable) */
  onPress?: () => void
  /** Estilos customizados */
  style?: ViewStyle
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.neutral.white,
    overflow: 'hidden',
  },
})

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export const Card = React.forwardRef<React.ComponentRef<typeof View>, CardProps>(
  (
    {
      padding = Spacing.md,
      radius = Radius.lg,
      shadow = 'sm',
      border = false,
      children,
      onPress,
      style,
    },
    ref
  ) => {
    // Obtém estilos da sombra
    const shadowStyles = Shadows[shadow]

    const cardStyles = [
      styles.card,
      {
        padding,
        borderRadius: radius,
        borderWidth: border ? 1 : 0,
        borderColor: border ? Colors.neutral.border : 'transparent',
        ...shadowStyles,
      },
      style,
    ]

    // Se tem onPress, retorna Pressable, senão View
    if (onPress) {
      return (
        <Pressable
          style={({ pressed }) => [
            ...cardStyles,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={onPress}
        >
          {children}
        </Pressable>
      )
    }

    return (
      <View
        ref={ref}
        style={cardStyles}
      >
        {children}
      </View>
    )
  }
)

Card.displayName = 'Card'

/**
 * EXEMPLOS DE USO:
 *
 * // Card básico
 * <Card>
 *   <Text variant="h3">Saldo Total</Text>
 *   <Text variant="display" color={Colors.brand.primary}>
 *     R$ 1.250,00
 *   </Text>
 * </Card>
 *
 * // Card com borda e sombra maior
 * <Card border shadow="lg" padding={24}>
 *   <Text>Transação</Text>
 * </Card>
 *
 * // Card interativo (Pressable)
 * <Card
 *   onPress={() => console.log('card pressed')}
 *   shadow="md"
 * >
 *   <Text variant="label" weight="600">
 *     Clique para abrir
 *   </Text>
 * </Card>
 *
 * // Card com estilos customizados
 * <Card
 *   padding={Spacing.lg}
 *   radius={Radius.xl}
 *   border
 *   style={{ marginBottom: Spacing.md }}
 * >
 *   <Text>Conteúdo customizado</Text>
 * </Card>
 */
