import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select, Button, Tabs, Dropdown, App } from 'antd';
import { SearchOutlined, DownOutlined } from '@ant-design/icons';
import DataTable from '../../components/ui/DataTable';
import StatusTag from '../../components/ui/StatusTag';
import UserCell from '../../components/ui/UserCell';
import { COLORS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { ACCOUNT_STATUSES } from '../../data/roles';
import { useCollection, useLogChange, useRoles } from '../../store/AdminStore';
import { formatDateTime, formatNumber, matchesQuery } from '../../utils/format';

const TABS = [
    { key: 'all', label: 'All', match: () => true },
    { key: 'pending', label: 'Pending Activation', match: (u) => u.status === 'Pending' },
    { key: 'active', label: 'Active', match: (u) => u.status === 'Active' },
    { key: 'inactive', label: 'Inactive', match: (u) => u.status === 'Inactive' },
    { key: 'suspended', label: 'Suspended', match: (u) => u.status === 'Suspended' },
];

// Activation dropdown -> resulting status.
const ACTIONS = [
    { key: 'Active', label: 'Activate' },
    { key: 'Inactive', label: 'Deactivate' },
    { key: 'Suspended', label: 'Suspend' },
    { key: 'Pending', label: 'Mark Pending' },
];

const EMPTY_FILTERS = { q: '', org: 'all', role: 'all', status: 'all' };

/**
 * User Activation -- filters apply on "Apply Filters", tabs split by
 * status, the per-row "Activate" dropdown (or the bulk bar for ticked
 * rows) changes status. Counts and the dashboard update immediately.
 */
const UserActivationPage = () => {
    const navigate = useNavigate();
    const { message, modal } = App.useApp();
    const { items: users, updateMany } = useCollection('users');
    const roles = useRoles();
    const logChange = useLogChange();

    const [draft, setDraft] = useState(EMPTY_FILTERS);
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [tab, setTab] = useState('all');
    const [selected, setSelected] = useState([]);

    const orgOptions = [...new Set(users.map((u) => u.organization))].sort();

    const filtered = useMemo(() => users.filter((u) => (
        matchesQuery(u, filters.q, ['name', 'userId', 'email', 'employeeId', 'organization'])
        && (filters.org === 'all' || u.organization === filters.org)
        && (filters.role === 'all' || u.roleKey === filters.role)
        && (filters.status === 'all' || u.status === filters.status)
    )), [users, filters]);

    const rows = filtered.filter(TABS.find((t) => t.key === tab).match);

    const applyStatus = async (ids, status) => {
        const targets = users.filter((u) => ids.includes(u.id) && u.status !== status);
        if (!targets.length) {
            message.info(`Already ${status}.`);
            return;
        }
        if (!(await updateMany(targets.map((u) => u.id), { status }))) return;
        if (targets.length === 1) logChange('User Activation', targets[0].name, targets[0].status, status);
        else logChange('User Activation', `${targets.length} users`, 'Mixed', status);
        message.success(`${targets.length === 1 ? targets[0].name : `${targets.length} users`} → ${status}`);
        setSelected((s) => s.filter((id) => !ids.includes(id)));
    };

    const confirmStatus = (ids, status) => {
        if (status === 'Suspended') {
            modal.confirm({
                title: `Suspend ${ids.length === 1 ? users.find((u) => u.id === ids[0])?.name : `${ids.length} users`}?`,
                content: 'Suspended users cannot sign in until they are activated again.',
                okText: 'Suspend',
                okButtonProps: { danger: true },
                onOk: () => applyStatus(ids, status),
            });
        } else applyStatus(ids, status);
    };

    const actionMenu = (ids) => ({
        items: [
            ...ACTIONS.map((a) => ({ key: a.key, label: a.label, danger: a.key === 'Suspended' })),
            ...(ids.length === 1 ? [{ type: 'divider' }, { key: 'edit', label: 'Modify user' }] : []),
        ],
        onClick: ({ key }) => (key === 'edit' ? navigate(`${ROUTES.CREATE_USERS}?edit=${ids[0]}`) : confirmStatus(ids, key)),
    });

    const columns = [
        { title: 'Users Name', render: (_, u) => <UserCell name={u.name} sub={`${roles.byKey[u.roleKey]?.name ?? u.roleKey} · ${u.userId}`} />, width: 230 },
        { title: 'Organization', dataIndex: 'organization' },
        { title: 'Staus', render: (_, u) => <StatusTag status={u.status} minWidth={110} />, align: 'center' },
        { title: 'Created On', dataIndex: 'createdAt', render: formatDateTime, align: 'center', width: 180 },
        {
            title: 'Activation',
            align: 'center',
            render: (_, u) => (
                <Dropdown menu={actionMenu([u.id])} trigger={['click']}>
                    <Button style={{ background: COLORS.primarySoft, color: COLORS.primary, border: 'none', minWidth: 92, fontSize: 12, height: 26 }}>
                        Activate <DownOutlined style={{ fontSize: 9 }} />
                    </Button>
                </Dropdown>
            ),
        },
    ];

    const setD = (key) => (v) => setDraft((d) => ({ ...d, [key]: v }));

    return (
        <>
            <h1 className="text-[20px] font-bold m-0 mb-3" style={{ color: COLORS.primary }}>User Activation</h1>

            <div className="filter-bar flex flex-wrap gap-2 mb-2">
                <Input
                    allowClear
                    value={draft.q}
                    onChange={(e) => setD('q')(e.target.value)}
                    onPressEnter={() => setFilters(draft)}
                    placeholder="Search Users........"
                    suffix={<SearchOutlined />}
                    style={{ width: 'min(100%, 340px)' }}
                />
                <Select value={draft.org} onChange={setD('org')} style={{ width: 150 }} options={[{ value: 'all', label: 'Organisation All' }, ...orgOptions.map((o) => ({ value: o, label: o }))]} />
                <Select value={draft.role} onChange={setD('role')} style={{ width: 150 }} options={[{ value: 'all', label: 'Role All' }, ...roles.list.map((r) => ({ value: r.key, label: r.name }))]} />
                <Select value={draft.status} onChange={setD('status')} style={{ width: 130 }} options={[{ value: 'all', label: 'Status All' }, ...ACCOUNT_STATUSES.concat('Pending').map((s) => ({ value: s, label: s }))]} />
                <Button type="primary" style={{ minWidth: 110 }} onClick={() => { setFilters(draft); setSelected([]); }}>Apply Filters</Button>
                {JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS) && (
                    <Button type="link" onClick={() => { setDraft(EMPTY_FILTERS); setFilters(EMPTY_FILTERS); }}>Clear</Button>
                )}
            </div>

            <Tabs
                className="page-tabs"
                activeKey={tab}
                onChange={(k) => { setTab(k); setSelected([]); }}
                items={TABS.map((t) => ({ key: t.key, label: <span className="text-[13px]">{t.label} ({formatNumber(filtered.filter(t.match).length)})</span> }))}
            />

            {selected.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-md px-3 py-1.5 mb-2" style={{ background: COLORS.bgSoftBlue }}>
                    <span className="text-[12px] font-medium">{selected.length} selected</span>
                    {ACTIONS.map((a) => (
                        <Button key={a.key} size="small" danger={a.key === 'Suspended'} onClick={() => confirmStatus(selected, a.key)}>{a.label}</Button>
                    ))}
                    <Button size="small" type="link" onClick={() => setSelected([])}>Clear selection</Button>
                </div>
            )}

            <DataTable
                columns={columns}
                dataSource={rows}
                pageSize={8}
                scrollX={980}
                rowSelection={{ selectedRowKeys: selected, onChange: setSelected }}
                locale={{ emptyText: 'No users match these filters' }}
            />
        </>
    );
};

export default UserActivationPage;
