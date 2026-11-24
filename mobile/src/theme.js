// Colors mirror the web app's CSS variables (frontend/src/style.css).
export const colors = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primarySoft: '#dbeafe',
  teal: '#14b8a6',
  text: '#0f172a',
  textSoft: '#64748b',
  muted: '#94a3b8',
  bg: '#f8fafc',
  surface: '#ffffff',
  border: '#e5e7eb',
  danger: '#dc2626',
  dangerSoft: '#fee2e2',
  success: '#16a34a',
  successSoft: '#dcfce7',
  warning: '#d97706',
  warningSoft: '#fef3c7',
  dark: '#0f172a',
}

export const radius = { sm: 10, md: 14, lg: 18, pill: 999 }

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 }

export const shadow = {
  shadowColor: '#0f172a',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
}

// Badge colors per order status.
export const statusColors = {
  Placed: { bg: '#e0e7ff', fg: '#3730a3' },
  Pending: { bg: '#e0e7ff', fg: '#3730a3' },
  Processing: { bg: colors.warningSoft, fg: '#92400e' },
  Shipped: { bg: colors.primarySoft, fg: colors.primaryDark },
  Delivered: { bg: colors.successSoft, fg: '#166534' },
  Cancelled: { bg: colors.dangerSoft, fg: '#991b1b' },
  Completed: { bg: colors.successSoft, fg: '#166534' },
}
