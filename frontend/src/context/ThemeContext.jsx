import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [themeColor, setThemeColor] = useState(() => {
        return localStorage.getItem('appThemeColor') || '#3b82f6';
    });

    useEffect(() => {
        localStorage.setItem('appThemeColor', themeColor);
        document.documentElement.style.setProperty('--primary-color', themeColor);
    }, [themeColor]);

    return (
        <ThemeContext.Provider value={{ themeColor, setThemeColor }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
