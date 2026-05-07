import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

import { ScreenTransition } from '../../components/ScreenTransition'
import { ProfileHeader } from '../../components/profile/ProfileHeader'
import { SettingsItem } from '../../components/profile/SettingsItem'
import { SettingsSection } from '../../components/profile/SettingsSection'
import { PersonIcon, PixIcon, Text } from '../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../constants/theme'
import { supabase } from '../../lib/supabase'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

interface Profile {
  name: string
  username: string
  email: string
  pix_key: string | null
  avatar_url: string | null
}

// ═══════════════════════════════════════════════════════════════════
// ÍCONES INLINE
// ═══════════════════════════════════════════════════════════════════

function LockIcon({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 11H7V8a5 5 0 0 1 10 0v3Z"
        stroke={color} strokeWidth={2} strokeLinejoin="round"
      />
      <Path
        d="M5 11h14v10H5V11Z"
        stroke={color} strokeWidth={2} strokeLinejoin="round"
      />
      <Path d="M12 15v2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

function LogoutIcon({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M10 17l5-5-5-5M15 12H3"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  )
}

function BellIcon({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  )
}

function GlobeIcon({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Z"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  )
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('name, username, email, pix_key, avatar_url')
        .eq('id', user.id)
        .single()

      setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que quer sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => supabase.auth.signOut(),
      },
    ])
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.brand.primary} />
      </SafeAreaView>
    )
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text variant="body" color={Colors.neutral.secondary}>Perfil não encontrado.</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Header com info do usuário ── */}
          <ProfileHeader
            name={profile.name}
            username={profile.username}
            email={profile.email}
            avatarUrl={profile.avatar_url}
          />

          {/* ── Seção Conta ── */}
          <SettingsSection title="Conta">
            <SettingsItem
              icon={<PersonIcon size={18} color={Colors.brand.primary} />}
              iconBg={Colors.brand.xlight}
              label="Editar perfil"
              onPress={() => Alert.alert('Em breve')}
            />
            <SettingsItem
              icon={<PixIcon size={18} color={Colors.brand.primary} />}
              iconBg={Colors.brand.xlight}
              label="Chave PIX"
              value={profile.pix_key ?? 'Não cadastrada'}
              onPress={() => Alert.alert('Em breve')}
            />
            <SettingsItem
              icon={<LockIcon size={18} color={Colors.neutral.secondary} />}
              iconBg={Colors.neutral.border}
              label="Alterar senha"
              onPress={() => Alert.alert('Em breve')}
            />
          </SettingsSection>

          {/* ── Preferências ── */}
          <SettingsSection title="Preferências">
            <SettingsItem
              icon={<BellIcon size={18} color={Colors.brand.primary} />}
              iconBg={Colors.brand.xlight}
              label="Notificações"
              onPress={() => Alert.alert('Em breve')}
            />
            <SettingsItem
              icon={<GlobeIcon size={18} color={Colors.brand.primary} />}
              iconBg={Colors.brand.xlight}
              label="Idioma"
              value="Português"
              onPress={() => Alert.alert('Em breve')}
            />
          </SettingsSection>

          {/* ── Logout ── */}
          <SettingsSection title="Sessão">
            <SettingsItem
              icon={<LogoutIcon size={18} color={Colors.status.debt} />}
              iconBg={Colors.status.debtBg}
              label="Sair da conta"
              onPress={handleLogout}
              danger
            />
          </SettingsSection>

        </ScrollView>
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
    backgroundColor: Colors.neutral.surface,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
})
