export type ThemeMode = 'light' | 'dark';

export const appConfig = {
  title: import.meta.env.VITE_APP_TITLE ?? 'fm_tools',
  subtitle: import.meta.env.VITE_APP_SUBTITLE ?? '家庭工具箱',
  showTitle: String(import.meta.env.VITE_SHOW_TITLE ?? 'false') === 'true',
  defaultTheme: (import.meta.env.VITE_DEFAULT_THEME ?? 'dark') as ThemeMode,
  darkBg: (import.meta.env.VITE_DARK_BG ?? '#1c1c1e') as string,
  enableRegister: String(import.meta.env.VITE_ENABLE_REGISTER ?? 'false') === 'true',
};
