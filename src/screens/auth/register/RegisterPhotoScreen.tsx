import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'

import { KlotLogo } from '../../../components/KlotLogo'
import { CameraIcon, GalleryIcon, PersonIcon, Text } from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import { useRegisterStore } from '../../../store/useRegisterStore'
import type { AuthScreenProps } from '../../../navigation/types'

const AVATAR_SIZE = 140
const SHEET_HEIGHT = 280
const { height: SCREEN_HEIGHT } = Dimensions.get('window')

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function RegisterPhotoScreen({ navigation }: AuthScreenProps<'RegisterPhoto'>) {
  const { t } = useTranslation()
  const { bottom: bottomInset } = useSafeAreaInsets()
  const { setPhotoUri } = useRegisterStore()

  const [localUri, setLocalUri] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const sheetY = useRef(new Animated.Value(SHEET_HEIGHT)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  // Reset ao fechar
  useEffect(() => {
    if (!sheetOpen) {
      sheetY.setValue(SHEET_HEIGHT)
      backdropOpacity.setValue(0)
    }
  }, [sheetOpen])

  // ── Animações ────────────────────────────────────────────────────

  const openSheet = () => {
    setSheetOpen(true)
    Animated.parallel([
      Animated.timing(sheetY, {
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
      Animated.timing(sheetY, {
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
      setSheetOpen(false)
      callback?.()
    })
  }

  // ── Handlers de foto ─────────────────────────────────────────────

  const pickFromGallery = () => {
    closeSheet(async () => {
      try {
        const ImagePicker = await import('expo-image-picker')
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!permission.granted) return
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        })
        if (!result.canceled && result.assets[0]) {
          setLocalUri(result.assets[0].uri)
        }
      } catch (e) {
        console.warn('Gallery error:', e)
      }
    })
  }

  const pickFromCamera = () => {
    closeSheet(async () => {
      try {
        const ImagePicker = await import('expo-image-picker')
        const permission = await ImagePicker.requestCameraPermissionsAsync()
        if (!permission.granted) return
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        })
        if (!result.canceled && result.assets[0]) {
          setLocalUri(result.assets[0].uri)
        }
      } catch (e) {
        console.warn('Camera error:', e)
      }
    })
  }

  const handleNext = () => {
    setPhotoUri(localUri)
    navigation.navigate('RegisterUsername')
  }

  const handleSkip = () => {
    setPhotoUri(null)
    navigation.navigate('RegisterUsername')
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={12}>
            <Text variant="h2" color={Colors.neutral.primary}>‹</Text>
          </TouchableOpacity>
          <KlotLogo size={40} />
          <View style={styles.backButton} />
        </View>

        {/* ── Conteúdo ── */}
        <View style={styles.content}>
          <Text variant="h1" color={Colors.neutral.primary} style={styles.title}>
            {t('auth.register.photo.title')}
          </Text>
          <Text variant="body" color={Colors.neutral.secondary} style={styles.subtitle}>
            {t('auth.register.photo.subtitle')}
          </Text>

          {/* ── Avatar ── */}
          <View style={styles.avatarArea}>
            <TouchableOpacity onPress={openSheet} activeOpacity={0.8}>
              <View style={styles.avatarWrapper}>
                {localUri ? (
                  <Image source={{ uri: localUri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <PersonIcon size={64} color={Colors.neutral.placeholder} />
                  </View>
                )}
                <View style={styles.addButton}>
                  <Text style={styles.addButtonText}>{localUri ? '✎' : '+'}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {localUri && (
              <TouchableOpacity onPress={() => setLocalUri(null)} hitSlop={8} style={styles.removeLink}>
                <Text variant="caption" color={Colors.status.debt}>
                  Remover foto
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Rodapé ── */}
        <View style={[styles.footer, { paddingBottom: bottomInset + Spacing.md }]}>
          <TouchableOpacity
            onPress={handleNext}
            disabled={!localUri}
            style={[styles.nextButton, !localUri && styles.nextButtonDisabled]}
            activeOpacity={0.8}
          >
            <Text variant="label" color={Colors.neutral.white} weight="600">
              {t('auth.register.photo.next')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} hitSlop={8} style={styles.skipButton}>
            <Text variant="body" color={Colors.neutral.secondary}>
              {t('auth.register.photo.skip')}
            </Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>

      {/* ── Bottom Sheet (fora do SafeAreaView, ocupa tela toda) ── */}
      {sheetOpen && (
        <>
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
              { paddingBottom: bottomInset + Spacing.md },
              { transform: [{ translateY: sheetY }] },
            ]}
          >
            <View style={styles.handle} />

            <Text variant="h3" color={Colors.neutral.primary} style={styles.sheetTitle}>
              Adicionar foto
            </Text>

            <View style={styles.optionsRow}>
              {/* Câmera */}
              <TouchableOpacity style={styles.optionCard} onPress={pickFromCamera} activeOpacity={0.7}>
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

              {/* Galeria */}
              <TouchableOpacity style={styles.optionCard} onPress={pickFromGallery} activeOpacity={0.7}>
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

            <TouchableOpacity onPress={() => closeSheet()} style={styles.cancelButton} activeOpacity={0.7}>
              <Text variant="label" color={Colors.neutral.secondary} weight="500">
                Cancelar
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </View>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  safe: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
  },

  // Conteúdo
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    marginBottom: Spacing.xxl,
  },

  // Avatar
  avatarArea: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    position: 'relative',
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: Colors.neutral.surface,
    borderWidth: 2,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  addButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: Colors.neutral.white,
    ...Shadows.sm,
  },
  addButtonText: {
    color: Colors.neutral.white,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '600',
  },
  removeLink: {
    marginTop: -Spacing.xs,
  },

  // Rodapé
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  nextButton: {
    backgroundColor: Colors.brand.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    alignItems: 'center',
    ...Shadows.sm,
  },
  nextButtonDisabled: {
    opacity: 0.35,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },

  // Bottom Sheet
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
  sheetTitle: {
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
