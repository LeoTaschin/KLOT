import React, { useRef } from 'react'
import {
  Animated,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../navigation/types'

import { AddIcon, ContasIcon, GruposIcon, HomeIcon, PersonIcon } from './ui'
import { Colors, Shadows, Spacing } from '../constants/theme'

// ─── Configuração das abas ────────────────────────────────────────────────────

const TAB_ITEMS: Array<{
  name: string
  label: string
  Icon: React.FC<{ size?: number; color?: string }>
}> = [
  { name: 'Home',    label: 'Início',  Icon: HomeIcon    },
  { name: 'Grupos',  label: 'Grupos',  Icon: GruposIcon  },
  { name: 'Contas',  label: 'Contas',  Icon: ContasIcon  },
  { name: 'Profile', label: 'Perfil',  Icon: PersonIcon  },
]


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════════

export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets()

  // Animação de escala para o FAB
  const fabScale = useRef(new Animated.Value(1)).current

  const pressFabIn = () => {
    Animated.spring(fabScale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 30,
    }).start()
  }

  const pressFabOut = () => {
    Animated.spring(fabScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start()
  }

  const handleFab = () => {
    navigation
      .getParent<NativeStackNavigationProp<AppStackParamList>>('AppStack')
      ?.navigate('DebtFlow')
  }

  return (
    <View style={[styles.wrapper, { paddingBottom: bottom || Spacing.md }]}>
      {/* ── Pílula de navegação ── */}
      <View style={styles.pill}>

        {TAB_ITEMS.map((item) => {
          const tabIndex = state.routes.findIndex((r) => r.name === item.name)
          const isFocused = tabIndex !== -1 && state.index === tabIndex

          const onPress = () => {
            if (tabIndex === -1) return
            const route = state.routes[tabIndex]
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(item.name)
            }
          }

          const { Icon } = item

          return (
            <TouchableOpacity
              key={item.name}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={item.label}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              {/* Indicador ativo */}
              {isFocused && <View style={styles.activeIndicator} />}

              <Icon
                size={22}
                color={isFocused ? Colors.brand.primary : Colors.neutral.placeholder}
              />
            </TouchableOpacity>
          )
        })}
      </View>

      {/* ── FAB ── */}
      <Animated.View style={[styles.fabWrap, { transform: [{ scale: fabScale }] }]}>
        <Pressable
          onPress={handleFab}
          onPressIn={pressFabIn}
          onPressOut={pressFabOut}
          style={styles.fab}
          accessibilityRole="button"
          accessibilityLabel="Adicionar"
        >
          <AddIcon size={26} color={Colors.neutral.white} />
        </Pressable>
      </Animated.View>
    </View>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════════════════

const PILL_HEIGHT = 60
const FAB_SIZE = 54

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    // Garante que toque não seja interceptado fora dos elementos
    pointerEvents: 'box-none',
  },

  // Pílula
  pill: {
    flex: 1,
    height: PILL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: PILL_HEIGHT / 2,
    paddingHorizontal: Spacing.md,
    ...Shadows.md,
    // iOS shadow color mais escura para destaque
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },

  activeIndicator: {
    position: 'absolute',
    top: 10,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.brand.primary,
  },

  // FAB
  fabWrap: {
    marginBottom: (PILL_HEIGHT - FAB_SIZE) / 2,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    shadowColor: Colors.brand.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    // Android elevation com cor
    elevation: 8,
  },
})
