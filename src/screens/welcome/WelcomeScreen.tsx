/**
 * WelcomeScreen - Tela de boas-vindas do KLOT
 *
 * Exibe animação, mensagens motivacionais e opções de:
 * - Criar nova conta
 * - Fazer login
 *
 * Gerencia AsyncStorage para não exibir novamente
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import LottieView from 'lottie-react-native'
import React, { useEffect, useRef } from 'react'
import {
  Animated,
  Easing,
  StatusBar,
  TouchableOpacity,
  View,
} from 'react-native'

import { Button, Text } from '../../components/ui'
import { Colors, Spacing } from '../../constants/theme'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

interface NavigationProp {
  replace: (route: string) => void
  push: (route: string) => void
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>()

  // Referências de animação
  const lottieOpacity = useRef(new Animated.Value(0)).current
  const contentOpacity = useRef(new Animated.Value(0)).current
  const contentTranslateY = useRef(new Animated.Value(20)).current

  // ═══════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    checkWelcomeStatus()
    startAnimations()
  }, [])

  // ═══════════════════════════════════════════════════════════════════
  // FUNÇÕES
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Verifica se o usuário já viu a welcome screen
   * Se sim, redireciona para a tela inicial
   */
  const checkWelcomeStatus = async () => {
    try {
      const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome')
      if (hasSeenWelcome === 'true') {
        // Redireciona sem volta
        navigation.replace('/(tabs)/home')
      }
    } catch (error) {
      console.error('Error checking welcome status:', error)
    }
  }

  /**
   * Inicia as animações de entrada
   */
  const startAnimations = () => {
    // Animação do Lottie: fade in 600ms
    Animated.timing(lottieOpacity, {
      toValue: 1,
      duration: 600,
      delay: 0,
      useNativeDriver: true,
    }).start()

    // Animação do conteúdo: fade in + translate
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 800,
        delay: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()
  }

  /**
   * Handle: criar conta
   * Salva AsyncStorage e navega para registro
   */
  const handleCriarConta = async () => {
    try {
      await AsyncStorage.setItem('hasSeenWelcome', 'true')
      navigation.push('/auth/registro')
    } catch (error) {
      console.error('Error saving welcome status:', error)
    }
  }

  /**
   * Handle: já tenho conta
   * Salva AsyncStorage e navega para login
   */
  const handleLogin = async () => {
    try {
      await AsyncStorage.setItem('hasSeenWelcome', 'true')
      navigation.push('/auth/login')
    } catch (error) {
      console.error('Error saving welcome status:', error)
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: Colors.neutral.white,
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.neutral.white} />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ÁREA SUPERIOR — Animação (60%) */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <Animated.View
        style={{
          flex: 0.6,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: lottieOpacity,
        }}
      >
        <LottieView
          source={require('../../assets/animations/Split.json')}
          autoPlay
          loop
          style={{
            width: 280,
            height: 280,
          }}
        />
      </Animated.View>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ÁREA INFERIOR — Conteúdo (40%) */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <Animated.View
        style={{
          flex: 0.4,
          paddingHorizontal: Spacing.lg,
          paddingBottom: Spacing.xl,
          justifyContent: 'space-between',
          opacity: contentOpacity,
          transform: [{ translateY: contentTranslateY }],
        }}
      >
        {/* Textos */}
        <View>
          {/* Texto principal */}
          <Text
            variant="display"
            color={Colors.neutral.primary}
            align="center"
            style={{
              marginBottom: Spacing.sm,
            }}
          >
            Dinheiro não deveria complicar amizade.
          </Text>

          {/* Texto secundário */}
          <Text
            variant="bodyLg"
            color={Colors.neutral.secondary}
            align="center"
          >
            Divide contas, acerte via PIX e mantenha tudo organizado.
          </Text>
        </View>

        {/* Botões */}
        <View
          style={{
            gap: Spacing.sm,
          }}
        >
          {/* Botão primário: Criar conta */}
          <Button
            variant="primary"
            size="md"
            label="Criar minha conta"
            onPress={handleCriarConta}
            fullWidth
          />

          {/* Botão secundário: Já tenho conta */}
          <TouchableOpacity onPress={handleLogin}>
            <Text
              variant="body"
              color={Colors.neutral.secondary}
              align="center"
              style={{
                paddingVertical: Spacing.sm,
              }}
            >
              Já tenho uma conta
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  )
}
