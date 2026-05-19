import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Polyline } from 'react-native-svg'

import { PersonIcon, Text } from '../ui'
import { Colors, Radius, Shadows, Spacing } from '../../constants/theme'
import { supabase } from '../../lib/supabase'
import { notifyUser } from '../../lib/notifications'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

interface FriendOption {
  id: string
  name: string
  username: string
  avatar_url: string | null
}

interface Props {
  visible: boolean
  groupId: string
  groupName: string
  existingMemberIds: string[]
  currentUserId: string
  onClose: () => void
  onMembersAdded: () => void
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.78)

// ═══════════════════════════════════════════════════════════════════
// ÍCONES
// ═══════════════════════════════════════════════════════════════════

function CheckIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Polyline
        points="20 6 9 17 4 12"
        stroke={Colors.neutral.white}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function GroupAddMember({
  visible,
  groupId,
  groupName,
  existingMemberIds,
  currentUserId,
  onClose,
  onMembersAdded,
}: Props) {
  const insets = useSafeAreaInsets()

  const [friends, setFriends] = useState<FriendOption[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  // ── Animação ────────────────────────────────────────────────────

  useEffect(() => {
    if (visible) {
      translateY.setValue(SHEET_HEIGHT)
      backdropOpacity.setValue(0)
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 340,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
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
      setSelected(new Set())
      onClose()
      callback?.()
    })
  }

  // ── Buscar amigos ────────────────────────────────────────────────

  const fetchFriends = useCallback(async () => {
    setLoading(true)
    try {
      const [asRequester, asAddressee] = await Promise.all([
        supabase
          .from('friendships')
          .select('profiles!addressee_id(id, name, username, avatar_url)')
          .eq('requester_id', currentUserId)
          .eq('status', 'accepted'),

        supabase
          .from('friendships')
          .select('profiles!requester_id(id, name, username, avatar_url)')
          .eq('addressee_id', currentUserId)
          .eq('status', 'accepted'),
      ])

      const all: FriendOption[] = [
        ...(asRequester.data ?? []).map((r: any) => r.profiles),
        ...(asAddressee.data ?? []).map((r: any) => r.profiles),
      ]
        .filter((p) => p?.id && !existingMemberIds.includes(p.id))
        .map((p) => ({
          id: p.id,
          name: p.name,
          username: p.username,
          avatar_url: p.avatar_url ?? null,
        }))

      setFriends(all)
    } finally {
      setLoading(false)
    }
  }, [currentUserId, existingMemberIds])

  useEffect(() => {
    if (visible) fetchFriends()
  }, [visible, fetchFriends])

  // ── Selecionar ───────────────────────────────────────────────────

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Confirmar ────────────────────────────────────────────────────

  async function handleConfirm() {
    if (selected.size === 0 || saving) return
    setSaving(true)
    try {
      const newMemberIds = Array.from(selected)

      const { error } = await supabase.from('group_members').insert(
        newMemberIds.map((userId) => ({ group_id: groupId, user_id: userId }))
      )

      if (error) {
        Alert.alert('Erro ao adicionar', error.message)
        return
      }

      newMemberIds.forEach((userId) => {
        notifyUser(userId, `Você entrou em "${groupName}"`, 'Você foi adicionado a um grupo.')
      })

      const existingToNotify = existingMemberIds.filter((id) => id !== currentUserId)
      existingToNotify.forEach((userId) => {
        notifyUser(userId, `Novo membro em "${groupName}"`, 'Um novo membro entrou no grupo.')
      })

      close(onMembersAdded)
    } finally {
      setSaving(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => close()}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + Spacing.md, transform: [{ translateY }] },
        ]}
      >
        <View style={styles.handle} />

        {/* Cabeçalho */}
        <View style={styles.sheetHeader}>
          <View>
            <Text variant="h3" color={Colors.neutral.primary} weight="700">
              Adicionar membro
            </Text>
            <Text variant="caption" color={Colors.neutral.secondary}>
              {groupName}
            </Text>
          </View>
          {selected.size > 0 && (
            <View style={styles.selectedBadge}>
              <Text variant="caption" color={Colors.brand.primary} weight="700">
                {selected.size} selecionado{selected.size > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Lista */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={Colors.brand.primary} />
          </View>
        ) : friends.length === 0 ? (
          <View style={styles.centered}>
            <Text variant="body" color={Colors.neutral.placeholder}>
              Todos os seus amigos já estão no grupo
            </Text>
          </View>
        ) : (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = selected.has(item.id)
              return (
                <TouchableOpacity
                  style={[styles.friendRow, isSelected && styles.friendRowSelected]}
                  onPress={() => toggleSelect(item.id)}
                  activeOpacity={0.7}
                >
                  {item.avatar_url ? (
                    <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <PersonIcon size={20} color={Colors.neutral.placeholder} />
                    </View>
                  )}

                  <View style={styles.friendInfo}>
                    <Text variant="label" color={Colors.neutral.primary} weight="600" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text variant="caption" color={Colors.neutral.secondary} numberOfLines={1}>
                      @{item.username}
                    </Text>
                  </View>

                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <CheckIcon />}
                  </View>
                </TouchableOpacity>
              )
            }}
          />
        )}

        {/* Botão de confirmar */}
        <TouchableOpacity
          style={[styles.confirmBtn, (selected.size === 0 || saving) && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          activeOpacity={0.8}
          disabled={selected.size === 0 || saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.neutral.white} size="small" />
          ) : (
            <Text variant="label" color={Colors.neutral.white} weight="700">
              Adicionar{selected.size > 0 ? ` (${selected.size})` : ''}
            </Text>
          )}
        </TouchableOpacity>
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
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  selectedBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.xlight,
    borderWidth: 1,
    borderColor: Colors.brand.light,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing.xl,
  },

  // Lista
  list: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.neutral.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    ...Shadows.sm,
  },
  friendRowSelected: {},
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendInfo: {
    flex: 1,
    gap: 2,
  },

  // Checkbox
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    backgroundColor: Colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxSelected: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },

  // Botão confirmar
  confirmBtn: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    shadowColor: Colors.brand.primary,
    shadowOpacity: 0.3,
  },
  confirmBtnDisabled: {
    backgroundColor: Colors.neutral.border,
    shadowOpacity: 0,
    elevation: 0,
  },
})
