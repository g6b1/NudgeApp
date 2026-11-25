import { FontPreference, ThemePresetId } from '../types/nudge';

export interface ThemePresetDefinition {
  id: ThemePresetId;
  name: string;
  tagline: string;
  defaultAccent: string;
  light: {
    canvas: string;
    champagne: string;
    taupe: string;
    ink: string;
    muted: string;
    glass: string;
    glassStrong: string;
    border: string;
  };
  dark: {
    canvas: string;
    champagne: string;
    taupe: string;
    ink: string;
    muted: string;
    glass: string;
    glassStrong: string;
    border: string;
  };
}

export const THEME_PRESETS: Record<ThemePresetId, ThemePresetDefinition> = {
  botanical: {
    id: 'botanical',
    name: 'Botanical',
    tagline: 'Warm ivory & sage calm',
    defaultAccent: '#788D70',
    light: {
      canvas: '#F7F5F0',
      champagne: '#F1E8D8',
      taupe: '#DCD6CC',
      ink: '#302F2D',
      muted: '#74726D',
      glass: 'rgba(255, 255, 255, 0.72)',
      glassStrong: 'rgba(255, 255, 255, 0.88)',
      border: 'rgba(220, 214, 204, 0.72)',
    },
    dark: {
      canvas: '#171916',
      champagne: '#232621',
      taupe: '#343831',
      ink: '#F2EFE9',
      muted: '#A3A19B',
      glass: 'rgba(32, 35, 30, 0.74)',
      glassStrong: 'rgba(38, 41, 35, 0.90)',
      border: 'rgba(255, 255, 255, 0.09)',
    },
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    tagline: 'Crisp porcelain clarity',
    defaultAccent: '#4B5563',
    light: {
      canvas: '#F8F9FA',
      champagne: '#ECEEF1',
      taupe: '#D9DDE3',
      ink: '#1C1E21',
      muted: '#6B7280',
      glass: 'rgba(255, 255, 255, 0.76)',
      glassStrong: 'rgba(255, 255, 255, 0.92)',
      border: 'rgba(209, 213, 219, 0.72)',
    },
    dark: {
      canvas: '#121316',
      champagne: '#1C1E23',
      taupe: '#2C2F36',
      ink: '#F3F4F6',
      muted: '#9CA3AF',
      glass: 'rgba(28, 30, 35, 0.76)',
      glassStrong: 'rgba(34, 37, 43, 0.92)',
      border: 'rgba(255, 255, 255, 0.09)',
    },
  },
  'warm-neutral': {
    id: 'warm-neutral',
    name: 'Warm Neutral',
    tagline: 'Linen & champagne glow',
    defaultAccent: '#9B7B56',
    light: {
      canvas: '#F6F1EA',
      champagne: '#EDE2D2',
      taupe: '#D8CCBC',
      ink: '#2F2A24',
      muted: '#7B7266',
      glass: 'rgba(255, 252, 247, 0.72)',
      glassStrong: 'rgba(255, 252, 247, 0.88)',
      border: 'rgba(216, 204, 188, 0.72)',
    },
    dark: {
      canvas: '#1A1714',
      champagne: '#26221D',
      taupe: '#38322B',
      ink: '#F5EFE6',
      muted: '#A89F92',
      glass: 'rgba(38, 34, 29, 0.74)',
      glassStrong: 'rgba(46, 41, 35, 0.90)',
      border: 'rgba(255, 255, 255, 0.09)',
    },
  },
  pastel: {
    id: 'pastel',
    name: 'Pastel',
    tagline: 'Soft morning mist',
    defaultAccent: '#6B8CAE',
    light: {
      canvas: '#F4F6F9',
      champagne: '#EAEFF5',
      taupe: '#D5DCE6',
      ink: '#262C36',
      muted: '#6C7687',
      glass: 'rgba(255, 255, 255, 0.72)',
      glassStrong: 'rgba(255, 255, 255, 0.90)',
      border: 'rgba(213, 220, 230, 0.75)',
    },
    dark: {
      canvas: '#151820',
      champagne: '#1E232E',
      taupe: '#2E3545',
      ink: '#EEF2F7',
      muted: '#9AA4B5',
      glass: 'rgba(30, 35, 46, 0.75)',
      glassStrong: 'rgba(37, 43, 56, 0.90)',
      border: 'rgba(255, 255, 255, 0.1)',
    },
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    tagline: 'Quiet indigo dusk',
    defaultAccent: '#6F86D6',
    light: {
      canvas: '#F1F3F8',
      champagne: '#E4E8F2',
      taupe: '#CFD6E6',
      ink: '#1F2433',
      muted: '#636B82',
      glass: 'rgba(255, 255, 255, 0.74)',
      glassStrong: 'rgba(255, 255, 255, 0.90)',
      border: 'rgba(207, 214, 230, 0.75)',
    },
    dark: {
      canvas: '#0F121A',
      champagne: '#171C28',
      taupe: '#262E40',
      ink: '#EDF0F7',
      muted: '#959EB5',
      glass: 'rgba(23, 28, 40, 0.78)',
      glassStrong: 'rgba(29, 35, 50, 0.92)',
      border: 'rgba(255, 255, 255, 0.1)',
    },
  },
  retro: {
    id: 'retro',
    name: 'Retro',
    tagline: 'Paperback & olive print',
    defaultAccent: '#5E7C64',
    light: {
      canvas: '#F5F0E4',
      champagne: '#EAE0CA',
      taupe: '#D4C7AE',
      ink: '#2D2B26',
      muted: '#726C5F',
      glass: 'rgba(253, 249, 240, 0.74)',
      glassStrong: 'rgba(253, 249, 240, 0.90)',
      border: 'rgba(212, 199, 174, 0.78)',
    },
    dark: {
      canvas: '#1B1A16',
      champagne: '#26241E',
      taupe: '#39362D',
      ink: '#F3EDE0',
      muted: '#A69F90',
      glass: 'rgba(38, 36, 30, 0.76)',
      glassStrong: 'rgba(46, 43, 36, 0.92)',
      border: 'rgba(255, 255, 255, 0.09)',
    },
  },
  y2k: {
    id: 'y2k',
    name: 'Y2K',
    tagline: 'Frosted pearl & aqua chrome',
    defaultAccent: '#4B8E9C',
    light: {
      canvas: '#F2F7F8',
      champagne: '#E3EFF2',
      taupe: '#C8DCE1',
      ink: '#1E2D33',
      muted: '#5D737B',
      glass: 'rgba(255, 255, 255, 0.74)',
      glassStrong: 'rgba(255, 255, 255, 0.90)',
      border: 'rgba(200, 220, 225, 0.78)',
    },
    dark: {
      canvas: '#121A1D',
      champagne: '#1A2529',
      taupe: '#28383E',
      ink: '#ECF4F6',
      muted: '#94ABB2',
      glass: 'rgba(26, 37, 41, 0.76)',
      glassStrong: 'rgba(32, 46, 51, 0.92)',
      border: 'rgba(255, 255, 255, 0.1)',
    },
  },
};

