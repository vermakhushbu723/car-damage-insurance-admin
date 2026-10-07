// Local sign-in for the Admin portal (no auth backend yet). The demo
// account below is the only login; the session lives in sessionStorage
// so closing the browser tab signs out.

const SESSION_KEY = 'ibima_admin_session';

export const DEMO_ADMIN = {
    name: 'Admin',
    email: 'admin@ibima.com',
    mobile: '9876543210',
    password: 'Admin@123',
};

export function login(identifier, password) {
    const id = identifier.trim().toLowerCase().replace(/[\s-]/g, '').replace(/^\+91/, '');
    const matches = id === DEMO_ADMIN.email || id === DEMO_ADMIN.mobile;
    if (!matches || password !== DEMO_ADMIN.password) throw new Error('Invalid email/mobile number or password.');
    const session = { name: DEMO_ADMIN.name, email: DEMO_ADMIN.email, signedInAt: new Date().toISOString() };
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
        /* storage blocked -- session lasts for this page load only */
    }
    return session;
}

export function getSession() {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        const session = raw ? JSON.parse(raw) : null;
        // Sessions from the old superadmin@ demo login are no longer valid.
        return session?.email === DEMO_ADMIN.email ? session : null;
    } catch {
        return null;
    }
}

export function logout() {
    try {
        sessionStorage.removeItem(SESSION_KEY);
    } catch {
        /* ignore */
    }
}
