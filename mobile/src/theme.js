export const colors = {
  background: '#FFF5F0',
  surface: '#FFF5F0',
  surfaceAlt: '#FFF8F5',
  surfaceDeep: '#FCEEE7',
  text: '#2C2B28',
  textSecondary: '#5A5853',
  textMuted: '#7A7770',
  border: '#E8CFC7',
  borderStrong: '#D8B8AE',

  // Primary CTA: amber
  accent: '#ffba30',
  accentSoft: '#fff4d9',
  accentMid: '#ffd57a',
  accentDark: '#c48a00',
  butterBorder: '#f1df9c',
  butterBorderSoft: '#f7edc4',
  redBorder: 'rgba(242,107,100,0.20)',

  // Secondary: sage
  sage: '#bac98e',
  sageSoft: '#eef3e4',
  sageDark: '#6b8a48',

  // Tertiary accents
  blush: '#f4d3ce',
  blushSoft: '#fdf0ee',
  blushDark: '#a85048',
  lavender: '#e0d8ff',
  lavenderSoft: '#f3f0ff',
  lavenderDark: '#5a48b0',
  blue: '#deeaf4',
  blueSoft: '#eef5fb',
  blueDark: '#3a6a90',

  // Legacy aliases (backward compat with existing screens)
  accentOrange: '#ffba30',
  accentOrangeSoft: '#fff4d9',
  accentGreen: '#bac98e',
  accentGreenSoft: '#eef3e4',
  accentLavender: '#9b87cc',
  accentLavenderSoft: '#e0d8ff',

  upcoming: '#ffba30',
  upcomingSoft: '#fff4d9',
  past: '#8A8987',
  pastSoft: '#f0efed',

  success: '#bac98e',
  successSoft: '#eef3e4',
  danger: '#d95050',
  dangerSoft: '#faeaea',
  warning: '#ffba30',
  warningSoft: '#fff4d9',

  overlay: 'rgba(95,10,0,0.16)',
  overlayDark: 'rgba(95,10,0,0.34)',
};

export const fonts = {
  black: 'Nunito_900Black',
  extraBold: 'Nunito_800ExtraBold',
  bold: 'Nunito_700Bold',
  semiBold: 'Nunito_600SemiBold',
  medium: 'Nunito_500Medium',
  regular: 'Nunito_400Regular',
  scriptFallback: 'Nunito_400Regular',
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  trip: 28,
  full: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const shadow = {
  sm: {
    shadowColor: '#B9A09B',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#B9A09B',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  lg: {
    shadowColor: '#B9A09B',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
};
