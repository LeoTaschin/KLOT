import React, { useCallback, useRef, useState } from 'react'
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import type { CompositeScreenProps } from '@react-navigation/native'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import Svg, { Circle, Path } from 'react-native-svg'

import { FriendItem, type FriendData } from '../../components/FriendItem'
import { ScreenTransition } from '../../components/ScreenTransition'
import {
  CasaIcon,
  ChevronRightIcon,
  ContasIcon,
  FestaIcon,
  GruposIcon,
  PersonIcon,
  Text,
  TrabalhoIcon,
  ViagemIcon,
} from '../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../constants/theme'
import { supabase } from '../../lib/supabase'
import type { AppStackParamList, TabParamList } from '../../navigation/types'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

type Tab = 'amigos' | 'grupos'

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Grupos'>,
  NativeStackScreenProps<AppStackParamList>
>


interface Group {
  id: string
  name: string
  avatar_url: string | null
  category: string
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function GruposScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('amigos')
  const slideAnim = useRef(new Animated.Value(0)).current

  const [pendingCount, setPendingCount] = useState(0)
  const [friends, setFriendDatas] = useState<FriendData[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')

  useFocusEffect(
    useCallback(() => {
      async function fetchData() {
        setLoading(true)
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          const [pendingRes, friendsAsReq, friendsAsAddr] = await Promise.all([
            supabase
              .from('friendships')
              .select('id', { count: 'exact', head: true })
              .eq('addressee_id', user.id)
              .eq('status', 'pending'),

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
          ])

          setPendingCount(pendingRes.count ?? 0)

          const { data: groupsData } = await supabase
            .from('group_members')
            .select('groups!inner(id, name, avatar_url, category)')
            .eq('user_id', user.id)

          setGroups(
            (groupsData ?? []).map((r: any) => r.groups).filter(Boolean)
          )

          const fromReq: FriendData[] = (friendsAsReq.data ?? [])
            .map((r: any) => r.profiles)
            .filter(Boolean)

          const fromAddr: FriendData[] = (friendsAsAddr.data ?? [])
            .map((r: any) => r.profiles)
            .filter(Boolean)

          const seen = new Set<string>()
          const merged: FriendData[] = []
          for (const f of [...fromReq, ...fromAddr]) {
            if (!seen.has(f.id)) { seen.add(f.id); merged.push(f) }
          }

          if (merged.length > 0) {
            const friendIds = merged.map((f) => f.id)

            // O que cada amigo me deve: splits deles em despesas que eu paguei
            const [theyOweRes, iOweRes] = await Promise.all([
              supabase
                .from('expense_splits')
                .select('user_id, amount, expenses!inner(payer_id)')
                .in('user_id', friendIds)
                .eq('paid', false)
                .eq('expenses.payer_id', user.id),

              supabase
                .from('expense_splits')
                .select('amount, expenses!inner(payer_id)')
                .eq('user_id', user.id)
                .eq('paid', false)
                .in('expenses.payer_id', friendIds),
            ])

            // Saldo por amigo: positivo = me devem, negativo = devo
            const balanceMap: Record<string, number> = {}

            for (const row of theyOweRes.data ?? []) {
              balanceMap[row.user_id] = (balanceMap[row.user_id] ?? 0) + Number(row.amount)
            }
            for (const row of iOweRes.data ?? []) {
              const payerId = (row as any).expenses?.payer_id
              if (payerId) {
                balanceMap[payerId] = (balanceMap[payerId] ?? 0) - Number(row.amount)
              }
            }

            const withBalance = merged.map((f) => ({
              ...f,
              balance: balanceMap[f.id] ?? 0,
            }))
            setFriendDatas(withBalance)
          } else {
            setFriendDatas(merged)
          }
        } finally {
          setLoading(false)
        }
      }
      fetchData()
    }, [])
  )

  const switchTab = (tab: Tab) => {
    setActiveTab(tab)
    setQuery('')
    Animated.spring(slideAnim, {
      toValue: tab === 'amigos' ? 0 : 1,
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
    }).start()
  }

  const isAmigos = activeTab === 'amigos'

  const filteredFriendDatas = query.trim().length > 0
    ? friends.filter((f) =>
        f.name.toLowerCase().includes(query.toLowerCase()) ||
        f.username.toLowerCase().includes(query.toLowerCase())
      )
    : friends

  const filteredGroups = query.trim().length > 0
    ? groups.filter((g) => g.name.toLowerCase().includes(query.toLowerCase()))
    : groups

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>
        <View style={styles.container}>

          {/* ── Título ── */}
          <View style={styles.header}>
            <Text variant="h1" color={Colors.neutral.primary} weight="800">
              Minha rede
            </Text>
            <Text variant="body" color={Colors.neutral.secondary} style={styles.subtitle}>
              Navegue entre seus amigos e dívidas
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

