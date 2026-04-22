import React, { useCallback, useRef } from 'react'
import { Animated, Easing, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

interface ScreenTransitionProps {
  children: React.ReactNode
  distance?: number   // px de deslocamento vertical inicial (default 18)
  duration?: number   // ms da animação (default 220)
}

/**
 * Envolve o conteúdo de uma tela com fade + slide-up toda vez que a tab é focada.
 * Uso: envolva o conteúdo dentro do SafeAreaView de cada screen.
 */
export function ScreenTransition({ children, distance = 18, duration = 220 }: ScreenTransitionProps) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(distance)).current

  useFocusEffect(
    useCallback(() => {
      opacity.setValue(0)
      translateY.setValue(distance)

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: duration + 30,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start()
    }, [distance, duration])
  )

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
