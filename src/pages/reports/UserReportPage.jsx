import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tooltip as AntTooltip } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import dayjs from 'dayjs';
import PageTitle from '../../components/ui/PageTitle';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusTag from '../../components/ui/StatusTag';
import ChartCard, { LegendRow } from '../../components/ui/ChartCard';
import { COLORS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { useCollection, useRoles, useStoreValue, useReload } from '../../store/AdminStore';
import { formatNumber } from '../../utils/format';

const PIE_COLORS = ['#2563EB', '#7C3AED', '#F59E0B', '#0E8AA8', '#4F46E5', '#0284C7', '#EA580C', '#16A34A', '#D97706', '#DB2777', '#64748B'];
const HEAT = ['#E5E7EB', '#C7D2FE', '#93A5F3', '#5A78E6', '#1E40AF'];
const SLOT_LABELS = ['12 AM', '', '', '6AM', '', '', '12 PM', '', '', '6 PM', '', ''];

/**
 * User Report -- user counts, growth and role mix computed from the stored
 * users (creating / activating users moves them), activity heat map and the
 * claim list.
 */
const UserReportPage = () => {
    const navigate = useNavigate();
    const { items: users } = useCollection('users');
    const { items: claims } = useCollection('claims');
    const roles = useRoles();
    const [usage] = useStoreValue('usage');
    const reload = useReload();
    useEffect(() => { reload(['usage']); }, [reload]);
    // Sign-ins over the last 90 days (admin-service audit trail), Mon-Sat x two-hour slots.
    const heatmap = usage?.heatmap ?? [];

    const stats = {
        total: users.length,
        active: users.filter((u) => u.status === 'Active').length,
        inactive: users.filter((u) => ['Inactive', 'Suspended', 'Resigned', 'On Leave'].includes(u.status)).length,
        fresh: users.filter((u) => dayjs(u.createdAt).isAfter(dayjs().subtract(30, 'day'))).length,
    };

    // Change vs the previous 30 days (from account creation dates; status history is not kept).
    const trend = useMemo(() => {
        const cut = dayjs().subtract(30, 'day');
        const cut60 = dayjs().subtract(60, 'day');
        const pct = (now, before) => (before ? Math.round(((now - before) / before) * 100) : now ? 100 : 0);
        const before = users.filter((u) => dayjs(u.createdAt).isBefore(cut)).length;
        const prevNew = users.filter((u) => dayjs(u.createdAt).isBefore(cut) && !dayjs(u.createdAt).isBefore(cut60)).length;
        const t = (n) => ({ trend: `${Math.abs(n)}%`, trendDown: n < 0 });
        return { total: t(pct(users.length, before)), fresh: t(pct(stats.fresh, prevNew)) };
    }, [users, stats.fresh]);

    // Cumulative users over the last 6 weeks.
    const growth = useMemo(() => Array.from({ length: 7 }, (_, i) => {
        const end = dayjs().subtract(6 - i, 'week').endOf('day');
        return { week: end.format('MMM DD'), users: users.filter((u) => !dayjs(u.createdAt).isAfter(end)).length };
    }), [users]);

    const roleMix = useMemo(
        () => roles.list.map((r) => ({ label: r.name, count: users.filter((u) => u.roleKey === r.key).length })).filter((r) => r.count > 0).sort((a, b) => b.count - a.count),
        [roles.list, users],
    );

    const columns = [
        { title: 'Claim ID', dataIndex: 'id' },
        { title: 'Customer Name', dataIndex: 'customer' },
        { title: 'Claim Type', dataIndex: 'type' },
        { title: 'Ammount', dataIndex: 'amount', render: formatNumber, align: 'right' },
        { title: 'SLA', dataIndex: 'slaDays', render: (d) => `${d} Days`, align: 'center' },
        { title: 'Staus', dataIndex: 'stage', render: (s) => <StatusTag status={s} minWidth={80} />, align: 'center' },
    ];

    return (
        <>
            <PageTitle title="User Report" />

            <div className="grid gap-2 grid-cols-2 lg:grid-cols-4 mb-3">
                <StatCard label="Total Users" value={formatNumber(stats.total)} icon={<DatabaseOutlined />} tone="blue" {...trend.total} trendLabel="VS Last 30 Days" onClick={() => navigate(ROUTES.USER_ACTIVATION)} />
                <StatCard label="Active Users" value={formatNumber(stats.active)} icon={<DatabaseOutlined />} tone="green" onClick={() => navigate(ROUTES.ACTIVE_USERS)} />
                <StatCard label="Inactive Users" value={formatNumber(stats.inactive)} icon={<DatabaseOutlined />} tone="slate" onClick={() => navigate(ROUTES.USER_ACTIVATION)} />
                <StatCard label="New Users" value={formatNumber(stats.fresh)} icon={<DatabaseOutlined />} tone="purple" {...trend.fresh} trendLabel="VS Last 30 Days" onClick={() => navigate(ROUTES.CREATE_USERS)} />
            </div>

            <div className="grid gap-2 grid-cols-1 lg:grid-cols-3 mb-3">
                <ChartCard title="Users Growth" onViewAll={() => navigate(ROUTES.USER_ACTIVATION)}>
                    <div style={{ height: 190 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growth} margin={{ left: -24, right: 8, top: 6 }}>
                                <defs><linearGradient id="ur-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4F7FD9" stopOpacity={0.45} /><stop offset="1" stopColor="#4F7FD9" stopOpacity={0.05} /></linearGradient></defs>
                                <CartesianGrid vertical={false} stroke="#EEE" />
                                <XAxis dataKey="week" tick={{ fontSize: 9 }} />
                                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                                <Tooltip />
                                <Area isAnimationActive={false} type="linear" dataKey="users" stroke="#9AB3E6" fill="url(#ur-area)" dot={{ r: 2.5, fill: COLORS.primary }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                <ChartCard title="Role Distrubution">
                    <div className="flex items-center gap-2 flex-1">
                        <div className="relative shrink-0" style={{ width: 150, height: 150 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart><Pie isAnimationActive={false} data={roleMix} dataKey="count" nameKey="label" innerRadius={42} outerRadius={70} stroke="#fff">{roleMix.map((r, i) => <Cell key={r.label} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip /></PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[20px] font-bold leading-none">{stats.total}</span><span className="text-[10.5px]">Total Users</span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">{roleMix.slice(0, 7).map((r, i) => <LegendRow key={r.label} color={PIE_COLORS[i % PIE_COLORS.length]} label={r.label} count={r.count} total={stats.total} />)}</div>
                    </div>
                </ChartCard>

                <ChartCard title="Users Active Heat Map">
                    <div className="flex flex-col gap-1 flex-1">
                        {!heatmap.some((r) => r.slots.some(Boolean)) && <span className="text-[11px]" style={{ color: COLORS.textMuted }}>No sign-ins recorded yet.</span>}
                        {heatmap.map((row) => (
                            <div key={row.day} className="flex items-center gap-1">
                                <span className="text-[9px] w-6" style={{ color: COLORS.textMuted }}>{row.day}</span>
                                {row.slots.map((v, s) => (
                                    <AntTooltip key={s} title={`${row.day} ${s * 2}:00–${s * 2 + 2}:00 · ${row.counts?.[s] ?? 0} sign-in(s)`}>
                                        <span className="flex-1 rounded-sm" style={{ height: 17, background: HEAT[v] }} />
                                    </AntTooltip>
                                ))}
                            </div>
                        ))}
                        <div className="flex gap-1 pl-7">{SLOT_LABELS.map((l, i) => <span key={i} className="flex-1 text-[8.5px] whitespace-nowrap" style={{ color: COLORS.textMuted }}>{l}</span>)}</div>
                    </div>
                </ChartCard>
            </div>

            <DataTable title="Claim Details" columns={columns} dataSource={claims} pageSize={5} scrollX={800} />
        </>
    );
};

export default UserReportPage;
