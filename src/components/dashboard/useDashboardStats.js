import { useMemo } from 'react';
import { useCollection, useRoles } from '../../store/AdminStore';

export const HIGH_LOAD_PCT = 80;

/** Claim load of one handler: total claims vs capacity. */
export const handlerLoad = (u) => {
    const s = u.handlerStats ?? { totalClaims: 0, inProgress: 0, completed: 0, capacityLimit: 100 };
    const pct = s.capacityLimit ? Math.round((s.totalClaims / s.capacityLimit) * 100) : 0;
    return { ...s, pct, status: pct >= HIGH_LOAD_PCT ? 'High Load' : 'Normal' };
};

/**
 * Numbers shared by the Dashboard and Active Users screens -- all derived
 * from the stored users, so creating / activating a user moves them.
 */
export default function useDashboardStats() {
    const { items: users } = useCollection('users');
    const { list: roles } = useRoles();

    return useMemo(() => {
        const active = users.filter((u) => u.status === 'Active');
        const countFor = (roleKey, list = active) => list.filter((u) => u.roleKey === roleKey).length;
        const roleCounts = roles.map((r) => ({ key: r.key, label: r.chartLabel ?? r.name, short: r.short, active: countFor(r.key), total: countFor(r.key, users) }));
        const handlers = users.filter((u) => u.roleKey === 'claim-handler' && u.status === 'Active').map((u) => ({ ...u, load: handlerLoad(u) }));
        const totalClaims = handlers.reduce((a, h) => a + h.load.totalClaims, 0);
        const totalCapacity = handlers.reduce((a, h) => a + h.load.capacityLimit, 0);
        return {
            totalUsers: users.length,
            activeUsers: active.length,
            roleCounts,
            handlers,
            mappedHandlers: handlers.length,
            currentLoadPct: totalCapacity ? Math.round((totalClaims / totalCapacity) * 100) : 0,
        };
    }, [users, roles]);
}
