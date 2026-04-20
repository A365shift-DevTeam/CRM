const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5231/api';

// ── Auth token is stored in an httpOnly cookie set by the backend.
// ── These helpers only manage the non-sensitive user profile in localStorage.

/** @deprecated Token lives in httpOnly cookie — no longer stored in JS. No-op kept for call-site compatibility. */
export function setToken(_token) {
    // intentional no-op: token is written by the server as an httpOnly cookie
}

export function clearToken() {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_login_timestamp');
    // The actual cookie is cleared by calling POST /auth/logout (server deletes it)
}

export function getStoredUser() {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user) {
    localStorage.setItem('auth_user', JSON.stringify(user));
}

async function request(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // send the httpOnly auth_token cookie automatically
    });

    // Handle 401 — cookie expired or missing
    // Skip this global redirect for /auth routes so the login form can show the error instead of reloading.
    if (res.status === 401 && !endpoint.startsWith('/auth')) {
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
    get:    (endpoint)        => request(endpoint, { method: 'GET' }),
    post:   (endpoint, body)  => request(endpoint, { method: 'POST',   body: JSON.stringify(body) }),
    put:    (endpoint, body)  => request(endpoint, { method: 'PUT',    body: JSON.stringify(body) }),
    patch:  (endpoint, body)  => request(endpoint, { method: 'PATCH',  body: JSON.stringify(body) }),
    delete: (endpoint)        => request(endpoint, { method: 'DELETE' }),
};
