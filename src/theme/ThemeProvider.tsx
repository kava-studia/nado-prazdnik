import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // 1. Run key migrations from old schemas
    const old1 = localStorage.getItem('evently_theme') as Theme;
    const old2 = localStorage.getItem('nado_holiday_theme') as Theme;
    const current = localStorage.getItem('nado_prazdnik_theme') as Theme;

    if (current === 'light' || current === 'dark' || current === 'system') {
      return current;
    }

    const migrated = old2 || old1;
    if (migrated === 'light' || migrated === 'dark' || migrated === 'system') {
      localStorage.setItem('nado_prazdnik_theme', migrated);
      return migrated;
    }

    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('nado_prazdnik_theme', newTheme);
  };

  const toggleTheme = () => {
    if (theme === 'system') {
      // Toggle to the opposite of the currently active resolved theme
      const currentResolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const opposite = currentResolved === 'dark' ? 'light' : 'dark';
      setTheme(opposite);
    } else {
      const opposite = theme === 'dark' ? 'light' : 'dark';
      setTheme(opposite);
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;

    const updateTheme = () => {
      let activeTheme: 'light' | 'dark' = 'light';
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        activeTheme = systemTheme;
      } else {
        activeTheme = theme;
      }

      setResolvedTheme(activeTheme);

      // Set class and data-theme
      if (activeTheme === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
        root.style.colorScheme = 'light';
      }
    };

    updateTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => updateTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
