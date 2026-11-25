// Brand palette taken from the Al-Wakeel Al-Shamel logo (gold + black).
// Matches the website tokens in frontend/src/style.css.
export const colors = {
  ink: '#141414',
  gold: '#B8914F',
  goldLight: '#D4B27A',
  goldText: '#85652A', // gold that stays readable on light backgrounds
  sand: '#F6EFE1',
  sand2: '#F4F0E8',

  // Older names kept so every screen picks up the new look.
  primary: '#141414', // main actions are black
  primaryDark: '#85652A',
  primarySoft: '#F6EFE1',
  teal: '#B8914F',

  text: '#141414',
  textSoft: '#6B6459',
  muted: '#8A8273',
  bg: '#FAF8F4',
  surface: '#FFFFFF',
  border: '#ECE6DA',
  borderStrong: '#E4DCCB',
  danger: '#9A2A16',
  dangerSoft: '#FCEBE7',
  success: '#1F7A4D',
  successSoft: '#E6F2EC',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  dark: '#141414',
}

// Font families (loaded in App.js). On Android custom fonts need one family per weight,
// so use these instead of fontWeight.
export const fonts = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semibold: 'IBMPlexSansArabic_600SemiBold',
  bold: 'IBMPlexSansArabic_700Bold',
  heading: 'Cairo_700Bold',
  headingHeavy: 'Cairo_800ExtraBold',
}

export const radius = { sm: 12, md: 16, lg: 22, pill: 999 }

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 }

export const shadow = {
  shadowColor: '#141414',
  shadowOpacity: 0.05,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
}

// Badge colors per order status.
export const statusColors = {
  Placed: { bg: '#EEF0F3', fg: '#3A4250' },
  Pending: { bg: '#EEF0F3', fg: '#3A4250' },
  Processing: { bg: colors.warningSoft, fg: '#92400E' },
  Shipped: { bg: colors.sand, fg: colors.goldText },
  Delivered: { bg: colors.successSoft, fg: colors.success },
  Cancelled: { bg: colors.dangerSoft, fg: colors.danger },
  Completed: { bg: colors.successSoft, fg: colors.success },
}
