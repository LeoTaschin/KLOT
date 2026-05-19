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
import Svg, { Path } from 'react-native-svg'

import { Text } from '../ui'
import { Colors, Radius, Shadows, Spacing } from '../../constants/theme'

interface Props {
  visible: boolean
  friendName: string
  userAvatarUrl: string | null
  friendAvatarUrl: string | null
  onConfirm: () => void
  onClose: () => void
}

const SHEET_HEIGHT = 320
const AVATAR_SIZE = 64

function ArrowIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M13 6l6 6-6 6"
        stroke={Colors.brand.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function AvatarCircle({ uri, name }: { uri: string | null; name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  if (uri) {
    return <Image source={{ uri }} style={styles.avatar} />
  }
  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarInitials}>{initials}</Text>
    </View>
  )
}

export function PaymentPixConfirm({
  visible,
  friendName,
  userAvatarUrl,
  friendAvatarUrl,
  onConfirm,
  onClose,
}: Props) {
  const firstName = friendName.split(' ')[0]
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => close()}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />

        {/* ── Avatares + seta ── */}
        <View style={styles.transferRow}>
          <View style={styles.avatarGroup}>
            <AvatarCircle uri={userAvatarUrl} name="Eu" />
            <Text variant="caption" color={Colors.neutral.secondary} style={styles.avatarLabel}>
              Você
            </Text>
          </View>

          <View style={styles.arrowWrap}>
            <ArrowIcon />
          </View>

          <View style={styles.avatarGroup}>
            <AvatarCircle uri={friendAvatarUrl} name={friendName} />
            <Text variant="caption" color={Colors.neutral.secondary} style={styles.avatarLabel}>
              {firstName}
            </Text>
          </View>
        </View>

        {/* ── Pergunta ── */}
        <Text variant="body" color={Colors.neutral.secondary} style={styles.question}>
          Você realizou este pagamento?
        </Text>

        {/* ── Ações ── */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnCancel} onPress={() => close()} activeOpacity={0.7}>
            <Text variant="label" color={Colors.neutral.secondary} weight="600">
              Ainda não
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnConfirm}
            onPress={() => close(onConfirm)}
            activeOpacity={0.7}
          >
            <Text variant="label" color={Colors.neutral.white} weight="700">
              Sim, paguei
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  )
}

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
    marginBottom: Spacing.xl,
  },

  // Transferência
  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  avatarGroup: {
    alignItems: 'center',
    gap: Spacing.xs,
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
    backgroundColor: Colors.brand.xlight,
    borderWidth: 1.5,
    borderColor: Colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  avatarLabel: {
    marginTop: 2,
  },
  arrowWrap: {
    alignItems: 'center',
  },

  question: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },

  // Botões
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btnCancel: {
    flex: 1,
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral.white,
  },
  btnConfirm: {
    flex: 1,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brand.primary,
    ...Shadows.sm,
  },
})
