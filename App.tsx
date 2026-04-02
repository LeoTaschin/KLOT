import './src/i18n'
import { NavigationContainer } from '@react-navigation/native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'

import { AnimatedSplash } from './src/components/AnimatedSplash'
import { RootNavigator } from './src/navigation/RootNavigator'

// Mantém a splash nativa visível até os assets estarem prontos
SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient()

export default function App() {
  const [appReady, setAppReady] = useState(false)
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => {
    async function prepare() {
      try {
        // Carregue aqui fontes, assets críticos, dados iniciais, etc.
        // Exemplo: await Font.loadAsync({ ... })
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

  if (!appReady) return null

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
