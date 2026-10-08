import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import ModuleCards from '../../components/dashboard/ModuleCards';
import ClaimJourney from '../../components/dashboard/ClaimJourney';
import useDashboardStats from '../../components/dashboard/useDashboardStats';
import DataTable from '../../components/ui/DataTable';
import StatusTag from '../../components/ui/StatusTag';
import OnOffSwitch from '../../components/ui/OnOffSwitch';
import { COLORS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { useCollection, useLogChange, useStoreValue } from '../../store/AdminStore';
import { formatDateTime, matchesQuery } from '../../utils/format';

const BAR_COLORS = ['#1463D8', '#178A50', '#7A45D6', '#F39C12'];
const CHART_ROLES = ['national-manager', 'regional-manager', 'state-manager', 'claim-handler'];

const Box = ({ children, className = '' }) => (
    <div className={`rounded-lg min-w-0 ${className}`} style={{ background: '#fff', boxShadow: '0 1px 4px rgba(15,23,42,0.12)' }}>{children}</div>
);


const ActiveUsersByRole = ({ roleCounts }) => {
    const rows = CHART_ROLES.map((k) => roleCounts.find((r) => r.key === k)).filter(Boolean);
    const max = Math.max(1, ...rows.map((r) => r.active)) * 1.35;
    return (
        <Box className="p-3">
            <h3 className="text-[14px] font-semibold m-0 mb-3" style={{ color: COLORS.textPrimary }}>Active Users By Role</h3>
            <div className="flex flex-col gap-2">
                {rows.map((r, i) => (
                    <div key={r.key} className="grid items-center gap-2" style={{ gridTemplateColumns: 'minmax(110px, 1.2fr) 2fr 30px' }}>
                        <span className="text-[12px] font-medium">{r.label}</span>
                        <div className="h-[12px] rounded-full overflow-hidden" style={{ background: '#D9D9D9' }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${(r.active / max) * 100}%`, background: BAR_COLORS[i] }} />
                        </div>
                        <span className="text-[12px] font-medium text-right">{r.active}</span>
                    </div>
                ))}
            </div>
        </Box>
    );
};

const ApprovalRules = () => {
    const navigate = useNavigate();
    const [config, setConfig] = useStoreValue('config');
    const logChange = useLogChange();
    const toggle = async (rule, value) => {
        if (!(await setConfig((c) => ({ ...c, approvalRules: c.approvalRules.map((r) => (r.id === rule.id ? { ...r, enabled: value } : r)) })))) return;
        logChange('Approval Logic', rule.name, rule.enabled ? 'ON' : 'OFF', value ? 'ON' : 'OFF');
    };
    return (
        <Box className="p-3">
            <h3 className="text-[14px] font-semibold m-0 mb-2" style={{ color: COLORS.textPrimary }}>Approval Logic Matrix</h3>
            <div className="flex flex-col gap-2">
                {config.approvalRules.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-[12px] font-semibold">{r.name}</div>
                            <div className="text-[11.5px]" style={{ color: COLORS.textSecondary }}>{r.desc}</div>
                        </div>
                        <OnOffSwitch checked={r.enabled} onChange={(v) => toggle(r, v)} ariaLabel={r.name} />
                    </div>
                ))}
            </div>
            <Button type="primary" className="mt-3" style={{ height: 30, paddingInline: 16 }} onClick={() => navigate(ROUTES.APPROVAL_LOGIC)}>Open Approval Configuration</Button>
        </Box>
    );
};

const FraudSummary = () => {
    const navigate = useNavigate();
    const { items: rules } = useCollection('fraudRules');
    const { items: triggers } = useCollection('triggers');
    const open = triggers.filter((t) => ['Open', 'Under review', 'Escalated'].includes(t.status));
    const s = { activeRules: rules.filter((r) => r.active).length, openTriggers: open.length, critical: open.filter((t) => t.score >= 50).length };
    const pad = (n) => String(n).padStart(2, '0');
    return (
        <Box className="p-3 flex flex-col">
            <h3 className="text-[14px] font-semibold m-0 mb-2" style={{ color: COLORS.textPrimary }}>Fraud Routing Summary</h3>
            <div className="flex gap-8">
                {[['Active Rules', s.activeRules], ['Open Triggers', s.openTriggers], ['Critical', s.critical]].map(([label, v]) => (
                    <div key={label}>
                        <div className="text-[12px] font-semibold">{label}</div>
                        <div className="text-[18px] font-bold mt-0.5 pl-1">{pad(v)}</div>
                    </div>
                ))}
            </div>
            <div className="mt-3 rounded-md px-3 py-1.5 text-[12px]" style={{ background: '#FDEFC8', color: '#E8A30C' }}>
                Critical triggers can block auto-approval and route the claim for review.
            </div>
            <div className="flex-1 min-h-3" />
            <Button type="primary" className="self-start" style={{ height: 30, paddingInline: 16 }} onClick={() => navigate(ROUTES.FRAUD_TRIGGER_RULES)}>Open Fraud Trigger Rules</Button>
        </Box>
    );
};

const viewAllLink = (onClick) => (
    <button type="button" onClick={onClick} className="text-[12px] font-semibold" style={{ color: '#1677FF' }}>View All</button>
);

const CHANGE_COLUMNS = [
    { title: 'Changed By', dataIndex: 'changedBy' },
    { title: 'Module', dataIndex: 'module' },
    { title: 'Change', dataIndex: 'change' },
    { title: 'Old Value', dataIndex: 'oldValue' },
    { title: 'New Value', dataIndex: 'newValue' },
    { title: 'Changed On', dataIndex: 'changedOn', render: formatDateTime, width: 190 },
];

const HANDLER_COLUMNS = [
    { title: 'Handler Name', dataIndex: 'name' },
    { title: 'Total Claims', render: (_, h) => h.load.totalClaims, align: 'center' },
    { title: 'In progress', render: (_, h) => h.load.inProgress, align: 'center' },
    { title: 'Completed', render: (_, h) => h.load.completed, align: 'center' },
    { title: 'Capacity Limit', render: (_, h) => h.load.capacityLimit, align: 'center' },
    {
        title: 'Load (%)',
        width: 220,
        render: (_, h) => (
            <div className="flex items-center gap-2">
                <span className="w-9 text-right">{h.load.pct}%</span>
                <div className="flex-1 h-[7px] rounded-full overflow-hidden" style={{ background: '#D9D9D9' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, h.load.pct)}%`, background: '#B91C1C' }} />
                </div>
            </div>
        ),
    },
    { title: 'Status', render: (_, h) => <StatusTag status={h.load.status} minWidth={110} />, align: 'center' },
];

/** "View All" -- the full list with a search box. */
const ViewAllModal = ({ open, onClose, title, rows, columns, searchFields }) => {
    const [q, setQ] = useState('');
    const filtered = rows.filter((r) => matchesQuery(r, q, searchFields));
    return (
        <Modal open={open} onCancel={onClose} footer={null} width={1100} title={title} destroyOnHidden>
            <Input allowClear prefix={<SearchOutlined />} placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} className="mb-3" style={{ maxWidth: 320, background: '#fff' }} />
            <DataTable rowKey="id" columns={columns} dataSource={filtered} pageSize={10} scrollX={950} />
        </Modal>
    );
};

const DashboardPage = () => {
    const stats = useDashboardStats();
    const { items: changes } = useCollection('changes');
    const [modal, setModal] = useState(null);

    const handlers = stats.handlers;

    return (
        <div className="flex flex-col gap-3">
            <ModuleCards />
            <ClaimJourney />
            <div className="grid gap-3 grid-cols-1 xl:grid-cols-2">
                <ActiveUsersByRole roleCounts={stats.roleCounts} />
                <ApprovalRules />
                <FraudSummary />
            </div>
            <DataTable
                title="Recent Configuration Changes"
                extra={viewAllLink(() => setModal('changes'))}
                columns={CHANGE_COLUMNS}
                dataSource={changes}
                pageSize={7}
                scrollX={950}
            />
            <DataTable
                title="Handler Allocation & Load Summary"
                extra={viewAllLink(() => setModal('handlers'))}
                columns={HANDLER_COLUMNS}
                dataSource={handlers}
                pageSize={7}
                scrollX={950}
            />
            <ViewAllModal open={modal === 'changes'} onClose={() => setModal(null)} title="All Configuration Changes" rows={changes} columns={CHANGE_COLUMNS} searchFields={['changedBy', 'module', 'change', 'oldValue', 'newValue']} />
            <ViewAllModal open={modal === 'handlers'} onClose={() => setModal(null)} title="Handler Allocation & Load" rows={handlers} columns={HANDLER_COLUMNS} searchFields={['name', 'city', (h) => h.load.status]} />
        </div>
    );
};

export default DashboardPage;