import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ScreenTransition } from '../../components/ScreenTransition'
import { PersonIcon, Text } from '../../components/ui'
import { Colors, Spacing } from '../../constants/theme'
import { supabase } from '../../lib/supabase'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

interface Profile {
  name: string
  username: string
  email: string
  date_of_birth: string | null
  avatar_url: string | null
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function calcAge(dateStr: string | null): number | null {
  if (!dateStr) return null
  const birth = new Date(dateStr)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const notYet =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  if (notYet) age--
  return age
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
        .select('name, username, email, date_of_birth, avatar_url')
        .eq('id', user.id)
        .single()

      console.log('[Profile] data:', JSON.stringify(data))
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

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
        <Text variant="body" color={Colors.neutral.secondary}>
          Perfil não encontrado.
        </Text>
      </SafeAreaView>
    )
  }

  const age = calcAge(profile.date_of_birth)

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>
      <View style={styles.card}>

        {/* Avatar */}
        {profile.avatar_url ? (
          <Image
            source={{ uri: profile.avatar_url }}
            style={styles.avatar}
            resizeMode="cover"
            onError={(e) => console.log('[Profile] image error:', e.nativeEvent)}
            onLoad={() => console.log('[Profile] image loaded!')}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <PersonIcon size={48} color={Colors.neutral.placeholder} />
          </View>
        )}

        {/* Nome */}
        <Text variant="h2" color={Colors.neutral.primary} style={styles.name}>
          {profile.name}
        </Text>

        {/* Username */}
        <Text variant="body" color={Colors.brand.primary} weight="600">
          @{profile.username}
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Infos */}
        <View style={styles.infoRow}>
          <Text variant="caption" color={Colors.neutral.secondary}>Email</Text>
          <Text variant="label" color={Colors.neutral.primary}>{profile.email}</Text>
        </View>

        {age !== null && (
          <View style={styles.infoRow}>
            <Text variant="caption" color={Colors.neutral.secondary}>Idade</Text>
            <Text variant="label" color={Colors.neutral.primary}>{age} anos</Text>
          </View>
        )}

      </View>
      </ScreenTransition>
    </SafeAreaView>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const AVATAR_SIZE = 100

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.neutral.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '85%',
    backgroundColor: Colors.neutral.white,
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginBottom: Spacing.md,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: Colors.neutral.surface,
    borderWidth: 2,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  name: {
    marginBottom: Spacing.xs,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.neutral.border,
    marginVertical: Spacing.lg,
  },
  infoRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
})
