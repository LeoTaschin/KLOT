import i18n from '../i18n'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'

import { Colors, Radius, Shadows, Spacing } from '../constants/theme'
import { Text } from './ui'

// ═══════════════════════════════════════════════════════════════════
// DADOS
// ═══════════════════════════════════════════════════════════════════

const LANGUAGES = [
  { code: 'pt-BR', flag: '🇧🇷', label: 'Português', short: 'PT' },
  { code: 'en',    flag: '🇺🇸', label: 'English',   short: 'EN' },
  { code: 'es',    flag: '🇪🇸', label: 'Español',   short: 'ES' },
] as const

type LanguageCode = typeof LANGUAGES[number]['code']

const SHEET_HEIGHT = 220
const { height: SCREEN_HEIGHT } = Dimensions.get('window')

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function LanguageSelector() {
  const { i18n: i18nInstance } = useTranslation()
  const [visible, setVisible] = useState(false)

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const current = LANGUAGES.find((l) => l.code === i18nInstance.language)
    ?? LANGUAGES[0]

  // ── Animações ──────────────────────────────────────────────────

  const openSheet = () => {
    setVisible(true)
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const closeSheet = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false)
      callback?.()
    })
  }

  // Reset ao fechar
  useEffect(() => {
    if (!visible) {
      translateY.setValue(SHEET_HEIGHT)
      backdropOpacity.setValue(0)
    }
  }, [visible])

  // ── Handlers ───────────────────────────────────────────────────

  const handleSelect = (code: LanguageCode) => {
    if (code === i18nInstance.language) {
      closeSheet()
      return
    }
    closeSheet(() => i18n.changeLanguage(code))
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <>
      {/* ── Trigger ── */}
      <TouchableOpacity
        onPress={openSheet}
        style={styles.trigger}
        activeOpacity={0.7}
      >
        <Text style={styles.triggerFlag}>{current.flag}</Text>
        <Text variant="label" color={Colors.neutral.secondary}>
          {current.short}
        </Text>
        <Text variant="caption" color={Colors.neutral.placeholder} style={styles.chevron}>
          ›
        </Text>
      </TouchableOpacity>

      {/* ── Bottom Sheet ── */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={() => closeSheet()}
        statusBarTranslucent
      >
        {/* Backdrop */}
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
          pointerEvents="box-none"
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => closeSheet()} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY }] },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Título */}
          <Text variant="h3" color={Colors.neutral.primary} style={styles.title}>
            Idioma
          </Text>

          {/* Cartões */}
          <View style={styles.cards}>
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === i18nInstance.language

              return (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => handleSelect(lang.code)}
                  activeOpacity={0.7}
                  style={[
                    styles.card,
                    isSelected && styles.cardSelected,
                  ]}
                >
                  <Text style={styles.cardFlag}>{lang.flag}</Text>
                  <Text
                    variant="label"
                    color={isSelected ? Colors.brand.primary : Colors.neutral.secondary}
                    weight={isSelected ? '600' : '400'}
                    style={styles.cardLabel}
                  >
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </Animated.View>
      </Modal>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // ── Trigger ──
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: Spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    backgroundColor: Colors.neutral.white,
  },
  triggerFlag: {
    fontSize: 15,
    lineHeight: 20,
  },
  chevron: {
    fontSize: 16,
    lineHeight: 20,
  },

  // ── Backdrop ──
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },

  // ── Sheet ──
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    ...Shadows.lg,
  },

  // Drag handle
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.neutral.border,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },

  title: {
    marginBottom: Spacing.md,
  },

  // ── Cartões ──
  cards: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    backgroundColor: Colors.neutral.white,
    gap: Spacing.xs,
  },
  cardSelected: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.xlight,
  },
  cardFlag: {
    fontSize: 28,
    lineHeight: 34,
  },
  cardLabel: {
    textAlign: 'center',
  },
})
