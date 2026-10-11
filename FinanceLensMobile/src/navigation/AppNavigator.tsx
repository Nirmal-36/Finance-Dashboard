import React, { useEffect } from 'react'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { RootStackParamList } from './types'
import { AuthNavigator } from './AuthNavigator'
import { DevicesScreen } from '../screens/DevicesScreen'
import { MainTabNavigator } from './MainTabNavigator'
import { useAuthStore } from '../store/authStore'
import { Spinner } from '../components/ui/Primitives'
import { colors } from '../theme'

const Stack = createNativeStackNavigator<RootStackParamList>()

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.ink950,
    card: colors.ink900,
    border: colors.ink800,
    text: colors.paper,
    primary: colors.signal,
  },
}

export function AppNavigator() {
  const isLoading = useAuthStore((s) => s.isLoading)
  const isAuthed = useAuthStore((s) => s.isAuthed)
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (isLoading) return <Spinner />

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthed ? (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen
              name="Devices"
              component={DevicesScreen}
              options={{
                headerShown: true,
                title: 'Devices',
                headerStyle: { backgroundColor: colors.ink900 },
                headerTintColor: colors.paper,
                headerShadowVisible: false,
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
