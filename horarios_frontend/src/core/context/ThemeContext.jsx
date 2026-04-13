import PropTypes from 'prop-types';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const ALLOWED_THEMES = new Set(['light', 'dark', 'system']);
const ALLOWED_ACCENTS = new Set(['blue', 'red', 'green', 'purple']);

const normalizeTheme = (theme) => (ALLOWED_THEMES.has(theme) ? theme : 'light');
const normalizeAccent = (accent) => (ALLOWED_ACCENTS.has(accent) ? accent : 'blue');

const getSystemTheme = () => {
  const browserWindow = globalThis.window;

  if (!browserWindow || typeof browserWindow.matchMedia !== 'function') {
    return 'light';
  }

  return browserWindow.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const resolveTheme = (theme) => (theme === 'system' ? getSystemTheme() : theme);

export const ThemeProvider = ({ children }) => {
  const rootElement = document.documentElement;

  const [theme, setTheme] = useState(() =>
    normalizeTheme(rootElement.dataset.themeMode || rootElement.dataset.theme)
  );
  const [accent, setAccent] = useState(() => normalizeAccent(rootElement.dataset.accent));
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    resolveTheme(normalizeTheme(rootElement.dataset.themeMode || rootElement.dataset.theme))
  );

  useEffect(() => {
    setResolvedTheme(resolveTheme(theme));
  }, [theme]);

  useEffect(() => {
    const browserWindow = globalThis.window;

    if (theme !== 'system' || !browserWindow || typeof browserWindow.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = browserWindow.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (event) => {
      setResolvedTheme(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  useEffect(() => {
    rootElement.dataset.theme = resolvedTheme;
    rootElement.dataset.themeMode = theme;
    rootElement.dataset.accent = accent;
  }, [rootElement, theme, resolvedTheme, accent]);

  useEffect(() => {
    return () => {
      rootElement.dataset.theme = 'light';
      delete rootElement.dataset.themeMode;
      rootElement.dataset.accent = 'blue';
    };
  }, [rootElement]);

  const applyTheme = useCallback((nextTheme, nextAccent) => {
    setTheme(normalizeTheme(nextTheme));
    setAccent(normalizeAccent(nextAccent));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      accent,
      applyTheme,
    }),
    [theme, resolvedTheme, accent, applyTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

ThemeProvider.propTypes = {
  children: PropTypes.node,
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return context;
};