          {/* ── Busca + Adicionar ── */}
          <View style={styles.searchRow}>
            <View style={styles.searchWrap}>
              <SearchIcon />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder={isAmigos ? 'Procure por seus amigos' : 'Procure por seus grupos'}
                placeholderTextColor={Colors.neutral.placeholder}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={styles.addBtn}
              activeOpacity={0.8}
              onPress={() =>
                isAmigos
                  ? navigation.navigate('AddFriend')
                  : navigation.navigate('GroupFlow')
              }
            >
              <Text variant="h3" color={Colors.brand.primary} weight="400">
                +
              </Text>
              {isAmigos && pendingCount > 0 && (
                <View style={styles.badge} />
              )}
            </TouchableOpacity>
          </View>

          {/* ── Lista ── */}
          {isAmigos ? (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {!loading && filteredFriendDatas.length === 0 ? (
                <View style={styles.empty}>
                  <Text variant="body" color={Colors.neutral.placeholder}>
                    {query ? 'Nenhum amigo encontrado' : 'Você ainda não tem amigos'}
                  </Text>
                </View>
              ) : (
                filteredFriendDatas.map((friend) => (
                  <FriendItem
                    key={friend.id}
                    friend={friend}
                    onPress={(f) =>
                      navigation.navigate('FriendProfile', {
                        id: f.id,
                        name: f.name,
                        avatarUrl: f.avatar_url,
                      })
                    }
                  />
                ))
              )}
            </ScrollView>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {filteredGroups.length === 0 ? (
                <View style={styles.empty}>
                  <Text variant="body" color={Colors.neutral.placeholder}>
                    {query ? 'Nenhum grupo encontrado' : 'Você ainda não tem grupos'}
                  </Text>
                </View>
              ) : (
                filteredGroups.map((group) => (
                  <GroupItem
                    key={group.id}
                    group={group}
                    onPress={() => navigation.navigate('GroupDetails', {
                      id: group.id,
                      name: group.name,
                      category: group.category,
                      avatarUrl: group.avatar_url,
                    })}
                  />
                ))
              )}
            </ScrollView>
          )}

        </View>
      </ScreenTransition>
    </SafeAreaView>
  )
}

// ═══════════════════════════════════════════════════════════════════
// GROUP ITEM
// ═══════════════════════════════════════════════════════════════════

const CATEGORY_CONFIG: Record<string, { label: string; Icon: React.FC<{ size?: number; color?: string }> }> = {
  casa:     { label: 'Casa',     Icon: CasaIcon     },
  trabalho: { label: 'Trabalho', Icon: TrabalhoIcon },
  viagem:   { label: 'Viagem',   Icon: ViagemIcon   },
  festa:    { label: 'Festa',    Icon: FestaIcon    },
  amigos:   { label: 'Amigos',   Icon: GruposIcon   },
  outro:    { label: 'Outro',    Icon: ContasIcon   },
}

function GroupItem({ group, onPress }: { group: Group; onPress?: () => void }) {
  const config = CATEGORY_CONFIG[group.category] ?? CATEGORY_CONFIG.outro
  const { Icon, label } = config

  return (
    <TouchableOpacity style={itemStyles.row} activeOpacity={0.7} onPress={onPress}>
      {group.avatar_url ? (
        <Image source={{ uri: group.avatar_url }} style={itemStyles.avatar} />
      ) : (
        <View style={itemStyles.avatarFallback}>
          <Icon size={22} color={Colors.brand.primary} />
        </View>
      )}

      <View style={itemStyles.info}>
        <Text variant="label" color={Colors.neutral.primary} weight="600">
          {group.name}
        </Text>
        <View style={itemStyles.categoryBadge}>
          <Text variant="caption" color={Colors.neutral.secondary} weight="500">
            {label}
          </Text>
        </View>
      </View>

      <ChevronRightIcon size={16} color={Colors.neutral.placeholder} />
    </TouchableOpacity>
  )
}

// ── Ícone de lupa ──
function SearchIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={Colors.neutral.placeholder} strokeWidth={1.8} />
      <Path d="M21 21L16.65 16.65" stroke={Colors.neutral.placeholder} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const AVATAR_SIZE = 46

const itemStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.neutral.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
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
    borderRadius: Radius.lg,
    backgroundColor: Colors.brand.xlight,
    borderWidth: 1,
    borderColor: Colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
})

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

  // Header
  header: {
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginTop: 2,
  },

  // Seletor
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

  // Busca
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.neutral.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.neutral.primary,
    padding: 0,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.neutral.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: Colors.neutral.white,
  },

  // Lista
  list: {
    flex: 1,
  },
  listContent: {
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.lg * 3,
  },
})
