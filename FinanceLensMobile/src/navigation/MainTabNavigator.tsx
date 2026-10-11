import React from 'react'
import { StyleSheet, Text } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import type { MainTabParamList } from './types'
import { DashboardScreen } from '../screens/DashboardScreen'
import { TransactionsScreen } from '../screens/TransactionsScreen'
import { BudgetsScreen } from '../screens/BudgetsScreen'
import { UploadsScreen } from '../screens/UploadsScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { colors } from '../theme'

const Tab = createBottomTabNavigator<MainTabParamList>()

// Plain-text glyphs instead of an icon font — keeps the dependency list
// small while the UI is still "simple for now" per the current scope.
const tabIcons: Record<keyof MainTabParamList, string> = {
  Overview: '◆',
  Transactions: '≡',
  Budgets: '◎',
  Statements: '▤',
  Settings: '⚙',
}

function TabIcon({ route, color }: { route: keyof MainTabParamList; color: string }) {
  return <Text style={[styles.icon, { color }]}>{tabIcons[route]}</Text>
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.signal,
        tabBarInactiveTintColor: colors.paperFaint,
        tabBarStyle: { backgroundColor: colors.ink900, borderTopColor: colors.ink800 },
        tabBarIcon: ({ color }) => <TabIcon route={route.name as keyof MainTabParamList} color={color} />,
        tabBarLabelStyle: styles.label,
      })}
    >
      <Tab.Screen name="Overview" component={DashboardScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Budgets" component={BudgetsScreen} />
      <Tab.Screen name="Statements" component={UploadsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  icon: { fontSize: 20 },
  label: { fontSize: 11 },
})
