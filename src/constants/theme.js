// App-wide theme: colors, typography, spacing, shadows
export const darkColors = {
  bg:           '#0F0F1A',
  bgCard:       '#1A1A2E',
  bgCardAlt:    '#16213E',
  bgInput:      '#1E1E35',
  bgModal:      '#1A1A2E',
  primary:      '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark:  '#5B21B6',
  accent:       '#06B6D4',
  accentLight:  '#67E8F9',
  success:      '#10B981',
  warning:      '#FBBF24',
  danger:       '#EF4444',
  dangerLight:  '#FCA5A5',
  textPrimary:  '#F1F5F9',
  textSecondary:'#94A3B8',
  textMuted:    '#475569',
  textInverse:  '#0F0F1A',
  border:       '#2D2D4E',
  borderLight:  '#3D3D5E',
  gradientPrimary: ['#6C4CF1', '#8862F8'],
  gradientCard:    ['#1A1A2E', '#16213E'],
  gradientAccent:  ['#06B6D4', '#0EA5E9'],
  isDark: true,
};

export const lightColors = {
  bg:           '#F7F8FA',
  bgCard:       '#FFFFFF',
  bgCardAlt:    '#F1F3F5',
  bgInput:      '#F1F3F5',
  bgModal:      '#FFFFFF',
  primary:      '#6C4CF1',
  primaryLight: '#9D95ED',
  primaryDark:  '#4A3CA3',
  accent:       '#3F8CFF',
  accentLight:  '#8CB5FF',
  success:      '#10B981',
  warning:      '#F59E0B',
  danger:       '#EF4444',
  dangerLight:  '#FCA5A5',
  textPrimary:  '#1C1C28',
  textSecondary:'#8F92A1',
  textMuted:    '#B0B4BF',
  textInverse:  '#FFFFFF',
  border:       '#E8EAF0',
  borderLight:  '#F1F3F5',
  gradientPrimary: ['#6C4CF1', '#8862F8'],
  gradientCard:    ['#FFFFFF', '#F8F9FA'],
  gradientAccent:  ['#3F8CFF', '#6AABFF'],
  isDark: false,
};

export const COLORS = darkColors;

export const FONTS = {
  // Poppins — premium geometric font, stunning at bold sizes
  regular:    'Poppins_500Medium',     // body text
  medium:     'Poppins_600SemiBold',   // labels, captions
  semiBold:   'Poppins_700Bold',       // section titles, card labels
  bold:       'Poppins_800ExtraBold',  // all headings, amounts, numbers
  sizes: {
    xs:   12,
    sm:   14,
    md:   16,
    lg:   18,
    xl:   22,
    xxl:  26,
    xxxl: 34,
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
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  full: 999,
};

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  strong: {
    shadowColor: '#6C4CF1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 14,
    elevation: 10,
  },
  button: {
    shadowColor: '#6C4CF1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
};
