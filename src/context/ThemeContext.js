import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from '../constants/theme';
import * as FileSystem from 'expo-file-system';

const ThemeContext = createContext();
const THEME_FILE = FileSystem.documentDirectory + 'theme_pref.txt';

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to true initially
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load saved preference via FileSystem
    const loadTheme = async () => {
      try {
        const fileInfo = await FileSystem.getInfoAsync(THEME_FILE);
        if (fileInfo.exists) {
          const savedTheme = await FileSystem.readAsStringAsync(THEME_FILE);
          setIsDarkMode(savedTheme === 'dark');
        } else {
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch (e) {
        console.warn('Failed to load theme preference', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    const newVal = !isDarkMode;
    setIsDarkMode(newVal);
    try {
      await FileSystem.writeAsStringAsync(THEME_FILE, newVal ? 'dark' : 'light');
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  };

  const setDarkTheme = async (isDark) => {
    setIsDarkMode(isDark);
    try {
      await FileSystem.writeAsStringAsync(THEME_FILE, isDark ? 'dark' : 'light');
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  }

  const colors = isDarkMode ? darkColors : lightColors;

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setDarkTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
