import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { App } from 'antd';
import { api } from '../api/client';
import { getToken } from '../auth/session';

/**
 * Whole-app data layer -- everything lives in the database of admin-service
 * (ai-damage-assessment-service/admin-service). After sign-in every
 * collection is loaded once and kept in memory; the hooks below keep the
 * same shape the pages always used, but each change is saved through the
 * API first-hand: the screen updates at once, the server's answer replaces
 * it, and a refused change is rolled back with the server's reason shown.
 */

const crud = (path, extra = {}) => ({
    load: () => api.get(path),
    create: (item) => api.post(path, item),
    update: (id, patch) => api.patch(`${path}/${encodeURIComponent(id)}`, patch),
    remove: (id) => api.del(`${path}/${encodeURIComponent(id)}`),
    ...extra,
});
const readOnly = (path) => ({ load: () => api.get(path) });

const COLLECTIONS = {
    users: crud('/users', {
        updateMany: async (ids, patch) => {
            if (Object.keys(patch).length === 1 && 'status' in patch) return (await api.post('/users/bulk-status', { ids, status: patch.status })).users;
            return Promise.all(ids.map((id) => api.patch(`/users/${encodeURIComponent(id)}`, patch)));
        },
    }),
    roles: crud('/roles', { idKey: 'key' }),
    branches: crud('/branches'),
    documentTemplates: crud('/document-templates'),
    commRules: crud('/comm-rules'),
    commTemplates: crud('/comm-templates'),
    channels: crud('/channels'),
    commLogs: readOnly('/comm-logs'),
    fraudRules: crud('/fraud-rules'),
    triggers: crud('/triggers'),
    authorityMatrix: crud('/authority-matrix'),
    approvalHistory: crud('/approval-history'),
    integrations: crud('/integrations'),
    complianceLog: crud('/compliance-log'),
    claims: readOnly('/claims'),
    changes: { load: () => api.get('/changes'), create: (c) => api.post('/changes', c) },
    auditEvents: readOnly('/audit-logs'),
    downloads: readOnly('/downloads'),
};
// Single documents, all from GET /settings; saved with PUT /settings/:key.
const VALUE_KEYS = ['config', 'routing', 'recommendation', 'stageConfig', 'systemUpdate', 'compliance'];
// Measured activity for SaaS Usage / User Report.
const EXTRA_VALUES = { usage: () => api.get('/reports/usage') };

const idOf = (key, item) => item?.[COLLECTIONS[key]?.idKey ?? 'id'];
// Fields the server owns -- never sent back in a PATCH.
const SERVER_FIELDS = ['createdAt', 'updatedAt', 'id', 'key', 'users', 'isSystem', 'mustChangePassword', 'passwordResetAt', 'lastResetLinkAt', 'hasApiKey', 'sentToday'];

/** Changed fields; a field dropped from the item is sent as null (cleared). */
const diff = (before, after) => {
    const out = Object.fromEntries(Object.entries(after)
        .filter(([k, v]) => !SERVER_FIELDS.includes(k) && JSON.stringify(v) !== JSON.stringify(before?.[k])));
    for (const k of Object.keys(before ?? {})) if (!(k in after) && !SERVER_FIELDS.includes(k) && before[k] != null) out[k] = null;
    return out;
};

const StoreContext = createContext(null);

let counter = Date.now();
/** Client id for a new item (the API keeps it, so the item can be used straight away). */
export const newId = (prefix) => `${prefix}-${(counter++).toString(36).toUpperCase()}`;

