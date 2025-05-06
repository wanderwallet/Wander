export const themeTokens = {
  background: {
    default: "var(--color-background-default)",
    card: "var(--color-card-background-default)",
    box: "var(--color-background-box)",
    switch: {
      enabled: "var(--color-background-switch-enabled)",
    },
  },
  text: {
    heading: "var(--color-font-heading)",
    body: "var(--color-font-body)",
    footer: "var(--color-text-footer)",
    copyable: {
      label: "var(--color-copyable-text-label)",
      value: "var(--color-copyable-text-value)",
    },
  },
  border: {
    default: "var(--color-card-border-default)",
    box: "var(--color-border-box)",
    popover: "var(--color-border-popover)",
    copyable: "var(--color-copyable-border)",
    radio: "var(--color-border-radio)",
    seedInput: "var(--color-seed-input-border)",
  },
  button: {
    primary: {
      background: "var(--color-background-button-primary)",
      active: "var(--color-button-primary-active)",
      success: "var(--color-button-primary-success)",
      error: "var(--color-button-primary-error)",
      disabled: "var(--color-background-button-disabled)",
    },
    outlined: {
      active: "var(--color-button-outlined-active)",
      border: "var(--color-button-outlined-border)",
    },
    secondary: {
      background: "var(--color-button-secondary-background)",
      active: "var(--color-button-secondary-active)",
      border: "var(--color-button-secondary-border)",
    },
  },
  link: {
    primary: "var(--color-link-primary)",
    secondary: "var(--color-link-secondary)",
    disabled: "var(--color-link-disabled)",
  },
  divider: "var(--color-divider-default)",
  loading: {
    primary: "var(--color-loading-primary)",
    secondary: "var(--color-loading-secondary)",
  },
  input: {
    border: "var(--color-seed-input-border)",
    active: "var(--color-seed-input-active)",
    background: "var(--color-seed-input-background)",
  },
  radio: {
    border: "var(--color-border-radio)",
    background: "var(--color-non-checked-background-radio)",
  },
  avatar: {
    background: "var(--avatar-background)",
  },
  shadow: {
    card: "var(--color-card-shadow-default)",
  },
};

export const commonTokens = {
  spacing: {
    "0": "0",
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "5": "20px",
    "6": "24px",
    "8": "32px",
    "10": "40px",
    "12": "48px",
    "16": "64px",
  },
  borderRadius: {
    sm: "4px",
    md: "8px",
    lg: "16px",
    xl: "24px",
    rounded: "999px",
  },
  fontSize: {
    xs: "12px",
    sm: "14px",
    md: "16px",
    lg: "18px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "30px",
    "4xl": "36px",
  },
  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  transition: {
    fast: "0.15s ease",
    base: "0.3s ease",
    slow: "0.5s ease",
  },
};
