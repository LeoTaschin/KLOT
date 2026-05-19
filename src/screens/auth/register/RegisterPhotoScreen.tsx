import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'

import { ProfilePictureSelector } from '../../../components/ProfilePictureSelector'
import { KlotLogo } from '../../../components/KlotLogo'
import { PersonIcon, Text } from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import { useRegisterStore } from '../../../store/useRegisterStore'
import type { AuthScreenProps } from '../../../navigation/types'

const AVATAR_SIZE = 140

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function RegisterPhotoScreen({ navigation }: AuthScreenProps<'RegisterPhoto'>) {
  const { t } = useTranslation()
  const { bottom: bottomInset } = useSafeAreaInsets()
  const { setPhotoUri } = useRegisterStore()

  const [localUri, setLocalUri] = useState<string | null>(null)
  const [selectorVisible, setSelectorVisible] = useState(false)

  // ── Handlers de foto ─────────────────────────────────────────────

  const pickFromGallery = async () => {
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
  }

  const pickFromCamera = async () => {
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
            <TouchableOpacity onPress={() => setSelectorVisible(true)} activeOpacity={0.8}>
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

      <ProfilePictureSelector
        visible={selectorVisible}
        onClose={() => setSelectorVisible(false)}
        onPickCamera={pickFromCamera}
        onPickGallery={pickFromGallery}
      />
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

})
