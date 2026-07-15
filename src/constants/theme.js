// App-wide theme: colors, typography, spacing, shadows
export const darkColors = {
  // Backgrounds
  bg:           '#0F0F1A',
  bgCard:       '#1A1A2E',
  bgCardAlt:    '#16213E',
  bgInput:      '#1E1E35',
  bgModal:      '#1A1A2E',

  // Brand
  primary:      '#7C3AED',       // violet
  primaryLight: '#A78BFA',
  primaryDark:  '#5B21B6',
  accent:       '#06B6D4',       // cyan
  accentLight:  '#67E8F9',

  // Status
  success:      '#10B981',
  warning:      '#FBBF24',
  danger:       '#EF4444',
  dangerLight:  '#FCA5A5',

  // Text
  textPrimary:  '#F1F5F9',
  textSecondary:'#94A3B8',
  textMuted:    '#475569',
  textInverse:  '#0F0F1A',

  // Borders
  border:       '#2D2D4E',
  borderLight:  '#3D3D5E',

  // Gradients (used as array)
  gradientPrimary: ['#7C3AED', '#5B21B6'],
  gradientCard:    ['#1A1A2E', '#16213E'],
  gradientAccent:  ['#06B6D4', '#0EA5E9'],
  
  isDark: true,
};

export const lightColors = {
  // Backgrounds
  bg:           '#F8F9FA',
  bgCard:       '#FFFFFF',
  bgCardAlt:    '#F1F3F5',
  bgInput:      '#F1F3F5',
  bgModal:      '#FFFFFF',

  // Brand
  primary:      '#6C5DD3', // vibrant purple from wireframe
  primaryLight: '#9D95ED',
  primaryDark:  '#4A3CA3',
  accent:       '#3F8CFF',
  accentLight:  '#8CB5FF',

  // Status
  success:      '#10B981',
  warning:      '#FF7043',
  danger:       '#FF4A5A',
  dangerLight:  '#FF919C',

  // Text
  textPrimary:  '#1B1D28',
  textSecondary:'#767C8A',
  textMuted:    '#A0A5B1',
  textInverse:  '#FFFFFF',

  // Borders
  border:       '#E4E7ED',
  borderLight:  '#F1F3F5',

  // Gradients
  gradientPrimary: ['#6C5DD3', '#8578E8'],
  gradientCard:    ['#FFFFFF', '#F8F9FA'],
  gradientAccent:  ['#3F8CFF', '#6AABFF'],
  
  isDark: false,
};

// Fallback for any static imports still lingering
export const COLORS = darkColors;

export const FONTS = {
  regular:    'Inter_400Regular',
  medium:     'Inter_500Medium',
  semiBold:   'Inter_600SemiBold',
  bold:       'Inter_700Bold',
  sizes: {
    xs:   11,
    sm:   13,
    md:   15,
    lg:   18,
    xl:   22,
    xxl:  28,
    xxxl: 36,
  },
};

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const RADIUS = {
  sm:  8,
  md:  14,
  lg:  20,
  xl:  28,
  full: 999,
};

export const SHADOWS = {
  card: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
  },
};
