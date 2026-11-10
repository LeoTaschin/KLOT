import { SafeAreaView } from 'react-native-safe-area-context'
import LottieView from 'lottie-react-native'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Animated,
  Easing,
  StatusBar,
  TouchableOpacity,
  View,
} from 'react-native'

import { Button, Text } from '../../components/ui'
import { LanguageSelector } from '../../components/LanguageSelector'
import { Colors, Spacing } from '../../constants/theme'
import { useAuthStore } from '../../store/useAuthStore'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function WelcomeScreen() {
  const completeWelcome = useAuthStore((state) => state.completeWelcome)
  const { t } = useTranslation()

  // Referências de animação
  const lottieOpacity = useRef(new Animated.Value(0)).current
  const contentOpacity = useRef(new Animated.Value(0)).current
  const contentTranslateY = useRef(new Animated.Value(20)).current

  // ═══════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    startAnimations()
  }, [])

  // ═══════════════════════════════════════════════════════════════════
  // FUNÇÕES
  // ═══════════════════════════════════════════════════════════════════

  const startAnimations = () => {
    Animated.timing(lottieOpacity, {
      toValue: 1,
      duration: 600,
      delay: 0,
      useNativeDriver: true,
    }).start()

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

  // Marca welcome como visto e navega para registro
  const handleCriarConta = () => {
    completeWelcome('RegisterInfo')
  }

  const handleLogin = () => {
    completeWelcome('Login')
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
      <StatusBar barStyle="dark-content" />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HEADER — Seletor de idioma */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm }}>
        <LanguageSelector />
      </View>

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
          <Text
            variant="display"
            color={Colors.neutral.primary}
            align="center"
            style={{ marginBottom: Spacing.sm }}
          >
            {t('welcome.title')}
          </Text>

          <Text
            variant="bodyLg"
            color={Colors.neutral.secondary}
            align="center"
          >
            {t('welcome.subtitle')}
          </Text>
        </View>

        {/* Botões */}
        <View style={{ gap: Spacing.sm }}>
          <Button
            variant="primary"
            size="md"
            label={t('welcome.createAccount')}
            onPress={handleCriarConta}
            fullWidth
          />

          <TouchableOpacity onPress={handleLogin}>
            <Text
              variant="body"
              color={Colors.neutral.secondary}
              align="center"
              style={{ paddingVertical: Spacing.sm }}
            >
              {t('welcome.signIn')}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  )
}
