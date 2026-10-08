import { api } from '../api/client';

// Signed-in admin session: the API token plus who is signed in (from
// POST /api/v1/auth/login on admin-service). Kept in localStorage so a
// reload keeps you signed in until the token expires.

const SESSION_KEY = 'ibima_admin_session_v2';

// The pre-backend demo session and sample data; never valid again.
try {
    sessionStorage.removeItem('ibima_admin_session');
    localStorage.removeItem('ibima_admin_data_v1');
} catch {
    /* storage blocked */
}

function save({ token, expiresIn, admin }) {
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ token, admin, expiresAt: Date.now() + (expiresIn ?? 0) * 1000 }));
    } catch {
        /* storage blocked -- session lasts for this page load only */
    }
}

/** Signs in with email or mobile number; throws ApiError with the server's reason. */
export async function login(identifier, password) {
    const data = await api.post('/auth/login', { identifier: identifier.trim(), password }, { auth: false });
    save(data);
    return getSession();
}

function readStored() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        const s = raw ? JSON.parse(raw) : null;
        return s?.token && s.expiresAt > Date.now() ? s : null;
    } catch {
        return null;
    }
}

/** { name, email, organization, ... } of the signed-in admin, or null. */
export function getSession() {
    const s = readStored();
    return s ? { ...s.admin, signedInAt: s.admin?.lastLoginAt } : null;
}

export const getToken = () => readStored()?.token ?? null;

export function clearSession() {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch {
        /* ignore */
    }
}

/** Ends the session on the server (recorded in Audit Logs) and locally. */
export function logout() {
    if (getToken()) api.post('/auth/logout').catch(() => {});
    clearSession();
}

/** The insurer this portal belongs to (Internal users / branches). */
export const organizationName = () => getSession()?.organization ?? '';
