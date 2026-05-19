import React from 'react'
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'

import { ChevronRightIcon, PersonIcon, Text } from './ui'
import { Colors, Radius, Shadows, Spacing } from '../constants/theme'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

export interface FriendItem {
  id: string
  name: string
  avatarUrl?: string | null
  // Linha de status — use `parts` para colorir trechos diferentes
  statusParts: StatusPart[]
}

export interface StatusPart {
  text: string
  color?: string // default: Colors.neutral.secondary
}

interface FriendShortcutItemProps {
  item: FriendItem
  onPress?: () => void
}

interface FriendShortcutProps {
  friends: FriendItem[]
  onViewAll?: () => void
  onPressFriend?: (item: FriendItem) => void
}

// ═══════════════════════════════════════════════════════════════════
// ITEM
// ═══════════════════════════════════════════════════════════════════

export function FriendShortcutItem({ item, onPress }: FriendShortcutItemProps) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>

      {/* Avatar */}
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <PersonIcon size={22} color={Colors.neutral.placeholder} />
        </View>
      )}

      {/* Texto */}
      <View style={styles.textWrap}>
        <Text variant="label" color={Colors.neutral.primary} weight="600">
          {item.name}
        </Text>
        <View style={styles.statusRow}>
          {item.statusParts.map((part, i) => (
            <Text
              key={i}
              variant="caption"
              color={part.color ?? Colors.neutral.secondary}
            >
              {part.text}
            </Text>
          ))}
        </View>
      </View>

      {/* Chevron */}
      <View style={styles.chevronWrap}>
        <ChevronRightIcon size={14} color={Colors.neutral.secondary} />
      </View>

    </TouchableOpacity>
  )
}

// ═══════════════════════════════════════════════════════════════════
// LISTA
// ═══════════════════════════════════════════════════════════════════

export function FriendShortcut({ friends, onViewAll, onPressFriend }: FriendShortcutProps) {
  return (
    <View style={styles.wrapper}>

      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text variant="label" color={Colors.neutral.primary} weight="700">
          Seus amigos
        </Text>
        <TouchableOpacity onPress={onViewAll} hitSlop={8}>
          <Text variant="label" color={Colors.brand.primary} weight="600">
            Ver todos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Itens ou empty state */}
      {friends.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="body" color={Colors.neutral.placeholder} style={styles.emptyText}>
            Você ainda não tem amigos adicionados
          </Text>
          <Text variant="caption" color={Colors.neutral.placeholder}>
            Adicione amigos para dividir despesas
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {friends.map((friend, index) => (
            <React.Fragment key={friend.id}>
              <FriendShortcutItem
                item={friend}
                onPress={() => onPressFriend?.(friend)}
              />
              {index < friends.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
      )}

    </View>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const AVATAR_SIZE = 46

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    gap: Spacing.sm,
    ...Shadows.sm,
  },

  // Cabeçalho
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xs,
  },

  // Lista
  list: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },

  // Item
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
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
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  chevronWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Divisor entre itens
  divider: {
    height: 1,
    backgroundColor: Colors.neutral.border,
    marginLeft: AVATAR_SIZE + Spacing.md * 2,
  },

  // Empty state
  empty: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
  },
})
