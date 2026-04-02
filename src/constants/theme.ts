/**
 * KLOT Design System
 *
 * Arquivo centralizado com todos os tokens de design:
 * - Paleta de cores
 * - Tipografia
 * - Espaçamento
 * - Border radius
 * - Sombras
 */

// ═══════════════════════════════════════════════════════════════════
// CORES
// ═══════════════════════════════════════════════════════════════════

export const Colors = {
  brand: {
    primary: '#0D9488',   // Teal principal
    dark: '#0F766E',      // Teal escuro
    light: '#CCFBF1',     // Teal claro
    xlight: '#F0FDFA',    // Teal muito claro (fundo)
  },
  neutral: {
    primary: '#0F172A',     // Texto escuro
    secondary: '#64748B',   // Texto secundário
    placeholder: '#94A3B8', // Placeholder
    border: '#E2E8F0',      // Bordas
    surface: '#F8FAFC',     // Fundo de surface
    white: '#FFFFFF',       // Branco puro
  },
  status: {
    debt: '#EF4444',        // Vermelho (débito)
    credit: '#22C55E',      // Verde (crédito)
    settled: '#94A3B8',     // Cinza (resolvido)
    debtBg: '#FEF2F2',      // Fundo vermelho claro
    creditBg: '#F0FDF4',    // Fundo verde claro
    pendingBg: '#FFF7ED',   // Fundo laranja claro
    pending: '#F59E0B',     // Laranja (pendente)
  },
} as const

// ═══════════════════════════════════════════════════════════════════
// TIPOGRAFIA
// ═══════════════════════════════════════════════════════════════════

export const Typography = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '800' as const,
  },
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700' as const,
  },
  h2: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700' as const,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  bodyLg: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
} as const

// ═══════════════════════════════════════════════════════════════════
// ESPAÇAMENTO (base 8px)
// ═══════════════════════════════════════════════════════════════════

export const Spacing = {
  xs: 4,      // 4px
  sm: 8,      // 8px
  md: 16,     // 16px
  lg: 24,     // 24px
  xl: 32,     // 32px
  xxl: 48,    // 48px
} as const

// ═══════════════════════════════════════════════════════════════════
// BORDER RADIUS
// ═══════════════════════════════════════════════════════════════════

export const Radius = {
  sm: 8,      // 8px
  md: 12,     // 12px
  lg: 16,     // 16px
  xl: 24,     // 24px
  full: 999,  // Totalmente redondo
} as const

// ═══════════════════════════════════════════════════════════════════
// SOMBRAS
// ═══════════════════════════════════════════════════════════════════

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const

// ═══════════════════════════════════════════════════════════════════
// THEME CONSOLIDADO
// ═══════════════════════════════════════════════════════════════════

export const Theme = {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
} as const

export type ThemeType = typeof Theme
