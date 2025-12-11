/**
 * Voice Meter - Design Tokens
 * Centralized design system for consistent UI/UX
 */

export const colors = {
    // Backgrounds - Refined dark palette (avoiding pure black)
    background: {
        primary: '#0f0f0f',      // Main app background
        secondary: '#1c1c1e',    // Card backgrounds
        elevated: '#252528',     // Elevated elements (modals, tooltips)
        overlay: 'rgba(0, 0, 0, 0.85)',
    },

    // Text - Improved contrast ratios
    text: {
        primary: '#ffffff',      // Headings, important text
        secondary: '#a1a1aa',    // Body text, descriptions (4.5:1 contrast)
        tertiary: '#71717a',     // Captions, timestamps
        muted: '#52525b',        // Disabled states
    },

    // Borders
    border: {
        default: '#2c2c2e',      // Card borders
        subtle: '#1f1f22',       // Dividers
        focus: '#3b82f6',        // Focus rings
    },

    // Semantic - Status colors
    semantic: {
        success: '#10b981',
        successMuted: 'rgba(16, 185, 129, 0.15)',
        warning: '#f59e0b',
        warningMuted: 'rgba(245, 158, 11, 0.15)',
        error: '#ef4444',
        errorMuted: 'rgba(239, 68, 68, 0.15)',
        info: '#3b82f6',
        infoMuted: 'rgba(59, 130, 246, 0.15)',
    },

    // Brand accent
    accent: {
        primary: '#10b981',      // Main CTA color
        secondary: '#3b82f6',    // Secondary actions
        purple: '#8b5cf6',       // Special highlights
    },

    // Category colors
    category: {
        presentation: '#10b981',
        pitch: '#f59e0b',
        conversation: '#3b82f6',
        other: '#8b5cf6',
    },
} as const;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
} as const;

export const typography = {
    // Font sizes
    size: {
        h1: 28,
        h2: 22,
        h3: 18,
        body: 15,
        caption: 13,
        small: 12,
    },
    // Line heights (1.5x ratio for better readability)
    lineHeight: {
        h1: 36,
        h2: 30,
        h3: 26,
        body: 24,
        caption: 20,
        small: 18,
    },
    // Font weights
    weight: {
        normal: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },
} as const;

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
} as const;

export const shadows = {
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    elevated: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    button: {
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
} as const;

// Interaction feedback
export const interaction = {
    activeOpacity: 0.7,
    pressedOpacity: 0.5,
} as const;

export default {
    colors,
    spacing,
    typography,
    borderRadius,
    shadows,
    interaction,
};
