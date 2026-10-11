export type AuthStackParamList = {
  Login: undefined
  Signup: undefined
}

export type MainTabParamList = {
  Overview: undefined
  Transactions: { categoryId?: string } | undefined
  Budgets: undefined
  Statements: undefined
  Settings: undefined
}

export type RootStackParamList = {
  Auth: undefined
  Main: undefined
  Devices: undefined
}
