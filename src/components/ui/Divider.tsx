/**
 * Componente Divider - Linha divisória reutilizável
 *
 * Proporciona uma linha horizontal com espaçamento vertical customizável
 */

import React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'

import { Colors, Spacing } from '../../constants/theme'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

export interface DividerProps {
  /** Espaçamento vertical (margem acima e abaixo) */
  spacing?: number
  /** Cor da linha */
  color?: string
  /** Altura da linha */
  height?: number
  /** Estilos customizados */
  style?: ViewStyle
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  divider: {
    width: '100%',
  },
})

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export const Divider = React.forwardRef<View, DividerProps>(
  (
    {
      spacing = Spacing.md,
      color = Colors.neutral.border,
      height = 1,
      style,
    },
    ref
  ) => {
    return (
      <View
        ref={ref}
        style={[
          styles.divider,
          {
            marginVertical: spacing,
            backgroundColor: color,
            height,
          },
          style,
        ]}
      />
    )
  }
)

Divider.displayName = 'Divider'

/**
 * EXEMPLOS DE USO:
 *
 * // Divider padrão
 * <Divider />
 *
 * // Divider com espaçamento maior
 * <Divider spacing={32} />
 *
 * // Divider com cor customizada
 * <Divider color={Colors.brand.light} />
 *
 * // Divider mais grosso
 * <Divider height={2} color={Colors.neutral.border} />
 *
 * // Divider sem margem vertical
 * <Divider spacing={0} />
 *
 * // Divider com estilo customizado
 * <Divider
 *   spacing={Spacing.lg}
 *   color={Colors.brand.primary}
 *   style={{ marginHorizontal: Spacing.md }}
 * />
 *
 * // Exemplo de uso em lista
 * <View>
 *   <Text>Item 1</Text>
 *   <Divider />
 *   <Text>Item 2</Text>
 *   <Divider />
 *   <Text>Item 3</Text>
 * </View>
 */
