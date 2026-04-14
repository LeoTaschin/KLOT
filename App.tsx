import './src/i18n'
import { NavigationContainer } from '@react-navigation/native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'

import { AnimatedSplash } from './src/components/AnimatedSplash'
import { RootNavigator } from './src/navigation/RootNavigator'
import { supabase } from './src/lib/supabase'
import { useAuthStore } from './src/store/useAuthStore'

// Mantém a splash nativa visível até os assets estarem prontos
SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient()

export default function App() {
  const [appReady, setAppReady] = useState(false)
  const [splashDone, setSplashDone] = useState(false)

  // Aguarda o zustand terminar de hidratar o estado do AsyncStorage
  const storeHydrated = useAuthStore.persist.hasHydrated()
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)

  // Importado fora do hook para leitura direta no callback
  const getRegisterState = () => require('./src/store/useRegisterStore').useRegisterStore.getState()

  useEffect(() => {
    async function prepare() {
      try {
        // Restaura sessão ativa do Supabase
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          login(session.access_token)
        }

        // Listener para mudanças de sessão (logout, token refresh)
        // Ignora SIGNED_IN durante o fluxo de cadastro — o login acontece no último passo
        supabase.auth.onAuthStateChange((_event, session) => {
          const { isInRegistrationFlow } = getRegisterState()
          if (session && !isInRegistrationFlow) {
            login(session.access_token)
          } else if (!session) {
            logout()
          }
        })
      } catch (e) {
        console.warn(e)
      } finally {
        setAppReady(true)
      }
    }

    prepare()
  }, [])

  const onLayoutReady = useCallback(async () => {
    if (appReady) {
      // Esconde a splash nativa — o AnimatedSplash cobre a transição
      await SplashScreen.hideAsync()
    }
  }, [appReady])

  // Não renderiza nada até o store estar hidratado e os assets prontos
  if (!appReady || !storeHydrated) return null

  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ flex: 1 }} onLayout={onLayoutReady}>
        <NavigationContainer>
          <StatusBar style="auto" />
          <RootNavigator />
        </NavigationContainer>

        {!splashDone && (
          <AnimatedSplash onAnimationEnd={() => setSplashDone(true)} />
        )}
      </View>
    </QueryClientProvider>
  )
}
