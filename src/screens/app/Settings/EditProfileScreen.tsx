import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import Svg, { Path } from 'react-native-svg'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'

import { ProfilePictureSelector } from '../../../components/ProfilePictureSelector'
import { ScreenTransition } from '../../../components/ScreenTransition'
import { ChevronRightIcon, PersonIcon, Text } from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import type { AppStackParamList } from '../../../navigation/types'

type Props = NativeStackScreenProps<AppStackParamList, 'EditProfile'>

const AVATAR_SIZE = 130

function BackIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={Colors.neutral.primary} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  )
}

export function EditProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [selectorVisible, setSelectorVisible] = useState(false)
  const [userId, setUserId] = useState('')

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data } = await supabase
      .from('profiles')
      .select('name, username, avatar_url')
      .eq('id', user.id)
      .single()

    if (data) {
      setName(data.name ?? '')
      setUsername(data.username ?? '')
      setAvatarUrl(data.avatar_url ?? null)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Recarrega nome e username ao voltar das telas de alteração
  useFocusEffect(
    useCallback(() => {
      if (!loading) load()
    }, [loading])
  )

  async function uploadPhoto(uri: string) {
    setUploadingPhoto(true)
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as FileSystem.EncodingType,
      })
      const arrayBuffer = decode(base64)
      const ext = uri.split('.').pop()?.split('?')[0] ?? 'jpg'
      const path = `${userId}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuffer, { contentType: `image/${ext}`, upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      const urlWithBust = `${publicUrl}?t=${Date.now()}`

      await supabase
        .from('profiles')
        .update({ avatar_url: urlWithBust })
        .eq('id', userId)

      setAvatarUrl(urlWithBust)
    } catch (e: any) {
      Alert.alert('Erro ao enviar foto', e.message)
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handlePickGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para alterar sua foto.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    })
    if (!result.canceled) await uploadPhoto(result.assets[0].uri)
  }

  async function handlePickCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar uma foto.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    })
    if (!result.canceled) await uploadPhoto(result.assets[0].uri)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.brand.primary} />
      </SafeAreaView>
    )
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenTransition>
          {/* ── Barra de navegação ── */}
          <View style={styles.navbar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
              <BackIcon />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Hero com avatar ── */}
            <View style={styles.hero}>
              <TouchableOpacity
                style={styles.avatarWrap}
                onPress={() => setSelectorVisible(true)}
                activeOpacity={0.8}
                disabled={uploadingPhoto}
              >
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <PersonIcon size={52} color={Colors.neutral.placeholder} />
                  </View>
                )}
                {uploadingPhoto && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color={Colors.neutral.white} />
                  </View>
                )}
              </TouchableOpacity>

              <Text variant="caption" color={Colors.brand.primary} weight="500" style={styles.changePhotoLabel}>
                {uploadingPhoto ? 'Enviando...' : 'Alterar foto'}
              </Text>
            </View>

            {/* ── Lista de informações ── */}
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => navigation.navigate('ChangeName')}
                activeOpacity={0.6}
              >
                <Text variant="label" color={Colors.neutral.secondary} style={styles.rowLabel}>
                  Nome
                </Text>
                <View style={styles.rowRight}>
                  <Text variant="label" color={Colors.neutral.primary} weight="500" numberOfLines={1}>
                    {name}
                  </Text>
                  <ChevronRightIcon size={16} color={Colors.neutral.placeholder} />
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.row}
                onPress={() => navigation.navigate('ChangeUsername')}
                activeOpacity={0.6}
              >
                <Text variant="label" color={Colors.neutral.secondary} style={styles.rowLabel}>
                  Username
                </Text>
                <View style={styles.rowRight}>
                  <Text variant="label" color={Colors.neutral.primary} weight="500" numberOfLines={1}>
                    @{username}
                  </Text>
                  <ChevronRightIcon size={16} color={Colors.neutral.placeholder} />
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </ScreenTransition>
      </SafeAreaView>

      {/* Fora do SafeAreaView — absoluteFill cobre a tela inteira incluindo status bar */}
      <ProfilePictureSelector
        visible={selectorVisible}
        onClose={() => setSelectorVisible(false)}
        onPickCamera={handlePickCamera}
        onPickGallery={handlePickGallery}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  safe: {
    flex: 1,
  },
  navbar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoLabel: {
    marginTop: 2,
  },

  // Card com lista
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
  },
  rowLabel: {
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 2,
    justifyContent: 'flex-end',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.neutral.border,
    marginLeft: Spacing.lg,
  },
})
