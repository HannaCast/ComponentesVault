import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const ALLOWED_THEMES = new Set(['light', 'dark']);
const ALLOWED_ACCENTS = new Set(['blue', 'red', 'green', 'purple']);

const normalizeTheme = (theme) => (ALLOWED_THEMES.has(theme) ? theme : 'light');
const normalizeAccent = (accent) => (ALLOWED_ACCENTS.has(accent) ? accent : 'blue');

export const ThemeProvider = ({ children }) => {
  const rootElement = document.documentElement;

  const [theme, setTheme] = useState(() => normalizeTheme(rootElement.getAttribute('data-theme')));
  const [accent, setAccent] = useState(() => normalizeAccent(rootElement.getAttribute('data-accent')));

  useEffect(() => {
    rootElement.setAttribute('data-theme', theme);
    rootElement.setAttribute('data-accent', accent);
  }, [rootElement, theme, accent]);

  useEffect(() => {
    return () => {
      rootElement.setAttribute('data-theme', 'light');
      rootElement.setAttribute('data-accent', 'blue');
    };
  }, [rootElement]);

  const applyTheme = (nextTheme, nextAccent) => {
    setTheme(normalizeTheme(nextTheme));
    setAccent(normalizeAccent(nextAccent));
  };

  const value = useMemo(() => ({ theme, accent, applyTheme }), [theme, accent]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return context;
};
