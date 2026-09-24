import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && ['dark', 'light', 'cyberpunk', 'sunset'].includes(savedTheme)) {
      return savedTheme;
    }
    return 'light'; // Default to Omegle Light
  });

  const themes = [
    { id: 'dark', name: 'Slate Dark' },
    { id: 'light', name: 'Omegle Light' },
    { id: 'cyberpunk', name: 'Neon Cyber' },
    { id: 'sunset', name: 'Sunset Warm' }
  ];

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Set theme custom attribute
    root.setAttribute('data-theme', theme);
    
    // Manage class lists
    root.classList.remove('theme-dark', 'theme-light', 'theme-cyberpunk', 'theme-sunset', 'dark', 'light');
    root.classList.add(`theme-${theme}`);
    
    // Standard dark/light fallback classes for Tailwind and libraries
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.add('dark');
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Backward compatibility support for isDarkMode flag
  const isDarkMode = theme !== 'light';
  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
