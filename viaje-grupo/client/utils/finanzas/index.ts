export const validatePayment = (payment: any) => {
  // Verify all information is accurate
  if (!payment.title || typeof payment.title != "string") {
    return "Título de pago inválido. Contactanos si el error persiste.";
  }
  if (!payment.amount || typeof payment.amount != "number") {
    return "Monto de pago inválido. Contactanos si el error persiste.";
  }
  if (typeof payment.isPaid != "boolean") {
    return "Propiedad de pago inválida: está pagado. Contactanos si el error persiste.";
  }
  const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
  if (!payment.dueDate || typeof payment.dueDate != "string" || !regex.test(payment.dueDate)) {
    return "Fecha de pago inválida. Contactanos si el error persiste.";
  }
  if (!["weekly", "bi-weekly", "semi-monthly", "monthly", "one-time"].includes(payment.timePeriod)) {
    return "Período de pago inválido. Contactanos si el error persiste.";
  }
};

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(price || 0);
};

// Legacy category string to color mapping (for backward compatibility)
const CATEGORY_COLORS: Record<string, string> = {
  utilities: '#0072DF',
  food: '#1D9A38',
  transport: '#E6AE2C',
  entertainment: '#6158FF',
  health: '#E84A8A',
  fitness: '#FF4500',
  personal_care: '#DDA0DD',
  pet: '#3CAEA3',
  clothes: '#800020',
  traveling: '#FF8C00',
  education: '#9370DB',
  subscriptions: '#20B2AA',
  gifts: '#FF1493',
  taxes: '#8B4513',
  dining: '#FF6347',
  housing: '#4682B4',
  other: '#808080'
};

/**
 * Get inline styles for a category by string key (legacy support)
 * @deprecated Use getCategoryStyles() with color directly instead
 */
export const getCategoryClasses = (category: string) => {
  const color = CATEGORY_COLORS[category.toLowerCase()] || CATEGORY_COLORS.other;
  return getCategoryStyles(color);
};

/**
 * Get inline styles from a hex color (for dynamic categories)
 * @deprecated Use getCategoryStyles() directly instead
 */
export const getCategoryClassesFromColor = (color: string) => {
  return getCategoryStyles(color);
};

/**
 * Get inline styles for a category color (more reliable for dynamic colors)
 */
export const getCategoryStyles = (color: string) => {
  const validColor = color && color.startsWith('#') ? color : '#808080';
  return {
    backgroundColor: `${validColor}26`, // 15% opacity in hex
    color: validColor
  };
};

/**
 * Get the color for a legacy category string
 */
export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category.toLowerCase()] || CATEGORY_COLORS.other;
};
