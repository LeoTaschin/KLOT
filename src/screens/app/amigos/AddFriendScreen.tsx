import React, { useCallback, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import Svg, { Circle, Path } from 'react-native-svg'

import { PersonIcon, Text } from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import { notifyUser } from '../../../lib/notifications'
import { supabase } from '../../../lib/supabase'
import type { AppStackParamList } from '../../../navigation/types'

type Props = NativeStackScreenProps<AppStackParamList, 'AddFriend'>

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

type Section = 'buscar' | 'solicitacoes'

interface UserResult {
  id: string
  name: string
  username: string
  avatar_url: string | null
  alreadyFriend?: boolean
  requestSent?: boolean
}

interface FriendRequest {
  friendshipId: string
  requesterId: string
  user: {
    id: string
    name: string
    username: string
    avatar_url: string | null
  }
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function AddFriendScreen({ navigation }: Props) {
  const [activeSection, setActiveSection] = useState<Section>('buscar')
  const slideAnim = useRef(new Animated.Value(0)).current

  // Buscar
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState<string | null>(null)

  // Solicitações
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [acting, setActing] = useState<string | null>(null)

  const switchSection = (section: Section) => {
    setActiveSection(section)
    Animated.spring(slideAnim, {
      toValue: section === 'buscar' ? 0 : 1,
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
    }).start()
  }

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('friendships')
        .select('id, profiles!requester_id(id, name, username, avatar_url)')
        .eq('addressee_id', user.id)
        .eq('status', 'pending')

      if (!data) return

      const mapped: FriendRequest[] = data
        .filter((row: any) => row.profiles)
        .map((row: any) => ({
          friendshipId: row.id,
          requesterId: row.profiles.id,
          user: row.profiles,
        }))

      setRequests(mapped)
    } finally {
      setLoadingRequests(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchRequests()
    }, [fetchRequests])
  )

  const handleSearch = async (text: string) => {
    setQuery(text)
    if (text.trim().length < 2) { setResults([]); return }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profilesRes, existingRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, name, username, avatar_url')
          .or(`username.ilike.%${text}%,name.ilike.%${text}%`)
          .neq('id', user.id)
          .limit(10),

        supabase
          .from('friendships')
          .select('requester_id, addressee_id, status')
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
      ])

      const existing = existingRes.data ?? []

      const mapped: UserResult[] = (profilesRes.data ?? []).map((p) => {
        const rel = existing.find(
          (r) =>
            (r.requester_id === user.id && r.addressee_id === p.id) ||
            (r.addressee_id === user.id && r.requester_id === p.id)
        )
        return {
          ...p,
          alreadyFriend: rel?.status === 'accepted',
          requestSent: rel?.status === 'pending',
        }
      })

      setResults(mapped)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (target: UserResult) => {
    setSending(target.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Se existe registro 'declined' (em qualquer direção), reativa como 'pending'
      const { data: existing } = await supabase
        .from('friendships')
        .select('id')
        .or(
          `and(requester_id.eq.${user.id},addressee_id.eq.${target.id}),` +
          `and(requester_id.eq.${target.id},addressee_id.eq.${user.id})`
        )
        .eq('status', 'declined')
        .maybeSingle()

      if (existing) {
        await supabase
          .from('friendships')
          .update({ status: 'pending', requester_id: user.id, addressee_id: target.id })
          .eq('id', existing.id)
      } else {
        await supabase.from('friendships').insert({
          requester_id: user.id,
          addressee_id: target.id,
          status: 'pending',
        })
      }

      const { data: me } = await supabase.from('profiles').select('name').eq('id', user.id).single()
      notifyUser(target.id, 'Nova solicitação de amizade', `${me?.name ?? 'Alguém'} quer ser seu amigo no KLOT.`)

      setResults((prev) =>
        prev.map((r) => r.id === target.id ? { ...r, requestSent: true } : r)
      )
    } finally {
      setSending(null)
    }
  }

  const handleAccept = async (req: FriendRequest) => {
    setActing(req.friendshipId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', req.friendshipId)

      if (user) {
        const { data: me } = await supabase.from('profiles').select('name').eq('id', user.id).single()
        notifyUser(req.requesterId, 'Solicitação aceita!', `${me?.name ?? 'Seu amigo'} aceitou seu pedido de amizade.`)
      }

      setRequests((prev) => prev.filter((r) => r.friendshipId !== req.friendshipId))
    } finally {
      setActing(null)
    }
  }

  const handleDecline = async (req: FriendRequest) => {
    setActing(req.friendshipId)
    try {
      await supabase
        .from('friendships')
        .update({ status: 'declined' })
        .eq('id', req.friendshipId)

      setRequests((prev) => prev.filter((r) => r.friendshipId !== req.friendshipId))
    } finally {
      setActing(null)
    }
  }

  const isBuscar = activeSection === 'buscar'

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn} hitSlop={12}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M18 6L6 18M6 6L18 18" stroke={Colors.neutral.primary} strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
        <Text variant="h3" color={Colors.neutral.primary} weight="700">
          Amigos
        </Text>
        <View style={styles.closeBtn} />
      </View>

      {/* ── Selector ── */}
      <View style={styles.selectorWrap}>
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
            onPress={() => switchSection('buscar')}
            activeOpacity={0.8}
          >
            <Text
              variant="label"
              color={isBuscar ? Colors.brand.primary : Colors.neutral.placeholder}
              weight={isBuscar ? '600' : '400'}
            >
              Buscar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.selectorItem}
            onPress={() => switchSection('solicitacoes')}
            activeOpacity={0.8}
          >
            <Text
              variant="label"
              color={!isBuscar ? Colors.brand.primary : Colors.neutral.placeholder}
              weight={!isBuscar ? '600' : '400'}
            >
              Solicitações
              {requests.length > 0 && (
                <Text variant="label" color={Colors.brand.primary} weight="700">
                  {' '}({requests.length})
                </Text>
              )}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ══════════════════════════════════ */}
      {/* SEÇÃO: BUSCAR                      */}
      {/* ══════════════════════════════════ */}
      {isBuscar && (
        <>
          <View style={styles.searchWrap}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Circle cx="11" cy="11" r="8" stroke={Colors.neutral.placeholder} strokeWidth={1.8} />
              <Path d="M21 21L16.65 16.65" stroke={Colors.neutral.placeholder} strokeWidth={1.8} strokeLinecap="round" />
            </Svg>
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={handleSearch}
              placeholder="Busque por nome ou @username"
              placeholderTextColor={Colors.neutral.placeholder}
              autoFocus
              autoCorrect={false}
              autoCapitalize="none"
            />
            {loading && <ActivityIndicator size="small" color={Colors.brand.primary} />}
          </View>

          {results.length === 0 && query.length >= 2 && !loading ? (
            <View style={styles.empty}>
              <Text variant="body" color={Colors.neutral.placeholder}>
                Nenhum usuário encontrado
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
              {results.map((item) => (
                <View key={item.id} style={styles.item}>
                  <Avatar user={item} />
                  <View style={styles.info}>
                    <Text variant="label" color={Colors.neutral.primary} weight="600">
                      {item.name}
                    </Text>
                    <Text variant="caption" color={Colors.neutral.secondary}>
                      @{item.username}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      (item.requestSent || item.alreadyFriend) && styles.actionBtnSent,
                    ]}
                    onPress={() => !item.requestSent && !item.alreadyFriend && handleAdd(item)}
                    disabled={item.requestSent || item.alreadyFriend || sending === item.id}
                    activeOpacity={0.8}
                  >
                    {sending === item.id ? (
                      <ActivityIndicator size="small" color={Colors.neutral.white} />
                    ) : (
                      <Text variant="caption" color={Colors.neutral.white} weight="600">
                        {item.alreadyFriend ? 'Amigos' : item.requestSent ? 'Enviado' : 'Adicionar'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </>
      )}

      {/* ══════════════════════════════════ */}
      {/* SEÇÃO: SOLICITAÇÕES                */}
      {/* ══════════════════════════════════ */}
      {!isBuscar && (
        <>
          {loadingRequests ? (
            <View style={styles.empty}>
              <ActivityIndicator size="small" color={Colors.brand.primary} />
            </View>
          ) : requests.length === 0 ? (
            <View style={styles.empty}>
              <Text variant="body" color={Colors.neutral.placeholder}>
                Nenhuma solicitação pendente
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
              {requests.map((req) => (
                <View key={req.friendshipId} style={styles.item}>
                  <Avatar user={req.user} />
                  <View style={styles.info}>
                    <Text variant="label" color={Colors.neutral.primary} weight="600">
                      {req.user.name}
                    </Text>
                    <Text variant="caption" color={Colors.neutral.secondary}>
                      @{req.user.username}
                    </Text>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnDecline]}
                      onPress={() => acting !== req.friendshipId && handleDecline(req)}
                      disabled={acting === req.friendshipId}
                      activeOpacity={0.8}
                    >
                      {acting === req.friendshipId ? (
                        <ActivityIndicator size="small" color={Colors.neutral.placeholder} />
                      ) : (
                        <Text variant="caption" color={Colors.neutral.secondary} weight="600">
                          Recusar
                        </Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => acting !== req.friendshipId && handleAccept(req)}
                      disabled={acting === req.friendshipId}
                      activeOpacity={0.8}
                    >
                      {acting === req.friendshipId ? (
                        <ActivityIndicator size="small" color={Colors.neutral.white} />
                      ) : (
                        <Text variant="caption" color={Colors.neutral.white} weight="600">
                          Aceitar
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </>
      )}

    </SafeAreaView>
  )
}

// ── Avatar helper ──
function Avatar({ user }: { user: { avatar_url: string | null; name: string } }) {
  if (user.avatar_url) {
    return <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
  }
  return (
    <View style={styles.avatarFallback}>
      <PersonIcon size={20} color={Colors.neutral.placeholder} />
    </View>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const AVATAR_SIZE = 44

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Selector
  selectorWrap: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
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

  // Busca
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
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

  // Lista
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  item: {
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

  // Botões de ação
  requestActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionBtn: {
    backgroundColor: Colors.brand.primary,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    minWidth: 74,
    alignItems: 'center',
  },
  actionBtnSent: {
    backgroundColor: Colors.neutral.placeholder,
  },
  actionBtnDecline: {
    backgroundColor: Colors.neutral.surface,
  },

  // Vazio
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
