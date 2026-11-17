import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select, Switch, Table, Tag } from 'antd';
import { BankOutlined, FileDoneOutlined, FileTextOutlined, FileProtectOutlined, WalletOutlined, ArrowRightOutlined, SearchOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList, Cell, Tooltip } from 'recharts';
import ModuleCards from '../../components/dashboard/ModuleCards';
import useDashboardStats from '../../components/dashboard/useDashboardStats';
import { COLORS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { useCollection, useLogChange, useRoles, useStoreValue } from '../../store/AdminStore';

const BAR_COLORS = ['#1463FF', '#0F8A4C', '#7443D4', '#F3961B'];
const CHART_ROLES = ['national-manager', 'regional-manager', 'state-manager', 'claim-handler'];

// Overview step -> claim-journey stages behind it (active if any of them is on).
const OVERVIEW = [
    { label: 'Intimation', icon: BankOutlined, stages: ['Intimation'] },
    { label: 'Assessment', icon: FileDoneOutlined, stages: ['Surveyor Allocation', 'AI ILA', 'Handler ILA', 'FLA'] },
    { label: 'Review', icon: FileTextOutlined, stages: ['Claim Details', 'Recommendation'] },
    { label: 'Approval', icon: FileProtectOutlined, stages: ['Approval'] },
    { label: 'Payment', icon: WalletOutlined, stages: ['Settlement'] },
];

const Box = ({ children, className = '' }) => (
    <div className={`rounded-lg min-w-0 ${className}`} style={{ background: '#fff', boxShadow: '0 1px 4px rgba(15,23,42,0.12)' }}>{children}</div>
);

const ActiveUsersPage = () => {
    const navigate = useNavigate();
    const stats = useDashboardStats();
    const [config, setConfig] = useStoreValue('config');
    const logChange = useLogChange();
    const [scope, setScope] = useState('active');

    const data = CHART_ROLES.map((k) => stats.roleCounts.find((r) => r.key === k)).filter(Boolean)
        .map((r) => ({ name: r.label.replace('Claim Handlers (CH)', 'Claim Handlers'), value: scope === 'active' ? r.active : r.total }));

    // ---- the people behind the numbers (one line per user) ----
    const { items: users } = useCollection('users');
    const roles = useRoles();
    const [q, setQ] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const roleName = (k) => roles.byKey[k]?.name ?? k;
    const userRows = useMemo(() => {
        const text = q.trim().toLowerCase();
        return users
            .filter((u) => scope === 'all' || u.status === 'Active')
            .filter((u) => roleFilter === 'All' || (u.roleKeys ?? [u.roleKey]).includes(roleFilter))
            .filter((u) => !text || [u.name, u.userId, u.email, u.contact, u.organization, u.city, u.state, ...(u.roleKeys ?? [u.roleKey]).map(roleName)]
                .some((v) => String(v ?? '').toLowerCase().includes(text)))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [users, scope, roleFilter, q, roles]); // eslint-disable-line react-hooks/exhaustive-deps
    const roleOptions = useMemo(() => {
        const keys = [...new Set(users.flatMap((u) => u.roleKeys ?? [u.roleKey]))].filter(Boolean);
        return [{ value: 'All', label: 'Role All' }, ...keys.map((k) => ({ value: k, label: roleName(k) })).sort((a, b) => a.label.localeCompare(b.label))];
    }, [users, roles]); // eslint-disable-line react-hooks/exhaustive-deps

    const journey = config.journey;
    const enabled = journey.enabled[journey.mode];

    const toggleMatrix = async (row, value) => {
        if (!(await setConfig((c) => ({ ...c, approvalMatrix: c.approvalMatrix.map((r) => (r.id === row.id ? { ...r, enabled: value } : r)) })))) return;
        logChange('Approval Logic', `${row.approval} (${row.logic})`, row.enabled ? 'ON' : 'OFF', value ? 'ON' : 'OFF');
    };

    return (
        <div className="flex flex-col gap-3">
            <ModuleCards />
            <div className="grid gap-3 grid-cols-1 xl:grid-cols-2">
                <Box className="p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-[14px] font-semibold m-0">Active Users By Role</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] font-medium">Total Users</span>
                            <Select
                                value={scope}
                                onChange={setScope}
                                style={{ width: 130 }}
                                options={[
                                    { value: 'active', label: `${stats.activeUsers} (Active)` },
                                    { value: 'all', label: `${stats.totalUsers} (All)` },
                                ]}
                            />
                        </div>
                    </div>
                    <div style={{ height: 280 }} className="mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 40 }}>
                                <CartesianGrid horizontal={false} vertical={false} />
                                <XAxis type="number" axisLine={false} tickLine={false} allowDecimals={false} />
                                <YAxis type="category" dataKey="name" width={170} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#0F172A' }} />
                                <Tooltip cursor={{ fill: 'rgba(11,76,208,0.05)' }} />
                                <Bar isAnimationActive={false} dataKey="value" barSize={30} name="Users">
                                    {data.map((d, i) => <Cell key={d.name} fill={BAR_COLORS[i]} />)}
                                    <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: '#0F172A' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Box>

                <div className="flex flex-col gap-3 min-w-0">
                    <Box className="p-3">
                        <h3 className="text-[14px] font-semibold m-0 mb-3">Claim Flow Overview</h3>
                        <div className="overflow-x-auto">
                            <div className="flex items-start" style={{ minWidth: 400 }}>
                                {OVERVIEW.map((o, i) => {
                                    const on = o.stages.some((s) => enabled[s]);
                                    const Icon = o.icon;
                                    return (
                                        <React.Fragment key={o.label}>
                                            <div className="flex flex-col items-center shrink-0" style={{ width: 76 }}>
                                                <span className="flex items-center justify-center rounded-full" style={{ width: 48, height: 48, fontSize: 20, background: '#fff', boxShadow: '0 1px 6px rgba(15,23,42,0.15)', color: on ? '#0F172A' : COLORS.textMuted }}>
                                                    <Icon />
                                                </span>
                                                <span className="mt-1 text-[12px] font-medium">{o.label}</span>
                                                <span className="text-[11px] font-medium" style={{ color: on ? '#22C55E' : COLORS.danger }}>{on ? 'Active' : 'Inactive'}</span>
                                            </div>
                                            {i < OVERVIEW.length - 1 && <span className="flex-1 mt-[24px]" style={{ borderTop: '1px solid #CBD5E1' }} />}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    </Box>

                    <Box className="p-3">
                        <h3 className="text-[14px] font-semibold m-0 mb-2">Approval Logic Matrix</h3>
                        <div className="grid items-center gap-y-1.5 text-[12px]" style={{ gridTemplateColumns: '1fr 1.3fr 50px' }}>
                            <span className="text-[12.5px] font-semibold">Approval</span>
                            <span className="text-[12.5px] font-semibold">Logic Configured</span>
                            <span className="text-[12.5px] font-semibold text-center">On/Off</span>
                            {config.approvalMatrix.map((r) => (
                                <React.Fragment key={r.id}>
                                    <span>{r.approval}</span>
                                    <span>{r.logic}</span>
                                    <span className="text-center"><Switch size="small" checked={r.enabled} onChange={(v) => toggleMatrix(r, v)} aria-label={r.approval} /></span>
                                </React.Fragment>
                            ))}
                        </div>
                        <button type="button" onClick={() => navigate(ROUTES.ALLOCATION_LOAD)} className="mt-3 flex items-center gap-1.5 text-[12px] font-medium" style={{ color: '#1677FF' }}>
                            View Allocation Details <ArrowRightOutlined />
                        </button>
                    </Box>
                </div>
            </div>

            <Box className="p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h3 className="text-[14px] font-semibold m-0">
                        {scope === 'active' ? 'Active Users' : 'All Users'} <span className="font-normal text-[12px]" style={{ color: COLORS.textMuted }}>({userRows.length})</span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                        <Input allowClear prefix={<SearchOutlined />} placeholder="Search name, ID, email, mobile, city" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 260 }} />
                        <Select value={roleFilter} onChange={setRoleFilter} options={roleOptions} style={{ width: 190 }} showSearch optionFilterProp="label" />
                    </div>
                </div>
                <Table
                    size="small"
                    rowKey="id"
                    dataSource={userRows}
                    pagination={{ pageSize: 10, hideOnSinglePage: true, showSizeChanger: false }}
                    scroll={{ x: 1000 }}
                    locale={{ emptyText: scope === 'active' ? 'No active users yet.' : 'No users yet.' }}
                    columns={[
                        { title: 'Name', dataIndex: 'name', render: (n, u) => <span><span className="font-medium">{n}</span><span className="block text-[11px]" style={{ color: COLORS.textMuted }}>{u.userId}</span></span> },
                        {
                            title: 'Roles',
                            key: 'roles',
                            render: (_, u) => (u.roleKeys ?? [u.roleKey]).map((k, i) => <Tag key={k} color={i === 0 ? 'blue' : undefined} className="!mb-1">{roleName(k)}</Tag>),
                        },
                        { title: 'Email', dataIndex: 'email' },
                        { title: 'Mobile', dataIndex: 'contact', render: (v) => v || '—' },
                        { title: 'Location', key: 'loc', render: (_, u) => [u.city, u.state].filter(Boolean).join(', ') || '—' },
                        { title: 'Organization', dataIndex: 'organization', render: (v) => v || '—' },
                        { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={s === 'Active' ? 'green' : s === 'Suspended' ? 'red' : 'orange'}>{s}</Tag> },
                        { title: 'Last Login', dataIndex: 'lastLoginAt', render: (v) => (v ? dayjs(v).format('DD MMM YYYY, hh:mm A') : 'Never') },
                        {
                            title: '',
                            key: 'edit',
                            width: 50,
                            render: (_, u) => (
                                <button type="button" aria-label={`Edit ${u.name}`} onClick={() => navigate(`${ROUTES.CREATE_USERS}?edit=${encodeURIComponent(u.id)}`)} style={{ color: '#1677FF' }}>
                                    <EditOutlined />
                                </button>
                            ),
                        },
                    ]}
                />
            </Box>
        </div>
    );
};

export default ActiveUsersPage;
