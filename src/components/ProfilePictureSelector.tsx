import React, { useEffect, useRef } from 'react'
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { CameraIcon, GalleryIcon, Text } from './ui'
import { Colors, Radius, Shadows, Spacing } from '../constants/theme'

interface Props {
  visible: boolean
  onClose: () => void
  onPickCamera: () => void
  onPickGallery: () => void
}

const SHEET_HEIGHT = 280

export function ProfilePictureSelector({ visible, onClose, onPickCamera, onPickGallery }: Props) {
  const insets = useSafeAreaInsets()
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      translateY.setValue(SHEET_HEIGHT)
      backdropOpacity.setValue(0)
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
  }, [visible])

  function closeAnimated(callback?: () => void) {
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
      onClose()
      callback?.()
    })
  }

  function handlePick(callback: () => void) {
    // Fecha sem animação e dispara o picker imediatamente — sem overhead de Modal nativo
    onClose()
    callback()
  }

  if (!visible) return null

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={() => closeAnimated()} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + Spacing.md },
          { transform: [{ translateY }] },
        ]}
      >
        <View style={styles.handle} />

        <Text variant="h3" color={Colors.neutral.primary} style={styles.title}>
          Alterar foto
        </Text>

        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => handlePick(onPickCamera)}
            activeOpacity={0.7}
          >
            <View style={styles.optionIcon}>
              <CameraIcon size={28} color={Colors.brand.primary} />
            </View>
            <Text variant="label" color={Colors.neutral.primary} weight="600">
              Câmera
            </Text>
            <Text variant="caption" color={Colors.neutral.secondary}>
              Tirar uma foto
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => handlePick(onPickGallery)}
            activeOpacity={0.7}
          >
            <View style={styles.optionIcon}>
              <GalleryIcon size={28} color={Colors.brand.primary} />
            </View>
            <Text variant="label" color={Colors.neutral.primary} weight="600">
              Galeria
            </Text>
            <Text variant="caption" color={Colors.neutral.secondary}>
              Escolher da galeria
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => closeAnimated()} style={styles.cancelButton} activeOpacity={0.7}>
          <Text variant="label" color={Colors.neutral.secondary} weight="500">
            Cancelar
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    ...Shadows.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.neutral.border,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.lg,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  optionCard: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.brand.xlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: Radius.lg,
    backgroundColor: Colors.neutral.surface,
    marginBottom: Spacing.xs,
  },
})
