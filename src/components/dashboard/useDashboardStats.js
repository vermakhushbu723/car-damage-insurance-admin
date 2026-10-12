import { useMemo } from 'react';
import { useCollection, useRoles, useStoreValue } from '../../store/AdminStore';

/**
 * Claim load of one handler: open claims vs capacity. `thresholdPct` is the
 * Handler Allocation Rule's maximum threshold -- at that load the handler is
 * full and new claims go to someone else.
 */
export const handlerLoad = (u, thresholdPct = 90) => {
    const s = u.handlerStats ?? { totalClaims: 0, inProgress: 0, completed: 0, capacityLimit: 100 };
    const pct = s.capacityLimit ? Math.round((s.inProgress / s.capacityLimit) * 100) : 0;
    const limit = Math.max(1, Math.floor((s.capacityLimit * thresholdPct) / 100));
    return { ...s, pct, limit, status: s.inProgress >= limit ? 'High Load' : 'Normal' };
};

/** The Handler Allocation Rule's threshold (%), from settings. */
export const useThresholdPct = () => {
    const [allocation] = useStoreValue('allocation');
    return allocation?.thresholdPct ?? 90;
};

/**
 * Numbers shared by the Dashboard and Active Users screens -- all derived
 * from the stored users, so creating / activating a user moves them.
 */
export default function useDashboardStats() {
    const { items: users } = useCollection('users');
    const { list: roles } = useRoles();
    const thresholdPct = useThresholdPct();

    return useMemo(() => {
        const active = users.filter((u) => u.status === 'Active');
        const countFor = (roleKey, list = active) => list.filter((u) => u.roleKey === roleKey).length;
        const roleCounts = roles.map((r) => ({ key: r.key, label: r.chartLabel ?? r.name, short: r.short, active: countFor(r.key), total: countFor(r.key, users) }));
        const handlers = users.filter((u) => u.roleKey === 'claim-handler' && u.status === 'Active').map((u) => ({ ...u, load: handlerLoad(u, thresholdPct) }));
        const totalClaims = handlers.reduce((a, h) => a + h.load.inProgress, 0);
        const totalCapacity = handlers.reduce((a, h) => a + h.load.capacityLimit, 0);
        return {
            totalUsers: users.length,
            activeUsers: active.length,
            roleCounts,
            handlers,
            mappedHandlers: handlers.length,
            currentLoadPct: totalCapacity ? Math.round((totalClaims / totalCapacity) * 100) : 0,
        };
    }, [users, roles, thresholdPct]);
}
