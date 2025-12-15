import { defineStore } from 'pinia';
import type { ThemeMode } from '../config';
import { appConfig } from '../config';

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.style.setProperty('--dark-bg', appConfig.darkBg);
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useThemeStore = defineStore('theme', {
  state: () => ({ mode: (localStorage.getItem('theme') as ThemeMode) || appConfig.defaultTheme }),
  actions: {
    init() { applyTheme(this.mode); },
    toggle() { this.mode = this.mode === 'dark' ? 'light' : 'dark'; localStorage.setItem('theme', this.mode); applyTheme(this.mode); },
    set(mode: ThemeMode) { this.mode = mode; localStorage.setItem('theme', mode); applyTheme(mode); },
  }
});
