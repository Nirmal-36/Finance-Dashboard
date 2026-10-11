/**
 * FinanceLens — React Native app
 * @format
 */

// Must be the first import — react-native-gesture-handler patches native
// event handling globally, and React Navigation's native-stack depends
// on this having run before any navigator renders.
import 'react-native-gesture-handler'

import React from 'react'
import { StatusBar } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppNavigator } from './src/navigation/AppNavigator'

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default App
