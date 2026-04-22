import React, { useCallback, useState } from 'react'
import {
  Alert,
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
import {
  CasaIcon,
  ContasIcon,
  FestaIcon,
  GruposIcon,
  PersonIcon,
  Text,
  TrabalhoIcon,
  ViagemIcon,
} from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'
import type { GroupStackParamList } from '../../../navigation/types'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

type Props = NativeStackScreenProps<GroupStackParamList, 'CreateGroupReview'>

interface MemberProfile {
  id: string
  name: string
  username: string
  avatar_url: string | null
  isAdmin?: boolean
}

const AVATAR_SIZE = 44

const CATEGORY_CONFIG: Record<string, { label: string; Icon: React.FC<{ size?: number; color?: string }> }> = {
  casa:     { label: 'Casa',     Icon: CasaIcon     },
  trabalho: { label: 'Trabalho', Icon: TrabalhoIcon },
  viagem:   { label: 'Viagem',   Icon: ViagemIcon   },
  festa:    { label: 'Festa',    Icon: FestaIcon    },
  amigos:   { label: 'Amigos',   Icon: GruposIcon   },
  outro:    { label: 'Outro',    Icon: ContasIcon   },
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function CreateGroupReviewScreen({ navigation, route }: Props) {
  const { name, category, memberIds } = route.params
  const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.outro
  const { Icon, label } = config

  const [members, setMembers] = useState<MemberProfile[]>([])
  const [saving, setSaving] = useState(false)

  useFocusEffect(
    useCallback(() => {
      async function fetchMembers() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const ids = memberIds.length > 0 ? memberIds : []

        const [selfRes, othersRes] = await Promise.all([
          supabase.from('profiles').select('id, name, username, avatar_url').eq('id', user.id).single(),
          ids.length > 0
            ? supabase.from('profiles').select('id, name, username, avatar_url').in('id', ids)
            : Promise.resolve({ data: [] }),
        ])

        const self: MemberProfile = selfRes.data
          ? { ...selfRes.data, isAdmin: true }
          : { id: user.id, name: 'Você', username: '', avatar_url: null, isAdmin: true }

        const others: MemberProfile[] = (othersRes.data ?? []).map((m: any) => ({
          ...m,
          isAdmin: false,
        }))

        setMembers([self, ...others])
      }
      fetchMembers()
    }, [memberIds])
  )

  const handleCreate = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.rpc('create_group', {
        p_name: name,
        p_category: category,
        p_member_ids: memberIds,
      })
      if (error) throw error
      Alert.alert('Grupo criado!', `"${name}" está pronto para usar.`, [
        { text: 'OK', onPress: () => navigation.getParent()?.goBack() },
      ])
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível criar o grupo.')
    } finally {
      setSaving(false)
    }
  }

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
              <Text variant="h2" color={Colors.neutral.primary} weight="700">
                Revisar grupo
              </Text>
              <Text variant="body" color={Colors.neutral.secondary}>
                Tudo certo antes de criar?
              </Text>
            </View>

            {/* ── Card de resumo ── */}
            <View style={styles.summaryCard}>
              <View style={styles.groupIcon}>
                <Icon size={34} color={Colors.brand.primary} />
              </View>
              <Text variant="h3" color={Colors.neutral.primary} weight="700">
                {name}
              </Text>
              <View style={styles.categoryBadge}>
                <Text variant="caption" color={Colors.brand.primary} weight="600">
                  {label}
                </Text>
              </View>
            </View>

            {/* ── Membros ── */}
            <View style={styles.section}>
              <Text variant="label" color={Colors.neutral.secondary} weight="600" style={styles.sectionLabel}>
                Membros ({members.length})
              </Text>
              <View style={styles.memberList}>
                {members.map((m) => (
                  <View key={m.id} style={[styles.memberRow, m.isAdmin && styles.memberRowAdmin]}>
                    {m.avatar_url ? (
                      <Image source={{ uri: m.avatar_url }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatarFallback, m.isAdmin && styles.avatarFallbackAdmin]}>
                        <PersonIcon size={18} color={m.isAdmin ? Colors.brand.primary : Colors.neutral.placeholder} />
                      </View>
                    )}
                    <View style={styles.memberInfo}>
                      <Text variant="label" color={Colors.neutral.primary} weight="600">
                        {m.name}
                      </Text>
                      {m.username ? (
                        <Text variant="caption" color={Colors.neutral.secondary}>
                          @{m.username}
                        </Text>
                      ) : null}
                    </View>
                    {m.isAdmin && (
                      <View style={styles.adminBadge}>
                        <Text variant="caption" color={Colors.brand.primary} weight="700">
                          ADM
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* ── Rodapé fixo ── */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.createBtn, saving && styles.createBtnDisabled]}
              onPress={handleCreate}
              activeOpacity={saving ? 1 : 0.8}
              disabled={saving}
            >
              <Text variant="label" color={Colors.neutral.white} weight="700">
                {saving ? 'Criando...' : 'Criar grupo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenTransition>
    </SafeAreaView>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  header: {
    gap: Spacing.xs,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },

  // Card de resumo
  summaryCard: {
    backgroundColor: Colors.brand.xlight,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.brand.light,
  },
  groupIcon: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1.5,
    borderColor: Colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    ...Shadows.sm,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.brand.light,
  },

  // Membros
  section: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    marginLeft: 2,
  },
  memberList: {
    gap: Spacing.sm,
  },
  memberRow: {
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
  memberRowAdmin: {
    backgroundColor: Colors.brand.xlight,
    borderColor: Colors.brand.light,
    borderWidth: 1,
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
  avatarFallbackAdmin: {
    backgroundColor: Colors.neutral.white,
    borderColor: Colors.brand.light,
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  adminBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.brand.light,
  },

  // Rodapé
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
  },
  createBtn: {
    height: 54,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    shadowColor: Colors.brand.primary,
    shadowOpacity: 0.3,
  },
  createBtnDisabled: {
    backgroundColor: Colors.neutral.border,
    shadowOpacity: 0,
    elevation: 0,
  },
})
