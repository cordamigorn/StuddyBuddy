// Tema ve Stil Rehberi

// Renk Paleti
export const colors = {
  // Ana Renkler
  primary: '#FF5A5F', // Pomodoro kırmızısı
  secondary: '#00A699', // Tamamlama ve başarı yeşili
  background: '#FFFFFF',
  surface: '#F8F8F8',
  error: '#FF3B30',
  warning: '#FFCC00',
  success: '#4CD964',

  // Metin Renkleri
  text: {
    primary: '#222222',
    secondary: '#717171',
    muted: '#999999',
    inverse: '#FFFFFF',
  },

  // Gri Tonlar
  gray: {
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Karanlık Tema
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    primary: '#FF5A5F',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
  },

  // Durum Renkleri
  priority: {
    high: '#FF3B30',   // Kırmızı - Yüksek öncelik
    medium: '#FFCC00', // Sarı - Orta öncelik
    low: '#4CD964',    // Yeşil - Düşük öncelik
  },
};

// Tipografi
export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System-Medium',
    bold: 'System-Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    xxxl: 42,
  },
};

// Boşluk Değerleri
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Kenar Yuvarlatma
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

// Gölgeler
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Bileşen Stilleri
export const componentStyles = {
  // Buton Stilleri
  button: {
    primary: {
      backgroundColor: colors.primary,
      textColor: colors.text.inverse,
      padding: spacing.md,
      borderRadius: borderRadius.md,
    },
    secondary: {
      backgroundColor: colors.secondary,
      textColor: colors.text.inverse,
      padding: spacing.md,
      borderRadius: borderRadius.md,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderColor: colors.primary,
      borderWidth: 1,
      textColor: colors.primary,
      padding: spacing.md,
      borderRadius: borderRadius.md,
    },
    text: {
      backgroundColor: 'transparent',
      textColor: colors.primary,
      padding: spacing.md,
    },
  },

  // Kart Stilleri
  card: {
    container: {
      backgroundColor: colors.background,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      ...shadows.small,
    },
  },

  // Form Öğeleri
  input: {
    container: {
      backgroundColor: colors.background,
      borderColor: colors.gray[300],
      borderWidth: 1,
      borderRadius: borderRadius.sm,
      padding: spacing.md,
    },
    focus: {
      borderColor: colors.primary,
    },
    error: {
      borderColor: colors.error,
    },
  },

  // Hata Mesajları
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
  },
}; 