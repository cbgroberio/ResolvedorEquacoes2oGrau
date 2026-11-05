import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'equacoes_theme';

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 4.0;
const ZOOM_IN_FACTOR = 0.78;
const ZOOM_OUT_FACTOR = 1.28;

export type UiPreferencesState = {
  readonly theme: ThemeMode;
  readonly zoomFactor: number;
  readonly setTheme: (theme: ThemeMode, persist?: boolean) => void;
  readonly toggleTheme: () => void;
  readonly zoomIn: () => void;
  readonly zoomOut: () => void;
  readonly resetZoom: () => void;
};

export function readInitialTheme(): ThemeMode {
  if (typeof document === 'undefined') {
    return 'light';
  }

  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    /* localStorage indisponível no ambiente atual */
  }

  if (document.documentElement.classList.contains('dark')) {
    return 'dark';
  }

  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark') {
    return 'dark';
  }

  return 'light';
}

export function applyDomTheme(theme: ThemeMode, persist = false): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }

  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* Ignorado quando localStorage está bloqueado */
    }
  }
}

export const useUiPreferencesStore = create<UiPreferencesState>((set, get) => ({
  theme: readInitialTheme(),
  zoomFactor: 1.0,
  setTheme: (theme, persist = true) => {
    applyDomTheme(theme, persist);
    set({ theme });
  },
  toggleTheme: () => {
    let nextTheme: ThemeMode = 'dark';
    if (get().theme === 'dark') {
      nextTheme = 'light';
    }
    applyDomTheme(nextTheme, true);
    set({ theme: nextTheme });
  },
  zoomIn: () => {
    const nextZoom = Math.max(MIN_ZOOM, get().zoomFactor * ZOOM_IN_FACTOR);
    set({ zoomFactor: nextZoom });
  },
  zoomOut: () => {
    const nextZoom = Math.min(MAX_ZOOM, get().zoomFactor * ZOOM_OUT_FACTOR);
    set({ zoomFactor: nextZoom });
  },
  resetZoom: () => {
    set({ zoomFactor: 1.0 });
  },
}));

