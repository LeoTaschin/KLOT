import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native'

import { Colors, Spacing } from '../../constants/theme'
import { Text } from './Text'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Label flutuante */
  label: string
  /** Mensagem de erro — exibe linha vermelha + texto */
  error?: string | null
  /** Elemento à direita (ícone, botão clear, toggle senha) */
  rightElement?: React.ReactNode
  /** Estilos do container externo */
  containerStyle?: ViewStyle
  /** Ref externo para focar o campo */
  inputRef?: React.RefObject<TextInput | null>
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      rightElement,
      containerStyle,
      inputRef,
      value,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false)
    const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current

    const hasContent = Boolean(value && value.length > 0)
    const shakeAnim = useRef(new Animated.Value(0)).current

    // ── Anima o label para cima quando focused ou tem conteúdo ────

    useEffect(() => {
      Animated.timing(labelAnim, {
        toValue: focused || hasContent ? 1 : 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start()
    }, [focused, hasContent])

    // ── Shake quando erro aparece ──────────────────────────────────

    useEffect(() => {
      if (!error) return
      shakeAnim.setValue(0)
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -5, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4,  duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -3, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0,  duration: 40, useNativeDriver: true }),
      ]).start()
    }, [error])

    const labelTop = labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 0],
    })

    const labelSize = labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    })

    const labelColor = labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [Colors.neutral.placeholder, focused ? Colors.brand.primary : Colors.neutral.secondary],
    })

    const lineColor = error
      ? Colors.status.debt
      : focused
        ? Colors.brand.primary
        : Colors.neutral.border

    const lineHeight = focused || error ? 1.5 : 1

    // ── Handlers ──────────────────────────────────────────────────

    const handleFocus = (e: any) => {
      setFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: any) => {
      setFocused(false)
      onBlur?.(e)
    }

    // ── Render ────────────────────────────────────────────────────

    return (
      <Animated.View
        style={[
          styles.container,
          containerStyle,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        {/* Label flutuante */}
        <Animated.Text
          style={[
            styles.label,
            {
              top: labelTop,
              fontSize: labelSize,
              color: labelColor,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>

        {/* Input + ação direita */}
        <View style={[styles.row, error ? styles.rowError : null]}>
          <TextInput
            ref={inputRef ?? ref}
            value={value}
            style={styles.input}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholderTextColor="transparent"
            {...rest}
          />

          {rightElement && (
            <View style={styles.rightSlot}>
              {rightElement}
            </View>
          )}
        </View>

        {/* Linha inferior */}
        <View style={[styles.line, { backgroundColor: lineColor, height: lineHeight }]} />

        {/* Mensagem de erro */}
        {error && (
          <Text variant="caption" color={Colors.status.debt} style={styles.errorText}>
            {error}
          </Text>
        )}
      </Animated.View>
    )
  },
)

Input.displayName = 'Input'

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    paddingTop: 18,       // espaço para o label flutuar
    marginBottom: Spacing.lg,
  },
  label: {
    position: 'absolute',
    left: 0,
    fontFamily: undefined,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    borderRadius: 6,
    paddingHorizontal: 2,
  },
  rowError: {
    backgroundColor: `${Colors.status.debtBg}`,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.neutral.primary,
    padding: 0,
    margin: 0,
  },
  rightSlot: {
    marginLeft: Spacing.sm,
    justifyContent: 'center',
  },
  line: {
    width: '100%',
  },
  errorText: {
    marginTop: Spacing.xs,
  },
})
