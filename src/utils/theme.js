const THEME_KEY = 'theme';
const DARK_MODE_KEY = 'darkMode';
import { scheduleSettingsSync } from '../api/settingsApi';

export const THEMES = [
  { key: 'default', label: '默认', icon: 'fa-circle' },
  { key: 'glass', label: '液态玻璃', icon: 'fa-gem' },
];

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'default';
}

export function getDarkMode() {
  const stored = localStorage.getItem(DARK_MODE_KEY);
  if (stored !== null) return stored === 'true';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  const darkMode = getDarkMode();
  applyTheme(theme, darkMode);
  applyBackground(theme, darkMode);
  scheduleSettingsSync();
}

export function setDarkMode(dark) {
  localStorage.setItem(DARK_MODE_KEY, dark);
  const theme = getTheme();
  applyTheme(theme, dark);
  applyBackground(theme, dark);
}

export function toggleDarkMode() {
  const next = !getDarkMode();
  setDarkMode(next);
  return next;
}

export function applyTheme(theme, darkMode) {
  const root = document.documentElement;

  if (darkMode) {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }

  if (theme === 'glass') {
    root.setAttribute('data-theme', 'glass');
  } else {
    root.removeAttribute('data-theme');
  }
}

export function getThemeBackground(theme) {
  return localStorage.getItem(`background_${theme}`) || '';
}

export function setThemeBackground(theme, value) {
  if (value) {
    localStorage.setItem(`background_${theme}`, value);
  } else {
    localStorage.removeItem(`background_${theme}`);
  }
  scheduleSettingsSync();
}

export function getThemeBackgroundImage(theme) {
  return localStorage.getItem(`backgroundImage_${theme}`) || '';
}

export function setThemeBackgroundImage(theme, value) {
  if (value) {
    localStorage.setItem(`backgroundImage_${theme}`, value);
  } else {
    localStorage.removeItem(`backgroundImage_${theme}`);
  }
  scheduleSettingsSync();
}

export function applyBackground(theme, darkMode) {
  document.body.style.cssText = [
    'margin: 0',
    'height: 100%',
  ].join('; ');

  if (darkMode) return;

  const bg = getThemeBackground(theme);
  const bgImage = getThemeBackgroundImage(theme);

  if (bg) {
    if (bg.startsWith('linear-gradient')) {
      document.body.style.background = bg;
    } else {
      document.body.style.backgroundColor = bg;
    }
    document.body.style.backgroundAttachment = 'fixed';
  } else if (bgImage) {
    document.body.style.backgroundImage = `url('${bgImage}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
  }
}