export const ACCENT_SWATCHES = [
  { label: 'Botanical Green', value: '#788D70' },
  { label: 'Muted Sage', value: '#6E856B' },
  { label: 'Warm Oak', value: '#9B7B56' },
  { label: 'Slate Blue', value: '#5D7A99' },
  { label: 'Deep Indigo', value: '#6475B5' },
  { label: 'Soft Plum', value: '#856B8A' },
  { label: 'Sea Glass', value: '#4B8E9C' },
  { label: 'Charcoal', value: '#4B5563' },
];

export const CATEGORY_COLORS = [
  '#788D70',
  '#A8B69B',
  '#9B7B56',
  '#5D7A99',
  '#856B8A',
  '#4B8E9C',
  '#B07A6E',
  '#6E7275',
];

export function applyThemeVariables(
  presetId: ThemePresetId,
  isDark: boolean,
  accentColor: string,
  fontPreference: FontPreference
): void {
  const root = document.documentElement;
  const preset = THEME_PRESETS[presetId] || THEME_PRESETS.botanical;
  const tokens = isDark ? preset.dark : preset.light;

  root.classList.toggle('dark', isDark);

  root.style.setProperty('--nudge-canvas', tokens.canvas);
  root.style.setProperty('--nudge-champagne', tokens.champagne);
  root.style.setProperty('--nudge-taupe', tokens.taupe);
  root.style.setProperty('--nudge-ink', tokens.ink);
  root.style.setProperty('--nudge-muted', tokens.muted);
  root.style.setProperty('--nudge-glass', tokens.glass);
  root.style.setProperty('--nudge-glass-strong', tokens.glassStrong);
  root.style.setProperty('--nudge-glass-border', tokens.border);

  const effectiveAccent = accentColor || preset.defaultAccent;
  root.style.setProperty('--nudge-accent', effectiveAccent);
  root.style.setProperty('--nudge-accent-soft', `${effectiveAccent}24`);
  root.style.setProperty('--nudge-accent-ink', '#FFFFFF');

  if (fontPreference === 'sans') {
    root.style.setProperty('--nudge-font-display', "'Plus Jakarta Sans', -apple-system, sans-serif");
    root.style.setProperty('--nudge-font-body', "'Plus Jakarta Sans', -apple-system, sans-serif");
  } else if (fontPreference === 'serif') {
    root.style.setProperty('--nudge-font-display', "'Fraunces', Georgia, serif");
    root.style.setProperty('--nudge-font-body', "'Fraunces', Georgia, serif");
  } else {
    root.style.setProperty('--nudge-font-display', "'Fraunces', Georgia, serif");
    root.style.setProperty('--nudge-font-body', "'Plus Jakarta Sans', -apple-system, sans-serif");
  }
}