export const AdminStoreProvider = ({ children }) => {
    const { message } = App.useApp();
    const [data, setData] = useState({});
    const [status, setStatus] = useState({ loaded: false, loading: false, error: null });
    const dataRef = useRef(data);
    useLayoutEffect(() => { dataRef.current = data; }, [data]);

    const setKey = useCallback((key, updater) => {
        setData((prev) => ({ ...prev, [key]: typeof updater === 'function' ? updater(prev[key]) : updater }));
    }, []);

    const fail = useCallback((err) => {
        message.error(err?.message || 'Could not save the change.');
    }, [message]);

    /** Loads everything (or only `keys`) from the API. */
    const reload = useCallback(async (keys) => {
        if (!getToken()) return;
        const wanted = keys ?? [...Object.keys(COLLECTIONS), 'settings', ...Object.keys(EXTRA_VALUES)];
        if (!keys) setStatus((s) => ({ ...s, loading: true, error: null }));
        try {
            const results = await Promise.all(wanted.map(async (k) => {
                if (k === 'settings' || VALUE_KEYS.includes(k)) return ['settings', await api.get('/settings')];
                if (EXTRA_VALUES[k]) return [k, await EXTRA_VALUES[k]()];
                return [k, await COLLECTIONS[k].load()];
            }));
            setData((prev) => {
                const next = { ...prev };
                for (const [k, v] of results) {
                    if (k === 'settings') VALUE_KEYS.forEach((vk) => { next[vk] = v[vk]; });
                    else next[k] = v;
                }
                return next;
            });
            if (!keys) setStatus({ loaded: true, loading: false, error: null });
        } catch (err) {
            if (!keys) setStatus({ loaded: false, loading: false, error: err.message });
            else fail(err);
        }
    }, [fail]);

    const clear = useCallback(() => {
        setData({});
        setStatus({ loaded: false, loading: false, error: null });
    }, []);

    const value = useMemo(() => ({ data, dataRef, setKey, reload, clear, status, fail }), [data, setKey, reload, clear, status, fail]);
    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

const useStore = () => {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error('useStore must be used inside <AdminStoreProvider>');
    return ctx;
};

/** Loads all data once after sign-in; { loaded, loading, error, retry }. */
export function useDataStatus() {
    const { status, reload } = useStore();
    useEffect(() => {
        if (!status.loaded && !status.loading && !status.error) reload();
    }, [status, reload]);
    return { ...status, retry: () => reload() };
}

/** Re-fetch some keys, e.g. useReload()(['users', 'claims']) after a server-side change. */
export function useReload() {
    return useStore().reload;
}

/** Forget all data (sign-out). */
export function useClearData() {
    return useStore().clear;
}

/**
 * List collection: { items, add, update, updateMany, remove, setAll }. New
 * items go on top. Every mutation returns a Promise of the saved item
 * (null when the server refused it -- the reason is shown and the change undone).
 */
export function useCollection(key) {
    const { data, dataRef, setKey, fail } = useStore();
    const def = COLLECTIONS[key];
    const items = data[key] ?? [];

    const replace = useCallback((id, saved) => setKey(key, (list = []) => list.map((it) => (idOf(key, it) === id ? saved : it))), [key, setKey]);

    const add = useCallback(async (item) => {
        const tempId = idOf(key, item);
        setKey(key, (list = []) => [item, ...list]);
        try {
            const saved = await def.create(item);
            setKey(key, (list = []) => list.map((it) => (it === item || (tempId && idOf(key, it) === tempId) ? saved : it)));
            return saved;
        } catch (err) {
            setKey(key, (list = []) => list.filter((it) => it !== item));
            fail(err);
            return null;
        }
    }, [key, def, setKey, fail]);

    const update = useCallback(async (id, patch) => {
        const before = (dataRef.current[key] ?? []).find((it) => idOf(key, it) === id);
        if (!before) return null;
        const after = { ...before, ...(typeof patch === 'function' ? patch(before) : patch) };
        const changes = diff(before, after);
        if (!Object.keys(changes).length) return before;
        replace(id, after);
        try {
            const saved = await def.update(id, changes);
            replace(id, saved);
            return saved;
        } catch (err) {
            replace(id, before);
            fail(err);
            return null;
        }
    }, [key, def, dataRef, replace, fail]);

    const updateMany = useCallback(async (ids, patch) => {
        const before = dataRef.current[key] ?? [];
        setKey(key, (list = []) => list.map((it) => (ids.includes(idOf(key, it)) ? { ...it, ...patch } : it)));
        try {
            const saved = def.updateMany ? await def.updateMany(ids, patch) : await Promise.all(ids.map((id) => def.update(id, patch)));
            const byId = Object.fromEntries(saved.map((s) => [idOf(key, s), s]));
            setKey(key, (list = []) => list.map((it) => byId[idOf(key, it)] ?? it));
            return saved;
        } catch (err) {
            setKey(key, before);
            fail(err);
            return null;
        }
    }, [key, def, dataRef, setKey, fail]);

    const remove = useCallback(async (id) => {
        const before = dataRef.current[key] ?? [];
        setKey(key, (list = []) => list.filter((it) => idOf(key, it) !== id));
        try {
            await def.remove(id);
            return true;
        } catch (err) {
            setKey(key, before);
            fail(err);
            return null;
        }
    }, [key, def, dataRef, setKey, fail]);

    /** Replace the whole list: added items are created, missing ones deleted, changed ones patched. */
    const setAll = useCallback(async (updater) => {
        const before = dataRef.current[key] ?? [];
        const after = typeof updater === 'function' ? updater(before) : updater;
        setKey(key, after);
        const oldById = Object.fromEntries(before.map((it) => [idOf(key, it), it]));
        const newIds = new Set(after.map((it) => idOf(key, it)));
        try {
            const saved = [];
            for (const it of after) {
                const old = oldById[idOf(key, it)];
                if (!old) saved.push(await def.create(it));
                else {
                    const changes = diff(old, it);
                    saved.push(Object.keys(changes).length ? await def.update(idOf(key, it), changes) : old);
                }
            }
            for (const it of before) if (!newIds.has(idOf(key, it))) await def.remove(idOf(key, it));
            setKey(key, saved);
            return saved;
        } catch (err) {
            fail(err);
            // Partly saved -- show what the server now has.
            try {
                setKey(key, await def.load());
            } catch {
                setKey(key, before);
            }
            return null;
        }
    }, [key, def, dataRef, setKey, fail]);

    return { items, add, update, updateMany, remove, setAll };
}

/** Configuration document, e.g. the dashboard `config`: [value, set(updater)] -- saved with PUT /settings/:key. */
export function useStoreValue(key) {
    const { data, dataRef, setKey, fail } = useStore();
    const set = useCallback(async (updater) => {
        if (EXTRA_VALUES[key]) return null;
        const before = dataRef.current[key];
        const after = typeof updater === 'function' ? updater(before) : updater;
        setKey(key, after);
        try {
            const saved = await api.put(`/settings/${key}`, after);
            setKey(key, saved);
            return saved;
        } catch (err) {
            setKey(key, before);
            fail(err);
            return null;
        }
    }, [key, dataRef, setKey, fail]);
    return [data[key], set];
}

/** Roles with helpers: byKey lookup + level ordering. */
export function useRoles() {
    const { items, add, update, remove } = useCollection('roles');
    return useMemo(() => ({
        list: items,
        byKey: Object.fromEntries(items.map((r) => [r.key, r])),
        add,
        update,
        remove,
    }), [items, add, update, remove]);
}

/**
 * Records a configuration / admin change -- feeds "Recent Configuration
 * Changes" on the dashboard, the notification bell and Audit Logs. The
 * server stamps who / when / device.
 */
export function useLogChange() {
    const { setKey, fail } = useStore();
    return useCallback(async (module, change, oldValue, newValue) => {
        try {
            const entry = await api.post('/changes', { module, change: String(change), oldValue: String(oldValue ?? '—'), newValue: String(newValue ?? '—') });
            setKey('changes', (list = []) => [entry, ...list]);
            return entry;
        } catch (err) {
            fail(err);
            return null;
        }
    }, [setKey, fail]);
}
