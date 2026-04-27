/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, clearToken, getStoredUser, setStoredUser } from '../services/apiClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = getStoredUser();
        if (stored) setCurrentUser(stored);
        setLoading(false);
    }, []);

    function buildUserProfile(data) {
        return {
            id: data.id,
            email: data.email,
            displayName: data.displayName,
            role: data.role,                         // SUPER_ADMIN | ORG_ADMIN | MANAGER | EMPLOYEE
            permissions: data.permissions || [],
            isTotpEnabled: data.isTotpEnabled || false,
            twoFactorRequired: data.twoFactorRequired || false,
            twoFactorMethod: data.twoFactorMethod || 'email',
            totpSetupRequired: data.totpSetupRequired || false,
            orgId: data.orgId || null,
            orgStatus: data.orgStatus || null,       // TRIAL | ACTIVE | SUSPENDED
            isFirstLogin: data.isFirstLogin || false,
        };
    }

    async function login(email, password) {
        const data = await apiClient.post('/auth/login', { email, password });

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

    async function resetFirstPassword(newPassword) {
        await apiClient.post('/auth/reset-first-password', { newPassword });
        const updated = { ...currentUser, isFirstLogin: false };
        setStoredUser(updated);
        setCurrentUser(updated);
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
            await apiClient.post('/auth/logout', {});
        } catch {
            // ignore
        }
        clearToken();
        setCurrentUser(null);
    }

    // Role helpers
    function isSuperAdmin() { return currentUser?.role === 'SUPER_ADMIN'; }
    function isOrgAdmin() { return currentUser?.role === 'ORG_ADMIN'; }
    function isManager() { return currentUser?.role === 'MANAGER'; }
    function isEmployee() { return currentUser?.role === 'EMPLOYEE'; }

    function isOrgAdminOrAbove() {
        return ['SUPER_ADMIN', 'ORG_ADMIN'].includes(currentUser?.role);
    }

    function isManagerOrAbove() {
        return ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER'].includes(currentUser?.role);
    }

    // Permission helpers
    function hasPermission(code) {
        if (!currentUser) return false;
        if (isSuperAdmin() || isOrgAdmin()) return true;
        return currentUser.permissions?.includes(code) || false;
    }

    function hasAnyPermission(codes) {
        if (!currentUser) return false;
        if (isSuperAdmin() || isOrgAdmin()) return true;
        return codes.some(code => currentUser.permissions?.includes(code));
    }

    function hasRole(roleName) {
        return currentUser?.role === roleName;
    }

    // Keep legacy isAdmin() for compatibility — maps to OrgAdmin or above
    function isAdmin() { return isOrgAdminOrAbove(); }

    const value = {
        currentUser,
        login,
        completeLogin,
        resetFirstPassword,
        updateCurrentUser,
        logout,
        hasPermission,
        hasAnyPermission,
        hasRole,
        isAdmin,
        isSuperAdmin,
        isOrgAdmin,
        isManager,
        isEmployee,
        isOrgAdminOrAbove,
        isManagerOrAbove,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
