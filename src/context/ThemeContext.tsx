import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'night' | 'day';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('tunefinder-theme');
    if (saved === 'day' || saved === 'day-mode') return 'day';
    return 'night';
  });

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'night' ? 'day' : 'night';
    setThemeState(newTheme);
    localStorage.setItem('tunefinder-theme', newTheme);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('tunefinder-theme', newTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('deep-space', 'night-mode', 'day-mode');
    root.classList.add(theme === 'day' ? 'day-mode' : 'night-mode');
    root.setAttribute('data-theme', theme);

    if (theme === 'day') {
      root.style.setProperty('--bg-primary', '#F8FAFC');
      root.style.setProperty('--bg-secondary', '#FFFFFF');
      root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.85)');
      root.style.setProperty('--glass-border', 'rgba(15, 23, 42, 0.08)');
      root.style.setProperty('--text-main', '#0F172A');
      root.style.setProperty('--text-sub', '#475569');
      root.style.setProperty('--text-muted', '#64748B');
      root.style.setProperty('--card-bg', '#FFFFFF');
      root.style.setProperty('--card-border', 'rgba(226, 232, 240, 0.9)');
      root.style.setProperty('--subtle-btn-bg', 'rgba(0, 0, 0, 0.05)');
      root.style.setProperty('--subtle-btn-hover', 'rgba(0, 0, 0, 0.09)');
      root.style.setProperty('--subtle-btn-border', 'rgba(0, 0, 0, 0.08)');
      root.style.setProperty('--subtle-btn-text', '#0F172A');
      root.style.setProperty('--input-bg', '#FFFFFF');
      root.style.setProperty('--glow-opacity', '0.07');
    } else {
      root.style.setProperty('--bg-primary', '#09090F');
      root.style.setProperty('--bg-secondary', '#12121B');
      root.style.setProperty('--glass-bg', 'rgba(25, 25, 37, 0.7)');
      root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--text-main', '#FFFFFF');
      root.style.setProperty('--text-sub', 'rgba(255, 255, 255, 0.65)');
      root.style.setProperty('--text-muted', 'rgba(255, 255, 255, 0.4)');
      root.style.setProperty('--card-bg', 'rgba(25, 25, 37, 0.7)');
      root.style.setProperty('--card-border', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--subtle-btn-bg', 'rgba(255, 255, 255, 0.05)');
      root.style.setProperty('--subtle-btn-hover', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--subtle-btn-border', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--subtle-btn-text', '#FFFFFF');
      root.style.setProperty('--input-bg', 'rgba(25, 25, 37, 0.7)');
      root.style.setProperty('--glow-opacity', '0.15');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
