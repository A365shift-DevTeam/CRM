/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, setToken, clearToken, getStoredUser, setStoredUser } from '../services/apiClient';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore user from localStorage on mount
    useEffect(() => {
        const stored = getStoredUser();
        const loginTime = localStorage.getItem('auth_login_timestamp');
        const ONE_HOUR = 60 * 60 * 1000;

        if (stored && loginTime && (Date.now() - parseInt(loginTime) <= ONE_HOUR)) {
            setCurrentUser(stored);
        } else if (stored) {
            console.log('Session expired, clearing stored auth.');
            clearToken();
            setCurrentUser(null);
        }
        setLoading(false);
    }, []);

    async function signup(email, password, displayName) {
        const data = await apiClient.post('/auth/register', { email, password, displayName });
        setToken(data.token);
        const user = {
            id: data.id,
            email: data.email,
            displayName: data.displayName,
            role: data.role,
            permissions: data.permissions || []
        };
        setStoredUser(user);
        localStorage.setItem('auth_login_timestamp', Date.now().toString());
        setCurrentUser(user);
        return user;
    }

    async function login(email, password) {
        const data = await apiClient.post('/auth/login', { email, password });
        setToken(data.token);
        const user = {
            id: data.id,
            email: data.email,
            displayName: data.displayName,
            role: data.role,
            permissions: data.permissions || []
        };
        setStoredUser(user);
        localStorage.setItem('auth_login_timestamp', Date.now().toString());
        setCurrentUser(user);
        return user;
    }

    function logout() {
        clearToken();
        setCurrentUser(null);
    }

    // Permission helpers
    function hasPermission(code) {
        if (!currentUser) return false;
        if (currentUser.role === 'Admin') return true;
        return currentUser.permissions?.includes(code) || false;
    }

    function hasAnyPermission(codes) {
        if (!currentUser) return false;
        if (currentUser.role === 'Admin') return true;
        return codes.some(code => currentUser.permissions?.includes(code));
    }

    function hasRole(roleName) {
        return currentUser?.role === roleName;
    }

    function isAdmin() {
        return currentUser?.role === 'Admin';
    }

    // Periodic check for expiration (every minute)
    useEffect(() => {
        const interval = setInterval(() => {
            const loginTime = localStorage.getItem('auth_login_timestamp');
            if (!loginTime) return;
            const ONE_HOUR = 60 * 60 * 1000;
            if (Date.now() - parseInt(loginTime) > ONE_HOUR) {
                console.log('Session expired (periodic check), logging out.');
                logout();
            }
        }, 60000);

        return () => clearInterval(interval);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const value = {
        currentUser,
        signup,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
        hasRole,
        isAdmin
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
