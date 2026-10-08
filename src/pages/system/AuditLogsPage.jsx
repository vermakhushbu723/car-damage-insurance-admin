import React, { useEffect, useMemo, useState } from 'react';
import { Button, Input, DatePicker, Select, Modal, Descriptions } from 'antd';
import { BankOutlined, TeamOutlined, LineChartOutlined, ApiOutlined, HddOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import PageTitle from '../../components/ui/PageTitle';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusTag from '../../components/ui/StatusTag';
import { COLORS } from '../../constants/theme';
import { AUDIT_MODULES, AUDIT_ACTIONS } from '../../data/modules';
import { useCollection, useReload } from '../../store/AdminStore';
import { formatNumber, matchesQuery, periodTrend } from '../../utils/format';

const CONFIG_MODULES = ['Claim Flow', 'Approval Logic', 'Fraud Routing', 'Fraud Trigger Rules', 'Allocation', 'Recommendation Engine', 'Communication Setup', 'Roles & Permissions', 'Document Templates', 'Branches/Offices', 'Claim Configuration'];
const EMPTY = { q: '', from: dayjs().subtract(30, 'day'), to: dayjs(), module: 'all', action: 'all' };

/**
 * Audit Logs -- security events from admin-service (sign-ins, failed
 * sign-ins, password resets, exports) plus every configuration change.
 */
const AuditLogsPage = () => {
    const { items: auditEvents } = useCollection('auditEvents');
    const reload = useReload();
    // Sign-ins, resets and exports happen outside this page -- fetch the latest when it opens.
    useEffect(() => { reload(['auditEvents', 'changes']); }, [reload]);
    const { items: changes } = useCollection('changes');
    const [draft, setDraft] = useState(EMPTY);
    const [filters, setFilters] = useState(EMPTY);
    const [viewing, setViewing] = useState(null);

    const events = useMemo(() => [
        ...changes.map((c) => ({
            id: c.id, at: c.changedOn, user: c.changedBy, role: 'Admin', update: c.change, reference: c.oldValue === '—' ? 'Created' : 'Updated',
            device: c.device ?? '—', module: c.module, status: 'Success', detail: `${c.oldValue} → ${c.newValue}`,
        })),
        ...auditEvents,
    ].sort((a, b) => dayjs(b.at).valueOf() - dayjs(a.at).valueOf()), [changes, auditEvents]);

    const modules = useMemo(() => [...new Set([...AUDIT_MODULES, ...events.map((e) => e.module)])], [events]);

    const rows = events.filter((e) => {
        const d = dayjs(e.at);
        return matchesQuery(e, filters.q, ['user', 'role', 'update', 'reference', 'module', 'device'])
            && (!filters.from || !d.isBefore(filters.from.startOf('day'))) && (!filters.to || !d.isAfter(filters.to.endOf('day')))
            && (filters.module === 'all' || e.module === filters.module)
            && (filters.action === 'all' || e.reference === filters.action);
    });

    const stats = {
        total: events.length,
        users: events.filter((e) => ['Users', 'User Activation', 'Users & Roles', 'System'].includes(e.module)).length,
        config: events.filter((e) => CONFIG_MODULES.includes(e.module)).length,
        security: events.filter((e) => ['Security', 'Password Reset'].includes(e.module)).length,
        failed: events.filter((e) => e.status === 'Failed').length,
    };

    const byModule = modules.map((m) => [m, events.filter((e) => e.module === m).length]).filter(([, n]) => n).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxModule = Math.max(1, ...byModule.map(([, n]) => n)) * 1.6;
    const security = [
        ['Successful Logins', events.filter((e) => e.reference === 'Login' && e.status === 'Success').length],
        ['Failed Logins', events.filter((e) => e.reference === 'Failed Login').length],
        ['Password Resets', events.filter((e) => e.reference === 'Password Reset').length],
        ['Permission Denied', events.filter((e) => e.reference === 'Permission Denied').length],
    ];

    const set = (k) => (v) => setDraft((d) => ({ ...d, [k]: v }));
    const showSecurity = () => {
        const next = { ...EMPTY, from: null, to: null, module: 'Security' };
        setDraft(next);
        setFilters(next);
    };

    const columns = [
        { title: 'Date & Time', dataIndex: 'at', render: (d) => <span className="whitespace-pre-line">{dayjs(d).format('DD MMM YYYY,\nhh:mm A')}</span>, width: 120 },
        { title: 'Users & Role', render: (_, e) => <div className="leading-tight"><div>{e.user}</div><div className="text-[11px]" style={{ color: COLORS.textSecondary }}>{e.role}</div></div> },
        { title: 'Update', dataIndex: 'update' },
        { title: 'Reference', dataIndex: 'reference' },
        { title: 'IP/Devices', dataIndex: 'device' },
        { title: 'Module', dataIndex: 'module' },
        { title: 'Status', dataIndex: 'status', render: (s) => <StatusTag status={s} minWidth={66} />, align: 'center' },
        { title: 'Action', align: 'center', render: (_, e) => <button type="button" onClick={() => setViewing(e)} className="rounded px-3 py-0.5 text-[12px]" style={{ background: COLORS.primarySoft, color: COLORS.primary }}>View</button> },
    ];

    return (
        <>
            <PageTitle title="Audit Logs" />

            <div className="grid gap-2 grid-cols-2 lg:grid-cols-5 mb-3">
                <StatCard label="Total Events" value={formatNumber(stats.total)} icon={<BankOutlined />} tone="blue" {...periodTrend(events, (e) => e.at)} trendLabel="Vs Last 30 Days" onClick={() => { setDraft(EMPTY); setFilters(EMPTY); }} />
                <StatCard label="Users Activity" value={formatNumber(stats.users)} icon={<TeamOutlined />} tone="purple" {...periodTrend(events, (e) => e.at, (e) => ['Users', 'User Activation', 'Users & Roles', 'System'].includes(e.module))} trendLabel="Vs Last 30 Days" />
                <StatCard label="Configuration Changes" value={formatNumber(stats.config)} icon={<LineChartOutlined />} tone="orange" {...periodTrend(events, (e) => e.at, (e) => CONFIG_MODULES.includes(e.module))} trendLabel="Vs Last 30 Days" />
                <StatCard label="Security Events" value={formatNumber(stats.security)} icon={<ApiOutlined />} tone="teal" {...periodTrend(events, (e) => e.at, (e) => ['Security', 'Password Reset'].includes(e.module))} trendLabel="Vs Last 30 Days" onClick={showSecurity} />
                <StatCard label="Failed Action" value={formatNumber(stats.failed)} icon={<HddOutlined />} tone="green" {...periodTrend(events, (e) => e.at, (e) => e.status === 'Failed')} trendDown={false} trendLabel="Vs Last 30 Days" />
            </div>

            <div className="filter-bar grid gap-2 mb-3 items-end" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <label className="flex flex-col gap-1"><span className="text-[13px] font-semibold">Search Audit Logs</span>
                    <Input allowClear placeholder="User,Claim,Action...." value={draft.q} onChange={(e) => set('q')(e.target.value)} onPressEnter={() => setFilters(draft)} />
                </label>
                <label className="flex flex-col gap-1"><span className="text-[13px] font-semibold">From</span><DatePicker value={draft.from} onChange={set('from')} format="DD MMM YYYY" /></label>
                <label className="flex flex-col gap-1"><span className="text-[13px] font-semibold">To</span><DatePicker value={draft.to} onChange={set('to')} format="DD MMM YYYY" /></label>
                <label className="flex flex-col gap-1"><span className="text-[13px] font-semibold">Module</span>
                    <Select value={draft.module} onChange={set('module')} options={[{ value: 'all', label: 'All Modules' }, ...modules.map((m) => ({ value: m, label: m }))]} showSearch />
                </label>
                <label className="flex flex-col gap-1"><span className="text-[13px] font-semibold">Action</span>
                    <Select value={draft.action} onChange={set('action')} options={[{ value: 'all', label: 'All Action' }, ...AUDIT_ACTIONS.map((a) => ({ value: a, label: a }))]} />
                </label>
                <Button type="primary" onClick={() => setFilters(draft)}>Apply</Button>
            </div>

            <DataTable title="Audit Logs Details" columns={columns} dataSource={rows} pageSize={6} scrollX={1050} locale={{ emptyText: 'No events match these filters' }} />

            <div className="grid gap-3 grid-cols-1 lg:grid-cols-2 mt-3">
                <div className="rounded-md p-3" style={{ background: '#fff', border: `1px solid ${COLORS.border}` }}>
                    <h3 className="text-[15px] font-semibold m-0 mb-2">Audit By Module</h3>
                    {byModule.map(([m, n]) => (
                        <button key={m} type="button" onClick={() => { const next = { ...EMPTY, from: null, to: null, module: m }; setDraft(next); setFilters(next); }} className="w-full grid items-end gap-3 py-1 text-left" style={{ gridTemplateColumns: '1fr 50px' }}>
                            <span>
                                <span className="block text-[12px] font-semibold">{m}</span>
                                <span className="block h-[3px] mt-1" style={{ background: '#E5E7EB' }}><span className="block h-full" style={{ width: `${(n / maxModule) * 100}%`, background: COLORS.primary }} /></span>
                            </span>
                            <span className="text-[12px] font-semibold text-right">{formatNumber(n)}</span>
                        </button>
                    ))}
                </div>
                <div className="rounded-md p-3 flex flex-col" style={{ background: '#fff', border: `1px solid ${COLORS.border}` }}>
                    <h3 className="text-[15px] font-semibold m-0 mb-2">Security Summery</h3>
                    {security.map(([k, v]) => (
                        <div key={k} className="flex justify-between py-1.5 text-[12px] font-semibold"><span>{k}</span><span>{formatNumber(v)}</span></div>
                    ))}
                    <div className="flex-1" />
                    <button type="button" onClick={showSecurity} className="mt-2 rounded py-1.5 text-[13px]" style={{ background: COLORS.primarySoft, color: COLORS.primary }}>View Security Events</button>
                </div>
            </div>

            <Modal open={!!viewing} title="Audit Event" onCancel={() => setViewing(null)} footer={null} width={580}>
                {viewing && (
                    <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label="Date & Time">{dayjs(viewing.at).format('DD MMM YYYY, hh:mm:ss A')}</Descriptions.Item>
                        <Descriptions.Item label="User">{viewing.user} ({viewing.role})</Descriptions.Item>
                        <Descriptions.Item label="Update">{viewing.update}</Descriptions.Item>
                        {viewing.detail && <Descriptions.Item label="Change">{viewing.detail}</Descriptions.Item>}
                        <Descriptions.Item label="Reference">{viewing.reference}</Descriptions.Item>
                        <Descriptions.Item label="IP / Device">{viewing.device}</Descriptions.Item>
                        <Descriptions.Item label="Module">{viewing.module}</Descriptions.Item>
                        <Descriptions.Item label="Status"><StatusTag status={viewing.status} /></Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </>
    );
};

export default AuditLogsPage;
