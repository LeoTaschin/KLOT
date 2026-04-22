import React, { useCallback, useEffect, useRef, useState } from 'react'
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import Svg, { Circle, Path } from 'react-native-svg'

import { ScreenTransition } from '../../../components/ScreenTransition'
import { PersonIcon, Text } from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import type { GroupStackParamList } from '../../../navigation/types'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

type Props = NativeStackScreenProps<GroupStackParamList, 'CreateGroupMembers'>

interface Friend {
  id: string
  name: string
  username: string
  avatar_url: string | null
}

const AVATAR_SIZE = 46

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function CreateGroupMembersScreen({ navigation, route }: Props) {
  const { name, category } = route.params

  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')

  useFocusEffect(
    useCallback(() => {
      async function fetchFriends() {
        setLoading(true)
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          const [asReq, asAddr] = await Promise.all([
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

          const seen = new Set<string>()
          const merged: Friend[] = []
          for (const r of [
            ...(asReq.data ?? []).map((r: any) => r.profiles),
            ...(asAddr.data ?? []).map((r: any) => r.profiles),
          ]) {
            if (r && !seen.has(r.id)) { seen.add(r.id); merged.push(r) }
          }
          setFriends(merged)
        } finally {
          setLoading(false)
        }
      }
      fetchFriends()
    }, [])
  )

  const toggleFriend = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Fade-in do badge toda vez que o count muda de 0 para >0
  const badgeOpacity = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (selectedIds.size > 0) {
      badgeOpacity.setValue(0)
      Animated.timing(badgeOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start()
    }
  }, [selectedIds.size])

  const filtered = query.trim().length > 0
    ? friends.filter((f) =>
        f.name.toLowerCase().includes(query.toLowerCase()) ||
        f.username.toLowerCase().includes(query.toLowerCase())
      )
    : friends

  const canContinue = selectedIds.size > 0

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>
        <View style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Header ── */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
                <Text variant="body" color={Colors.brand.primary}>← Voltar</Text>
              </TouchableOpacity>
              <View style={styles.headerMeta}>
                <Text variant="h2" color={Colors.neutral.primary} weight="700">
                  {name}
                </Text>
                <View style={styles.categoryTag}>
                  <Text variant="caption" color={Colors.neutral.secondary} weight="500">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </View>
              </View>
              <Text variant="body" color={Colors.neutral.secondary}>
                Quem vai participar do grupo?
              </Text>
            </View>

            {/* ── Busca ── */}
            <View style={styles.searchWrap}>
              <SearchIcon />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar amigos..."
                placeholderTextColor={Colors.neutral.placeholder}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
            </View>

            {/* ── Contador ── */}
            {selectedIds.size > 0 && (
              <Animated.View style={[styles.countBadge, { opacity: badgeOpacity }]}>
                <Text variant="caption" color={Colors.brand.primary} weight="600">
                  {selectedIds.size} {selectedIds.size === 1 ? 'pessoa selecionada' : 'pessoas selecionadas'}
                </Text>
              </Animated.View>
            )}

            {/* ── Lista de amigos ── */}
            <View style={styles.list}>
              {loading ? (
                <View style={styles.empty}>
                  <Text variant="body" color={Colors.neutral.placeholder}>Carregando...</Text>
                </View>
              ) : friends.length === 0 ? (
                <View style={styles.empty}>
                  <Text variant="body" color={Colors.neutral.placeholder}>
                    Você ainda não tem amigos adicionados
                  </Text>
                </View>
              ) : filtered.length === 0 ? (
                <View style={styles.empty}>
                  <Text variant="body" color={Colors.neutral.placeholder}>
                    Nenhum amigo encontrado
                  </Text>
                </View>
              ) : (
                filtered.map((f) => {
                  const checked = selectedIds.has(f.id)
                  return (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.row, checked && styles.rowChecked]}
                      onPress={() => toggleFriend(f.id)}
                      activeOpacity={0.7}
                    >
                      {f.avatar_url ? (
                        <Image source={{ uri: f.avatar_url }} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarFallback}>
                          <PersonIcon size={20} color={Colors.neutral.placeholder} />
                        </View>
                      )}
                      <View style={styles.info}>
                        <Text variant="label" color={Colors.neutral.primary} weight="600">
                          {f.name}
                        </Text>
                        <Text variant="caption" color={Colors.neutral.secondary}>
                          @{f.username}
                        </Text>
                      </View>
                      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                        {checked && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  )
                })
              )}
            </View>
          </ScrollView>

          {/* ── Rodapé fixo ── */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
              onPress={() => {
                if (!canContinue) return
                navigation.navigate('CreateGroupReview', {
                  name,
                  category,
                  memberIds: Array.from(selectedIds),
                })
              }}
              activeOpacity={canContinue ? 0.8 : 1}
            >
              <Text variant="label" color={Colors.neutral.white} weight="700">
                Continuar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenTransition>
    </SafeAreaView>
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
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
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 46,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.surface,
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.neutral.primary,
    padding: 0,
  },
  countBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.xlight,
    borderWidth: 1,
    borderColor: Colors.brand.light,
  },
  list: {
    gap: Spacing.sm,
  },
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
  rowChecked: {
    backgroundColor: Colors.brand.xlight,
    borderColor: Colors.brand.light,
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
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  checkmark: {
    color: Colors.neutral.white,
    fontSize: 13,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
  },
  continueBtn: {
    height: 54,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    shadowColor: Colors.brand.primary,
    shadowOpacity: 0.3,
  },
  continueBtnDisabled: {
    backgroundColor: Colors.neutral.border,
    shadowOpacity: 0,
    elevation: 0,
  },
})
