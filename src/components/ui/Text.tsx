/**
 * Componente Text - Tipografia reutilizável
 *
 * Variantes: 'display' | 'h1' | 'h2' | 'h3' | 'bodyLg' | 'body' | 'label' | 'caption'
 * Controla font-size, line-height, font-weight e cor
 */

import React from 'react'
import { StyleSheet, Text as RNText, TextProps, TextStyle } from 'react-native'

import { Colors, Typography } from '../../constants/theme'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

export type TextVariant = 'display' | 'h1' | 'h2' | 'h3' | 'bodyLg' | 'body' | 'label' | 'caption'
export type TextAlign = 'left' | 'center' | 'right'
export type FontWeight = '400' | '500' | '600' | '700' | '800'

export interface CustomTextProps extends Omit<TextProps, 'style'> {
  /** Variante tipográfica */
  variant?: TextVariant
  /** Cor do texto */
  color?: string
  /** Alinhamento */
  align?: TextAlign
  /** Font weight customizado */
  weight?: FontWeight
  /** Estilos customizados */
  style?: TextStyle
  /** Conteúdo do texto */
  children: React.ReactNode
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  baseText: {
    color: Colors.neutral.primary,
  },
})

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export const Text = React.forwardRef<RNText, CustomTextProps>(
  (
    {
      variant = 'body',
      color = Colors.neutral.primary,
      align = 'left',
      weight,
      style,
      children,
      ...restProps
    },
    ref
  ) => {
    // Obtém os estilos da variante
    const variantStyles = Typography[variant]

    // Font weight customizado sobrescreve o da variante
    const finalWeight = weight || variantStyles.fontWeight

    return (
      <RNText
        ref={ref}
        style={[
          styles.baseText,
          {
            fontSize: variantStyles.fontSize,
            lineHeight: variantStyles.lineHeight,
            fontWeight: finalWeight,
            color,
            textAlign: align,
          },
          style,
        ]}
        {...restProps}
      >
        {children}
      </RNText>
    )
  }
)

Text.displayName = 'Text'

/**
 * EXEMPLOS DE USO:
 *
 * // Título display
 * <Text variant="display">Bem-vindo ao KLOT</Text>
 *
 * // Heading 1
 * <Text variant="h1">Meu Saldo</Text>
 *
 * // Texto de corpo com cor customizada
 * <Text color={Colors.status.credit}>Crédito disponível</Text>
 *
 * // Texto centralizado e em caption
 * <Text variant="caption" align="center" color={Colors.neutral.secondary}>
 *   Sem transações
 * </Text>
 *
 * // Texto com weight customizado
 * <Text variant="body" weight="600" color={Colors.brand.primary}>
 *   Importante
 * </Text>
 *
 * // Combinação de múltiplas props
 * <Text
 *   variant="label"
 *   color={Colors.status.debt}
 *   align="center"
 *   weight="700"
 * >
 *   Débito vencido
 * </Text>
 */
