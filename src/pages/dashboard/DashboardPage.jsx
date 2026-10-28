import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Descriptions, Modal } from 'antd';
import {
    TeamOutlined, FileAddOutlined, UserSwitchOutlined, RobotOutlined, AuditOutlined, ProfileOutlined, DollarOutlined,
    FolderOpenOutlined, ArrowRightOutlined, MailOutlined, FileSyncOutlined, LinkOutlined, EyeOutlined, FileDoneOutlined,
    DatabaseOutlined, UserOutlined,
} from '@ant-design/icons';
import useDashboardStats from '../../components/dashboard/useDashboardStats';
import DataTable from '../../components/ui/DataTable';
import StatusTag from '../../components/ui/StatusTag';
import { COLORS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { useCollection } from '../../store/AdminStore';
import { formatDateTime } from '../../utils/format';

// "Service provider Dashboard" (Figma: ADMIN SCREEN AS FOR SERVICE PROVIDER). Every number
// comes from the claims callcenter-service pushes; `claim.sp` carries where the claim is on
// the Service Provider journey (Intimation > Handler Allocation > AI ILA > Handler ILA > FLA >
// Fee Bill > DMS), link / document counts and the AI ILA / Handler ILA / Fee Bill status.

const STAGES = [
    { label: 'Intimation', icon: FileAddOutlined },
    { label: 'Handler Allocation', icon: UserSwitchOutlined },
    { label: 'AI ILA', icon: RobotOutlined },
    { label: 'Handler ILA', icon: AuditOutlined },
    { label: 'FLA', icon: ProfileOutlined },
    { label: 'Fee Bill', icon: DollarOutlined },
    { label: 'DMS', icon: FolderOpenOutlined },
];
const CLOSED = ['Settled', 'Rejected'];
const ASSESSMENT = ['AI ILA', 'Handler ILA', 'FLA'];
const fmt = (n) => new Intl.NumberFormat('en-IN').format(n);

const Box = ({ children, className = '' }) => (
    <div className={`rounded-lg min-w-0 ${className}`} style={{ background: '#fff', boxShadow: '0 1px 4px rgba(15,23,42,0.12)' }}>{children}</div>
);

/** KPI tile: tinted round icon + coloured label, big number, link with arrow. */
const StageCard = ({ label, value, icon: Icon, color, bg, link, onClick }) => (
    <Box className="p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center justify-center rounded-full shrink-0" style={{ width: 36, height: 36, background: bg, color, fontSize: 17 }}><Icon /></span>
            <span className="text-[12.5px] font-semibold truncate" style={{ color }}>{label}</span>
        </div>
        <span className="text-[24px] font-bold leading-none pl-1" style={{ color: COLORS.textPrimary }}>{fmt(value)}</span>
        <button type="button" onClick={onClick} className="self-start flex items-center gap-1.5 text-[12px] font-medium" style={{ color: COLORS.primary }}>
            {link} <ArrowRightOutlined />
        </button>
    </Box>
);

const TONES = [
    { color: '#3B6FD8', bg: '#DCE6FA' },
    { color: '#1E8E4E', bg: '#D1EEDD' },
    { color: '#7C3AED', bg: '#EAE4FB' },
    { color: '#E8890C', bg: '#FDEBD3' },
    { color: '#0E8AA8', bg: '#D4EEF5' },
    { color: '#DB2777', bg: '#FBE1EE' },
    { color: '#4F46E5', bg: '#E0E4F7' },
];

const ClaimDetailsModal = ({ claim, onClose }) => (
    <Modal open={!!claim} onCancel={onClose} footer={null} title={claim ? `Claim ${claim.id}` : ''} width={640} destroyOnHidden>
        {claim && (
            <Descriptions size="small" column={2} bordered items={[
                { label: 'Insured', children: claim.customer ?? '—' },
                { label: 'Vehicle No', children: claim.vehicleNo ?? '—' },
                { label: 'Handler', children: claim.handler ?? 'Not allocated' },
                { label: 'Branch', children: claim.branch ?? '—' },
                { label: 'Stage', children: claim.sp.stage },
                { label: 'Intimated On', children: formatDateTime(claim.intimatedAt) },
                { label: 'AI ILA', children: <StatusTag status={claim.sp.aiIla} /> },
                { label: 'Handler ILA', children: <StatusTag status={claim.sp.handlerIla} /> },
                { label: 'Survey Link', children: claim.sp.linkSent ? 'Sent' : 'Not sent' },
                { label: 'Documents', children: `${claim.sp.docsReceived} received · ${claim.sp.docsPending} pending` },
                { label: 'Fee Bill', children: claim.sp.feeBill ?? '—' },
            ]} />
        )}
    </Modal>
);

const DashboardPage = () => {
    const navigate = useNavigate();
    const { items: claims } = useCollection('claims');
    const { handlers } = useDashboardStats();
    const [viewing, setViewing] = useState(null);

    // Claims of the Service Provider journey that are still being worked on.
    const spClaims = useMemo(() => claims.filter((c) => c.sp), [claims]);
    const open = useMemo(() => spClaims.filter((c) => !CLOSED.includes(c.stage) && c.sp.stage !== 'DMS'), [spClaims]);
    const atStage = (stage) => open.filter((c) => c.sp.stage === stage).length;
    const sum = (list, key) => list.reduce((s, c) => s + (c.sp[key] ?? 0), 0);

    const cards = [
        { label: 'Active claims', value: open.length, icon: TeamOutlined, link: 'View Claims', to: ROUTES.CLAIM_REPORT },
        { label: 'Claim Intimation', value: atStage('Intimation'), icon: FileAddOutlined, link: 'Manage Intimation', to: ROUTES.CLAIM_REPORT },
        { label: 'Handler Allocation', value: atStage('Handler Allocation'), icon: UserSwitchOutlined, link: 'Manage Handler', to: ROUTES.ALLOCATION_LOAD },
        { label: 'AI ILA', value: atStage('AI ILA'), icon: RobotOutlined, link: 'AI Assesment', to: ROUTES.CLAIM_REPORT },
        { label: 'Handler ILA', value: atStage('Handler ILA'), icon: AuditOutlined, link: 'Review & Validate', to: ROUTES.CLAIM_REPORT },
        { label: 'FLA', value: atStage('FLA'), icon: ProfileOutlined, link: 'Final Loss Assessment', to: ROUTES.CLAIM_REPORT },
        { label: 'Fee Bill', value: atStage('Fee Bill'), icon: DollarOutlined, link: 'Create / Review', to: ROUTES.CLAIM_REPORT },
    ];

    const byStatus = [
        { label: 'Open', value: open.length, color: '#0B4CD0' },
        { label: 'Link send', value: spClaims.filter((c) => c.sp.linkSent).length, color: '#2F9E5B' },
        { label: 'Docs Pending', value: open.filter((c) => c.sp.docsPending > 0).length, color: '#F39C12' },
        { label: 'Under assessment', value: open.filter((c) => ASSESSMENT.includes(c.sp.stage)).length, color: '#6D3FD6' },
        { label: 'FLA completed', value: spClaims.filter((c) => ['Fee Bill', 'DMS'].includes(c.sp.stage)).length, color: '#20A8C4' },
    ];
    const barMax = Math.max(1, spClaims.length);

    // AI ILA / Handler ILA queue: open claims whose assessment is not finished yet.
    const queue = open.filter((c) => c.sp.aiIla !== 'Completed' || c.sp.handlerIla !== 'Completed');
    const assigned = open.filter((c) => c.handlerId).length;
    const availableHandlers = handlers.filter((h) => h.load.status !== 'High Load').length;

    return (
        <div className="flex flex-col gap-3">
            <h1 className="text-xl md:text-2xl font-bold m-0" style={{ color: COLORS.headingBlue }}>Service Provider Dashboard</h1>

            <div className="grid gap-3 grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
                {cards.map((c, i) => <StageCard key={c.label} {...c} {...TONES[i]} onClick={() => navigate(c.to)} />)}
            </div>

            <Box className="p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <h3 className="text-[13.5px] font-semibold m-0" style={{ color: COLORS.primary }}>Claim Processing Workflow</h3>
                    <Button size="small" onClick={() => navigate(ROUTES.CLAIM_FLOW)} style={{ background: COLORS.primarySoft, color: COLORS.primary, border: 'none', height: 26 }}>
                        Full - Insurer Workflow
                    </Button>
                </div>
                <div className="mt-2 rounded-md px-3 py-1.5 text-[12px]" style={{ background: COLORS.bgBanner, color: COLORS.textPrimary }}>
                    Service Provider: Surveyor Allocation, Recommendation and Payment Approval are hidden. Fee Bill is enabled.
                </div>
                <div className="mt-3 overflow-x-auto">
                    <div className="flex items-start" style={{ minWidth: STAGES.length * 90 }}>
                        {STAGES.map(({ label, icon: Icon }, i) => (
                            <React.Fragment key={label}>
                                <div className="flex flex-col items-center gap-1 shrink-0" style={{ width: 96 }} title={`${atStage(label)} open claim(s)`}>
                                    <span className="flex items-center justify-center rounded-full text-white" style={{ width: 44, height: 44, fontSize: 19, background: COLORS.primary }}><Icon /></span>
                                    <span className="text-[11.5px] text-center leading-tight" style={{ color: COLORS.primary }}>{label}</span>
                                </div>
                                {i < STAGES.length - 1 && <span className="flex-1 mt-[22px] min-w-[8px]" style={{ borderTop: `1.5px solid ${COLORS.primary}`, opacity: 0.6 }} />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </Box>

            <div className="grid gap-3 grid-cols-1 xl:grid-cols-2">
                <Box className="p-4">
                    <h3 className="text-[16px] font-semibold m-0 mb-3" style={{ color: COLORS.textPrimary }}>Claim Intimation</h3>
                    <div className="flex flex-wrap gap-3">
                        <Button type="primary" icon={<MailOutlined />} onClick={() => navigate(ROUTES.COMMUNICATION)}>Send Claim Link</Button>
                        <Button type="primary" icon={<FileSyncOutlined />} onClick={() => navigate(ROUTES.DOCUMENT_TEMPLATES)}>Generate Pending Documents</Button>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-[12.5px] font-medium" style={{ color: COLORS.textPrimary }}>
                        <span><LinkOutlined /> Link Sent | {fmt(byStatus[1].value)}</span>
                        <span><LinkOutlined /> Documents Pending | {fmt(sum(open, 'docsPending'))}</span>
                        <span><LinkOutlined /> Documents Received | {fmt(sum(spClaims, 'docsReceived'))}</span>
                    </div>
                </Box>

                <Box className="p-4">
                    <h3 className="text-[16px] font-semibold m-0 mb-3" style={{ color: COLORS.textPrimary }}>Claim By Status</h3>
                    <div className="flex flex-col gap-3.5">
                        {byStatus.map((s) => (
                            <div key={s.label} className="grid items-center gap-3" style={{ gridTemplateColumns: '120px 1fr 40px' }}>
                                <span className="text-[12.5px] font-medium">{s.label}</span>
                                <div className="h-[10px] rounded-full overflow-hidden" style={{ background: '#D9D9D9' }}>
                                    <div className="h-full rounded-full" style={{ width: `${(s.value / barMax) * 100}%`, background: s.color }} />
                                </div>
                                <span className="text-[12.5px] font-medium text-right">{fmt(s.value)}</span>
                            </div>
                        ))}
                    </div>
                </Box>
            </div>

            <DataTable
                title="AI ILA/Handler ILA Queue"
                dataSource={queue}
                pageSize={10}
                scrollX={760}
                locale={{ emptyText: 'No claims waiting for AI ILA or Handler ILA.' }}
                columns={[
                    { title: 'CLAIM ID', dataIndex: 'id', align: 'center', render: (v) => <span className="font-semibold">{v}</span> },
                    { title: 'INSURED', dataIndex: 'customer', align: 'center', render: (v) => v ?? '—' },
                    { title: 'AI ILA STATUS', key: 'aiIla', align: 'center', render: (_, c) => <StatusTag status={c.sp.aiIla} minWidth={90} /> },
                    { title: 'HANDLER ILA STATUS', key: 'handlerIla', align: 'center', render: (_, c) => <StatusTag status={c.sp.handlerIla} minWidth={90} /> },
                    {
                        title: 'ACTION',
                        key: 'action',
                        align: 'center',
                        render: (_, c) => (
                            <button type="button" onClick={() => setViewing(c)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[12px]" style={{ background: COLORS.primarySoft, color: COLORS.primary }}>
                                View <EyeOutlined />
                            </button>
                        ),
                    },
                ]}
            />

            <div className="grid gap-3 grid-cols-1 xl:grid-cols-2">
                <Box className="p-4">
                    <h3 className="text-[16px] font-semibold m-0 mb-3" style={{ color: COLORS.textPrimary }}>Fee Bill &amp; DMS</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            ['Fee Bills Pending', spClaims.filter((c) => c.sp.feeBill === 'Pending').length, FileDoneOutlined, TONES[2]],
                            ['Submitted', spClaims.filter((c) => c.sp.feeBill === 'Submitted').length, FileDoneOutlined, TONES[1]],
                            ['Documents Stored', sum(spClaims, 'docsReceived'), DatabaseOutlined, TONES[0]],
                        ].map(([label, value, Icon, t]) => (
                            <div key={label} className="rounded-lg p-3" style={{ border: `1px solid ${COLORS.border}` }}>
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center rounded-full" style={{ width: 32, height: 32, background: t.bg, color: t.color }}><Icon /></span>
                                    <span className="text-[12.5px] font-semibold">{label}</span>
                                </div>
                                <div className="text-[24px] font-bold mt-2">{fmt(value)}</div>
                            </div>
                        ))}
                    </div>
                    <Button type="primary" block icon={<DatabaseOutlined />} className="mt-3" onClick={() => navigate(ROUTES.DOCUMENTS_DMS ?? ROUTES.CLAIM_REPORT)}>Open DMS</Button>
                </Box>

                <Box className="p-4">
                    <h3 className="text-[16px] font-semibold m-0 mb-3" style={{ color: COLORS.textPrimary }}>Handler Allocation Summary</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            ['Available Handlers', availableHandlers, '#2563EB', ROUTES.ACTIVE_USERS],
                            ['Assigned Claims', assigned, '#15803D', ROUTES.ALLOCATION_LOAD],
                            ['Unassigned Claims', open.length - assigned, '#F28C3B', ROUTES.ALLOCATION_LOAD],
                        ].map(([label, value, color, to]) => (
                            <button key={label} type="button" onClick={() => navigate(to)} className="rounded-lg p-3 flex flex-col items-center gap-2" style={{ border: `1px solid ${COLORS.border}` }}>
                                <span className="flex items-center justify-center rounded-full text-white" style={{ width: 48, height: 48, background: color, fontSize: 20 }}><UserOutlined /></span>
                                <span className="text-[12.5px] font-semibold">{label}</span>
                                <span className="text-[24px] font-bold leading-none">{fmt(value)}</span>
                            </button>
                        ))}
                    </div>
                </Box>
            </div>

            <ClaimDetailsModal claim={viewing} onClose={() => setViewing(null)} />
        </div>
    );
};

export default DashboardPage;
