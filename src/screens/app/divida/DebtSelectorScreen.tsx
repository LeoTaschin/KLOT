import React, { useCallback, useRef, useState } from 'react'
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenTransition } from '../../../components/ScreenTransition'
import { GruposIcon, PersonIcon, Text } from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import type { DebtStackParamList } from '../../../navigation/types'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

type Props = NativeStackScreenProps<DebtStackParamList, 'DebtSelector'>

type Tab = 'amigos' | 'grupos'

interface FriendOption {
  id: string
  name: string
  username: string
  avatar_url: string | null
}

interface GroupOption {
  id: string
  name: string
  avatar_url: string | null
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function DebtSelectorScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('amigos')
  const slideAnim = useRef(new Animated.Value(0)).current

  const [friends, setFriends] = useState<FriendOption[]>([])
  const [groups, setGroups] = useState<GroupOption[]>([])
  const [loading, setLoading] = useState(false)

  useFocusEffect(
    useCallback(() => {
      async function fetchData() {
        setLoading(true)
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          const [friendsAsReq, friendsAsAddr, groupsRes] = await Promise.all([
            supabase
              .from('friendships')
              .select('profiles!addressee_id(id, name, username, avatar_url)')
              .eq('requester_id', user.id)
              .eq('status', 'accepted'),

            supabase
              .from('friendships')
              .select('profiles!requester_id(id, name, username, avatar_url)')
              .eq('addressee_id', user.id)
              .eq('status', 'accepted'),

            supabase
              .from('group_members')
              .select('groups(id, name, avatar_url)')
              .eq('user_id', user.id),
          ])

          const seen = new Set<string>()
          const merged: FriendOption[] = []
          for (const r of [
            ...(friendsAsReq.data ?? []).map((r: any) => r.profiles),
            ...(friendsAsAddr.data ?? []).map((r: any) => r.profiles),
          ]) {
            if (r && !seen.has(r.id)) { seen.add(r.id); merged.push(r) }
          }
          setFriends(merged)

          const fetchedGroups: GroupOption[] = (groupsRes.data ?? [])
            .map((r: any) => r.groups)
            .filter(Boolean)
          setGroups(fetchedGroups)
        } finally {
          setLoading(false)
        }
      }
      fetchData()
    }, [])
  )

  const switchTab = (tab: Tab) => {
    setActiveTab(tab)
    Animated.spring(slideAnim, {
      toValue: tab === 'amigos' ? 0 : 1,
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
    }).start()
  }

  const handleSelectFriend = (friend: FriendOption) => {
    navigation.navigate('DebtValue', {
      type: 'friend',
      targetId: friend.id,
      targetName: friend.name,
      avatarUrl: friend.avatar_url,
    })
  }

  const handleSelectGroup = (group: GroupOption) => {
    navigation.navigate('DebtValue', {
      type: 'group',
      targetId: group.id,
      targetName: group.name,
      avatarUrl: group.avatar_url,
    })
  }

  const isAmigos = activeTab === 'amigos'

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>
      <View style={styles.container}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
            <Text variant="body" color={Colors.brand.primary}>← Voltar</Text>
          </TouchableOpacity>
          <Text variant="h2" color={Colors.neutral.primary} weight="700">
            Nova dívida
          </Text>
          <Text variant="body" color={Colors.neutral.secondary} style={styles.subtitle}>
            Com quem você quer dividir?
          </Text>
        </View>

        {/* ── Seletor ── */}
        <View style={styles.selector}>
          <Animated.View
            style={[
              styles.selectorPill,
              {
                left: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['2%', '50%'],
                }),
              },
            ]}
          />
          <TouchableOpacity
            style={styles.selectorItem}
            onPress={() => switchTab('amigos')}
            activeOpacity={0.8}
          >
            <PersonIcon size={18} color={isAmigos ? Colors.brand.primary : Colors.neutral.placeholder} />
            <Text
              variant="label"
              color={isAmigos ? Colors.brand.primary : Colors.neutral.placeholder}
              weight={isAmigos ? '600' : '400'}
            >
              Amigos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.selectorItem}
            onPress={() => switchTab('grupos')}
            activeOpacity={0.8}
          >
            <GruposIcon size={18} color={!isAmigos ? Colors.brand.primary : Colors.neutral.placeholder} />
            <Text
              variant="label"
              color={!isAmigos ? Colors.brand.primary : Colors.neutral.placeholder}
              weight={!isAmigos ? '600' : '400'}
            >
              Grupos
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Lista ── */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {isAmigos ? (
            friends.length === 0 ? (
              <EmptyState
                loading={loading}
                text="Nenhum amigo adicionado ainda"
              />
            ) : (
              friends.map((f) => (
                <OptionRow
                  key={f.id}
                  name={f.name}
                  subtitle={`@${f.username}`}
                  avatarUrl={f.avatar_url}
                  onPress={() => handleSelectFriend(f)}
                  Icon={PersonIcon}
                />
              ))
            )
          ) : (
            groups.length === 0 ? (
              <EmptyState
                loading={loading}
                text="Nenhum grupo criado ainda"
              />
            ) : (
              groups.map((g) => (
                <OptionRow
                  key={g.id}
                  name={g.name}
                  avatarUrl={g.avatar_url}
                  onPress={() => handleSelectGroup(g)}
                  Icon={GruposIcon}
                />
              ))
            )
          )}
        </ScrollView>

      </View>
      </ScreenTransition>
    </SafeAreaView>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ═══════════════════════════════════════════════════════════════════

const AVATAR_SIZE = 46

function OptionRow({
  name,
  subtitle,
  avatarUrl,
  onPress,
  Icon,
}: {
  name: string
  subtitle?: string
  avatarUrl: string | null
  onPress: () => void
  Icon: React.FC<{ size?: number; color?: string }>
}) {
  return (
    <TouchableOpacity style={rowStyles.row} onPress={onPress} activeOpacity={0.7}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={rowStyles.avatar} />
      ) : (
        <View style={rowStyles.avatarFallback}>
          <Icon size={20} color={Colors.neutral.placeholder} />
        </View>
      )}
      <View style={rowStyles.info}>
        <Text variant="label" color={Colors.neutral.primary} weight="600">
          {name}
        </Text>
        {subtitle && (
          <Text variant="caption" color={Colors.neutral.secondary}>
            {subtitle}
          </Text>
        )}
      </View>
      <Text variant="caption" color={Colors.neutral.placeholder}>›</Text>
    </TouchableOpacity>
  )
}

function EmptyState({ loading, text }: { loading: boolean; text: string }) {
  return (
    <View style={rowStyles.empty}>
      <Text variant="body" color={Colors.neutral.placeholder}>
        {loading ? 'Carregando...' : text}
      </Text>
    </View>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginTop: 2,
  },
  selector: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.full,
    padding: 4,
    position: 'relative',
    height: 48,
  },
  selectorPill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '48%',
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.full,
    ...Shadows.sm,
  },
  selectorItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    zIndex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
})

const rowStyles = StyleSheet.create({
  row: {
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
  info: {
    flex: 1,
    gap: 2,
  },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.lg * 3,
  },
})
