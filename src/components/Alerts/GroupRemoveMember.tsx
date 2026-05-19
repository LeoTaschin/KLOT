import React, { useEffect, useRef } from 'react'
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'

import { type GroupMemberData } from '../GroupMemberItem'
import { PersonIcon, Text } from '../ui'
import { Colors, Radius, Shadows, Spacing } from '../../constants/theme'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

interface Props {
  member: GroupMemberData | null
  onConfirm: (member: GroupMemberData) => void
  onClose: () => void
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════

const SHEET_HEIGHT = 300

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function GroupRemoveMember({ member, onConfirm, onClose }: Props) {
  const visible = member !== null

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

  function close(callback?: () => void) {
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

  function handleConfirm() {
    if (!member) return
    close(() => onConfirm(member))
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => close()}
      statusBarTranslucent
    >
      {/* ── Backdrop ── */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} />
      </Animated.View>

      {/* ── Sheet ── */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />

        <Text variant="h3" color={Colors.neutral.primary} weight="700" style={styles.title}>
          Remover membro
        </Text>

        {/* ── Card do membro ── */}
        {member && (
          <View style={styles.memberCard}>
            {member.avatar_url ? (
              <Image source={{ uri: member.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <PersonIcon size={20} color={Colors.neutral.placeholder} />
              </View>
            )}
            <View style={styles.memberInfo}>
              <Text variant="label" color={Colors.neutral.primary} weight="600" numberOfLines={1}>
                {member.name}
              </Text>
              <Text variant="caption" color={Colors.neutral.secondary} numberOfLines={1}>
                @{member.username}
              </Text>
            </View>
          </View>
        )}

        <Text variant="body" color={Colors.neutral.secondary} style={styles.description}>
          Essa pessoa perderá acesso ao grupo e às suas despesas.
        </Text>

        {/* ── Ações ── */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnCancel} onPress={() => close()} activeOpacity={0.7}>
            <Text variant="label" color={Colors.neutral.secondary} weight="600">
              Cancelar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnRemove} onPress={handleConfirm} activeOpacity={0.7}>
            <Text variant="label" color={Colors.neutral.white} weight="700">
              Remover
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const AVATAR_SIZE = 44

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
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

  // Membro
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },

  description: {
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },

  // Botões
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btnCancel: {
    flex: 1,
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral.white,
  },
  btnRemove: {
    flex: 1,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.status.debt,
  },
})
