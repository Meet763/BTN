import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ConfigProvider, theme as antTheme } from 'antd';
const ThemeContext = createContext(undefined);
export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('btn-theme');
        return savedTheme || 'light';
    });
    useEffect(() => {
        localStorage.setItem('btn-theme', theme);
        const root = window.document.documentElement;
        root.setAttribute('data-theme', theme);
    }, [theme]);
    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };
    return (_jsx(ThemeContext.Provider, { value: { theme, toggleTheme }, children: _jsx(ConfigProvider, { theme: {
                algorithm: theme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
                token: {
                    fontFamily: "'Inter', sans-serif",
                    borderRadius: 8,
                    colorPrimary: '#1677ff',
                },
            }, children: children }) }));
};
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
