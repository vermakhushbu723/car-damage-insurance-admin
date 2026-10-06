import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    SEED_BRANCHES, SEED_USERS, SEED_DOCUMENT_TEMPLATES, SEED_COMM_RULES, SEED_COMM_TEMPLATES,
    SEED_CHANNELS, SEED_CONFIG, SEED_CHANGES,
} from '../data/seed';
import { SEED_ROLES } from '../data/roles';
import {
    SEED_CLAIMS, SEED_FRAUD_RULES, SEED_TRIGGERS, SEED_ROUTING, SEED_RECOMMENDATION, SEED_AUTHORITY, SEED_APPROVAL_HISTORY,
    SEED_STAGE_CONFIG, SEED_INTEGRATIONS, SEED_SYSTEM_UPDATE, SEED_COMPLIANCE, SEED_COMPLIANCE_LOG, SEED_AUDIT_EVENTS,
    SEED_DOWNLOADS, SEED_COMM_LOGS,
} from '../data/modules';
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
    claims: SEED_CLAIMS,
    fraudRules: SEED_FRAUD_RULES,
    triggers: SEED_TRIGGERS,
    routing: SEED_ROUTING,
    recommendation: SEED_RECOMMENDATION,
    authorityMatrix: SEED_AUTHORITY,
    approvalHistory: SEED_APPROVAL_HISTORY,
    stageConfig: SEED_STAGE_CONFIG,
    integrations: SEED_INTEGRATIONS,
    systemUpdate: SEED_SYSTEM_UPDATE,
    compliance: SEED_COMPLIANCE,
    complianceLog: SEED_COMPLIANCE_LOG,
    auditEvents: SEED_AUDIT_EVENTS,
    downloads: SEED_DOWNLOADS,
    commLogs: SEED_COMM_LOGS,
});

// Fields added to a seeded item later (matched by id) are filled in from the seed.
const mergeById = (seedList, savedList) => savedList.map((s) => ({ ...seedList.find((x) => x.id === s.id), ...s }));

const load = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const seed = buildSeed();
            const saved = JSON.parse(raw);
            // Keys added in later versions fall back to the seed.
            const merged = { ...seed, ...saved };
            merged.config = { ...seed.config, ...saved.config, approvalRules: mergeById(seed.config.approvalRules, saved.config?.approvalRules ?? seed.config.approvalRules) };
            return merged;
        }
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
