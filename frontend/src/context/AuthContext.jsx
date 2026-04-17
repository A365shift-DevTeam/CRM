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

    // Restore user profile from localStorage on mount.
    // The actual session validity is enforced by the httpOnly cookie + JWT on the server.
    useEffect(() => {
        const stored = getStoredUser();
        if (stored) {
            setCurrentUser(stored);
        }
        setLoading(false);
    }, []);

    async function signup(email, password, displayName) {
        const data = await apiClient.post('/auth/register', { email, password, displayName });
        // Token is set as httpOnly cookie by the server — not stored in JS
        const user = {
            id: data.id,
            email: data.email,
            displayName: data.displayName,
            role: data.role,
            permissions: data.permissions || [],
            isTotpEnabled: data.isTotpEnabled || false
        };
        setStoredUser(user);
        setCurrentUser(user);
        return user;
    }

    async function login(email, password) {
        const data = await apiClient.post('/auth/login', { email, password });

        // 2FA required — return the challenge info, don't set user yet
        if (data.requires2FA) {
            return { requires2FA: true, method: data.twoFactorMethod, partialToken: data.partialToken };
        }

        // Token is set as httpOnly cookie by the server — not stored in JS
        const user = {
            id: data.id,
            email: data.email,
            displayName: data.displayName,
            role: data.role,
            permissions: data.permissions || [],
            isTotpEnabled: data.isTotpEnabled || false
        };
        setStoredUser(user);
        setCurrentUser(user);
        return { requires2FA: false, user };
    }

    async function completeLogin(loginResponse) {
        const user = {
            id: loginResponse.id,
            email: loginResponse.email,
            displayName: loginResponse.displayName,
            role: loginResponse.role,
            permissions: loginResponse.permissions || [],
            isTotpEnabled: loginResponse.isTotpEnabled || false
        };
        setStoredUser(user);
        setCurrentUser(user);
    }

    async function logout() {
        try {
            // Ask the server to delete the httpOnly cookie
            await apiClient.post('/auth/logout', {});
        } catch {
            // Ignore errors — clear local state regardless
        }
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

    // Session expiry is now managed by the httpOnly cookie TTL on the server.
    // A 401 from any API call will redirect to /login via apiClient.js.

    const value = {
        currentUser,
        signup,
        login,
        completeLogin,
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
