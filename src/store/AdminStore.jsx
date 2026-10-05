import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    SEED_BRANCHES, SEED_USERS, SEED_DOCUMENT_TEMPLATES, SEED_COMM_RULES, SEED_COMM_TEMPLATES,
    SEED_CHANNELS, SEED_CONFIG, SEED_CHANGES,
} from '../data/seed';
import { SEED_ROLES } from '../data/roles';
import { getSession } from '../auth/session';

/**
 * Whole-app data layer. There is no backend yet, so every collection lives
 * in one localStorage entry: edits on one page show up on every other page
 * (a user created in Create Users appears in User Activation, Password
 * Reset, the dashboard role counts, Roles "Users In Role", ...).
 */
const STORAGE_KEY = 'ibima_admin_data_v1';

const buildSeed = () => ({
    users: SEED_USERS,
    roles: SEED_ROLES,
    branches: SEED_BRANCHES,
    documentTemplates: SEED_DOCUMENT_TEMPLATES,
    commRules: SEED_COMM_RULES,
    commTemplates: SEED_COMM_TEMPLATES,
    channels: SEED_CHANNELS,
    config: SEED_CONFIG,
    changes: SEED_CHANGES,
});

const load = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        // Keys added in later versions fall back to the seed.
        if (raw) return { ...buildSeed(), ...JSON.parse(raw) };
    } catch {
        /* corrupt / blocked storage -- start from the seed */
    }
    return buildSeed();
};

const StoreContext = createContext(null);

let counter = Date.now();
export const newId = (prefix) => `${prefix}-${(counter++).toString(36).toUpperCase()}`;

export const AdminStoreProvider = ({ children }) => {
    const [data, setData] = useState(load);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch {
            /* quota exceeded (large profile images) -- keep working in memory */
        }
    }, [data]);

    const setKey = useCallback((key, updater) => {
        setData((prev) => ({ ...prev, [key]: typeof updater === 'function' ? updater(prev[key]) : updater }));
    }, []);

    const reset = useCallback(() => setData(buildSeed()), []);

    const value = useMemo(() => ({ data, setKey, reset }), [data, setKey, reset]);
    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

const useStore = () => {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error('useStore must be used inside <AdminStoreProvider>');
    return ctx;
};

/** List collection: { items, add, update, updateMany, remove, setAll }. New items go on top. */
export function useCollection(key) {
    const { data, setKey } = useStore();
    const add = useCallback((item) => setKey(key, (list) => [item, ...list]), [key, setKey]);
    const update = useCallback((id, patch) => setKey(key, (list) => list.map((it) => (it.id === id ? { ...it, ...(typeof patch === 'function' ? patch(it) : patch) } : it))), [key, setKey]);
    const updateMany = useCallback((ids, patch) => setKey(key, (list) => list.map((it) => (ids.includes(it.id) ? { ...it, ...patch } : it))), [key, setKey]);
    const remove = useCallback((id) => setKey(key, (list) => list.filter((it) => it.id !== id)), [key, setKey]);
    const setAll = useCallback((updater) => setKey(key, updater), [key, setKey]);
    return { items: data[key], add, update, updateMany, remove, setAll };
}

/** Object value, e.g. the dashboard `config`. */
export function useStoreValue(key) {
    const { data, setKey } = useStore();
    const set = useCallback((updater) => setKey(key, updater), [key, setKey]);
    return [data[key], set];
}

/** Roles with helpers: byKey lookup + level ordering. */
export function useRoles() {
    const { items, add, update } = useCollection('roles');
    return useMemo(() => ({
        list: items,
        byKey: Object.fromEntries(items.map((r) => [r.key, r])),
        add,
        update,
    }), [items, add, update]);
}

/**
 * Records a configuration / admin change -- feeds "Recent Configuration
 * Changes" on the dashboard and the notification bell.
 */
export function useLogChange() {
    const { setKey } = useStore();
    return useCallback((module, change, oldValue, newValue) => {
        const entry = {
            id: newId('CHG'),
            changedBy: getSession()?.name ?? 'Super Admin',
            module,
            change,
            oldValue: String(oldValue ?? '—'),
            newValue: String(newValue ?? '—'),
            changedOn: new Date().toISOString(),
        };
        setKey('changes', (list) => [entry, ...list]);
    }, [setKey]);
}

export function useResetData() {
    return useStore().reset;
}
