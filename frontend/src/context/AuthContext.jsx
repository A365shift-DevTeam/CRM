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

    function buildUserProfile(data) {
        return {
            id: data.id,
            email: data.email,
            displayName: data.displayName,
            role: data.role,
            permissions: data.permissions || [],
            isTotpEnabled: data.isTotpEnabled || false,
            twoFactorRequired: data.twoFactorRequired || false,
            twoFactorMethod: data.twoFactorMethod || 'email',
            totpSetupRequired: data.totpSetupRequired || false,
        };
    }

    async function signup(email, password, displayName) {
        const data = await apiClient.post('/auth/register', { email, password, displayName });
        const user = buildUserProfile(data);
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

        const user = buildUserProfile(data);
        setStoredUser(user);
        setCurrentUser(user);
        return { requires2FA: false, user };
    }

    async function completeLogin(loginResponse) {
        const user = buildUserProfile(loginResponse);
        setStoredUser(user);
        setCurrentUser(user);
    }

    function updateCurrentUser(patch) {
        setCurrentUser(prev => {
            const updated = { ...prev, ...patch };
            setStoredUser(updated);
            return updated;
        });
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
        updateCurrentUser,
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
