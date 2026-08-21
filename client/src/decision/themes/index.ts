import { ThemeDefinition } from './types';
import { ClassicTheme } from './ClassicTheme';
import { ModernTheme } from './ModernTheme';

export const THEMES: Record<string, ThemeDefinition> = {
  [ClassicTheme.id]: ClassicTheme,
  [ModernTheme.id]: ModernTheme,
};

export const DEFAULT_THEME_ID = ClassicTheme.id;

export const getTheme = (id: string): ThemeDefinition => {
  return THEMES[id] || THEMES[DEFAULT_THEME_ID];
};