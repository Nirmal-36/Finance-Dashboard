// Same design tokens as the web frontend's src/index.css @theme block,
// expressed as a plain JS object since React Native has no CSS variables
// or Tailwind — styles are built with StyleSheet.create() referencing
// these colors directly.

export const colors = {
  ink950: '#0F1419',
  ink900: '#161C24',
  ink850: '#1B222C',
  ink800: '#1F2730',
  ink700: '#2A3340',
  ink600: '#3C4857',

  paper: '#F5F3EE',
  paperDim: '#A8AFB8',
  paperFaint: '#6B7280',

  signal: '#7C9A92',
  signalDim: '#5C7971',
  amber: '#D4A24C',
  amberDim: '#A17D3A',
  coral: '#E0624C',
  coralDim: '#B54F3D',
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
}

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
}

export const fontSize = {
  xs: 12,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
}
