import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de un CustomThemeProvider');
  }
  return context;
};

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff6f8b',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: '12px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
      light: '#e3f2fd',
      dark: '#42a5f5',
    },
    secondary: {
      main: '#f48fb1',
      light: '#fce4ec',
      dark: '#f06292',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          borderRadius: '12px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
        },
      },
    },
  },
});

export const CustomThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme-mode');
    if (saved) {
      return saved === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [accessibility, setAccessibility] = useState(() => {
    const saved = localStorage.getItem('accessibility-settings');
    return saved ? JSON.parse(saved) : {
      fontSize: 'medium',
      highContrast: false,
      reducedMotion: false,
      screenReader: false,
    };
  });

  useEffect(() => {
    localStorage.setItem('theme-mode', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('accessibility-settings', JSON.stringify(accessibility));
  }, [isDarkMode, accessibility]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const updateAccessibility = (newSettings) => {
    setAccessibility(prev => ({ ...prev, ...newSettings }));
  };

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  // Aplicar configuraciones de accesibilidad
  const accessibleTheme = createTheme({
    ...currentTheme,
    typography: {
      ...currentTheme.typography,
      fontSize: accessibility.fontSize === 'large' ? 16 : 
                accessibility.fontSize === 'small' ? 12 : 14,
    },
    palette: {
      ...currentTheme.palette,
      ...(accessibility.highContrast && {
        primary: { main: isDarkMode ? '#ffffff' : '#000000' },
        text: {
          primary: isDarkMode ? '#ffffff' : '#000000',
          secondary: isDarkMode ? '#cccccc' : '#333333',
        },
      }),
    },
    transitions: {
      ...currentTheme.transitions,
      ...(accessibility.reducedMotion && {
        create: () => 'none',
      }),
    },
  });

  const value = {
    isDarkMode,
    toggleTheme,
    accessibility,
    updateAccessibility,
    theme: accessibleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={accessibleTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export default CustomThemeProvider;