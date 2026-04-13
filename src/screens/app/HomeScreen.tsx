import { SafeAreaView } from 'react-native-safe-area-context'
import { TouchableOpacity, View } from 'react-native'

import { Text } from '../../components/ui'
import { Colors, Radius, Spacing } from '../../constants/theme'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import type { TabScreenProps } from '../../navigation/types'

export function HomeScreen({}: TabScreenProps<'Home'>) {
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.neutral.white }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg }}>
        <Text variant="h2" color={Colors.neutral.primary} style={{ marginBottom: Spacing.xl }}>
          Home
        </Text>

        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: Colors.status.debt,
            paddingVertical: Spacing.sm + 2,
            paddingHorizontal: Spacing.xl,
            borderRadius: Radius.full,
          }}
          activeOpacity={0.8}
        >
          <Text variant="label" color={Colors.neutral.white} weight="600">
            Sair da conta
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
