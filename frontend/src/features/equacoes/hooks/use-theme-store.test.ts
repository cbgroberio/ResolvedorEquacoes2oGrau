import { beforeEach, describe, expect, it } from '@jest/globals';

import {
  applyDomTheme,
  readInitialTheme,
  THEME_STORAGE_KEY,
  useUiPreferencesStore,
} from './use-theme-store';

describe('Store Zustand de Preferências de UI (useUiPreferencesStore)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
    useUiPreferencesStore.setState({ theme: 'light', zoomFactor: 1.0 });
  });

  it('alterna entre tema claro e escuro sincronizando classe .dark e localStorage', () => {
    expect(useUiPreferencesStore.getState().theme).toBe('light');

    useUiPreferencesStore.getState().toggleTheme();
    expect(useUiPreferencesStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(readInitialTheme()).toBe('dark');

    useUiPreferencesStore.getState().toggleTheme();
    expect(useUiPreferencesStore.getState().theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    useUiPreferencesStore.getState().setTheme('dark', false);
    expect(useUiPreferencesStore.getState().theme).toBe('dark');
    applyDomTheme('light', false);
    expect(readInitialTheme()).toBe('light');
  });

  it('controla zoomIn, zoomOut e resetZoom respeitando limites', () => {
    useUiPreferencesStore.getState().zoomIn();
    expect(useUiPreferencesStore.getState().zoomFactor).toBeLessThan(1.0);

    useUiPreferencesStore.getState().resetZoom();
    expect(useUiPreferencesStore.getState().zoomFactor).toBe(1.0);

    useUiPreferencesStore.getState().zoomOut();
    expect(useUiPreferencesStore.getState().zoomFactor).toBeGreaterThan(1.0);
  });
});

