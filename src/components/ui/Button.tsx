/**
 * Componente Button - Botão reutilizável com múltiplas variantes
 *
 * Variantes: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
 * Tamanhos: 'sm' | 'md' | 'lg'
 */

import React, { useRef } from 'react'
import {
  ActivityIndicator,
  Animated,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from 'react-native'

import { Colors, Radius, Spacing, Typography } from '../../constants/theme'
import { Text } from './Text'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  /** Variante visual do botão */
  variant?: ButtonVariant
  /** Tamanho do botão */
  size?: ButtonSize
  /** Texto do botão */
  label: string
  /** Callback ao pressionar */
  onPress: (event?: GestureResponderEvent) => void
  /** Desabilita o botão */
  disabled?: boolean
  /** Mostra loading spinner */
  loading?: boolean
  /** Faz o botão ocupar toda a largura */
  fullWidth?: boolean
  /** Ícone à esquerda */
  leftIcon?: React.ReactNode
  /** Ícone à direita */
  rightIcon?: React.ReactNode
  /** Estilos customizados */
  style?: ViewStyle
  /** Estilos customizados do texto */
  textStyle?: TextStyle
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  baseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
})

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export const Button = React.forwardRef<any, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      label,
      onPress,
      disabled = false,
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      style,
      textStyle,
    },
    ref
  ) => {
    const scaleAnim = useRef(new Animated.Value(1)).current

    // Animação de press
    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 20,
        bounciness: 5,
      }).start()
    }

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 5,
      }).start()
    }

    // Determina estilos baseado na variante
    const getVariantStyles = (): { bg: string; textColor: string; border?: string } => {
      switch (variant) {
        case 'primary':
          return { bg: Colors.brand.primary, textColor: Colors.neutral.white }
        case 'secondary':
          return { bg: Colors.brand.xlight, textColor: Colors.brand.primary }
        case 'outline':
          return { bg: 'transparent', textColor: Colors.brand.primary, border: Colors.brand.light }
        case 'ghost':
          return { bg: 'transparent', textColor: Colors.brand.primary }
        case 'destructive':
          return { bg: Colors.status.debtBg, textColor: Colors.status.debt }
        default:
          return { bg: Colors.brand.primary, textColor: Colors.neutral.white }
      }
    }

    // Determina padding baseado no tamanho
    const getSizeStyles = (): { paddingVertical: number; paddingHorizontal: number; radius: number } => {
      switch (size) {
        case 'sm':
          return { paddingVertical: 10, paddingHorizontal: 16, radius: Radius.md }
        case 'lg':
          return { paddingVertical: 16, paddingHorizontal: 24, radius: Radius.lg }
        case 'md':
        default:
          return { paddingVertical: 14, paddingHorizontal: 20, radius: Radius.md }
      }
    }

    const variantStyles = getVariantStyles()
    const sizeStyles = getSizeStyles()
    const isDisabledOrLoading = disabled || loading

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }], alignSelf: fullWidth ? 'stretch' : 'flex-start' }}>
        <Pressable
          ref={ref}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isDisabledOrLoading}
          style={[
            styles.baseButton,
            {
              backgroundColor: variantStyles.bg,
              paddingVertical: sizeStyles.paddingVertical,
              paddingHorizontal: sizeStyles.paddingHorizontal,
              borderRadius: sizeStyles.radius,
              borderWidth: variantStyles.border ? 1 : 0,
              borderColor: variantStyles.border,
              opacity: isDisabledOrLoading ? 0.45 : 1,
              width: fullWidth ? '100%' : 'auto',
            },
            style,
          ]}
        >
          <Animated.View style={styles.buttonContent}>
            {/* Ícone esquerdo */}
            {leftIcon && !loading && leftIcon}

            {/* Texto ou Loading */}
            {loading ? (
              <ActivityIndicator
                size="small"
                color={variantStyles.textColor}
              />
            ) : (
              <Text
                variant={size === 'lg' ? 'bodyLg' : 'label'}
                color={variantStyles.textColor}
                style={textStyle}
              >
                {label}
              </Text>
            )}

            {/* Ícone direito */}
            {rightIcon && !loading && rightIcon}
          </Animated.View>
        </Pressable>
      </Animated.View>
    )
  }
)

Button.displayName = 'Button'

/**
 * EXEMPLOS DE USO:
 *
 * // Botão primário básico
 * <Button label="Salvar" onPress={() => console.log('save')} />
 *
 * // Botão secondary com ícone
 * <Button
 *   variant="secondary"
 *   label="Editar"
 *   onPress={() => console.log('edit')}
 *   rightIcon={<Icon name="edit" />}
 * />
 *
 * // Botão com estado loading
 * <Button
 *   variant="primary"
 *   label="Enviando..."
 *   loading
 *   onPress={() => {}}
 * />
 *
 * // Botão destructive desabilizado
 * <Button
 *   variant="destructive"
 *   label="Deletar"
 *   disabled
 *   onPress={() => {}}
 * />
 *
 * // Botão full width
 * <Button
 *   fullWidth
 *   size="lg"
 *   label="Continuar"
 *   onPress={() => console.log('continue')}
 * />
 */
