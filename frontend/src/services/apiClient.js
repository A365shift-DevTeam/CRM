const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5231/api';

function getToken() {
    return localStorage.getItem('auth_token');
}

export function setToken(token) {
    localStorage.setItem('auth_token', token);
}

export function clearToken() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_login_timestamp');
}

export function getStoredUser() {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user) {
    localStorage.setItem('auth_user', JSON.stringify(user));
}

async function request(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // Handle 401 - token expired
    if (res.status === 401) {
        clearToken();
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
    }

    // Safely parse JSON — handle non-JSON responses (e.g., 502 HTML error pages)
    let json;
    try {
        json = await res.json();
    } catch {
        throw new Error(`Request failed (${res.status})`);
    }

    if (!res.ok || json.success === false) {
        let msg = json.message;
        if (!msg && json.errors) {
            if (Array.isArray(json.errors)) {
                msg = json.errors.join(', ');
            } else if (typeof json.errors === 'object') {
                msg = Object.values(json.errors).flat().join(', ');
            }
        }
        msg = msg || json.title || `Request failed (${res.status})`;
        throw new Error(msg);
    }

    return json.data;
}

export const apiClient = {
    get: (endpoint) => request(endpoint, { method: 'GET' }),
    post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};
