type Palette = {
  primary: string;
  secondary: string;
  accent: string;
};

/**
 * Generates CSS custom properties for the theme based on the palette
 * allowing for dynamic theming and white-labeling
 * @param palette
 * @returns  CSS custom properties for the theme
 */
export function generateTheme(palette: Palette): string {
  return `
      :root {
        --brand-color-primary1: ${palette.primary};
        --brand-color-primary2: ${lighten(palette.primary, 10)};
        --brand-color-primary3: ${lighten(palette.primary, 30)};
        --brand-color-primary4: ${lighten(palette.primary, 50)};
        --brand-color-secondary1: ${palette.secondary};
        --brand-color-secondary2: ${lighten(palette.secondary, 10)};
        --brand-color-secondary3: ${lighten(palette.secondary, 20)};
        --brand-color-secondary4: ${lighten(palette.secondary, 30)};
        --brand-color-secondary5: ${lighten(palette.secondary, 50)};
        --brand-color-secondary6: ${lighten(palette.secondary, 70)};
        --brand-color-secondary7: ${lighten(palette.secondary, 90)};
        --color-accent: ${palette.accent};
      }
    `;
}

function lighten(hex: string, percent: number): string {
  const num = parseInt(hex.slice(1), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return `#${(0x1000000 + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}
