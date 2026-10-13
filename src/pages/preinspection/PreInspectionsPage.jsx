import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Input, Select, Button, Drawer, Image, Spin, Empty, App, Descriptions, Tag, Modal, Form } from 'antd';
import {
    SearchOutlined, FileSearchOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, EditOutlined, ReloadOutlined, EnvironmentOutlined, PlusOutlined,
} from '@ant-design/icons';
import PageTitle from '../../components/ui/PageTitle';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusTag from '../../components/ui/StatusTag';
import { COLORS } from '../../constants/theme';
import { api } from '../../api/client';
import { useCollection, useLogChange, useRoles } from '../../store/AdminStore';
import { formatDateTime, matchesQuery } from '../../utils/format';

// Status of an inspection as the admin sees it.
const STATUS_LABEL = { Assigned: 'Assigned', Draft: 'In Progress', Submitted: 'Pending Review', Approved: 'Approved', Rejected: 'Rejected' };
// Users who can sign in to the app (same rule as admin-service's FIELD_ROLES).
const FIELD_ROLE_KEYS = ['preinspection-agent', 'preinspection-surveyor', 'internal-surveyor', 'external-surveyor'];
const TILES = [
    { key: 'all', label: 'Total', icon: <FileSearchOutlined />, tone: 'blue', match: () => true },
    { key: 'Submitted', label: 'Pending Review', icon: <ClockCircleOutlined />, tone: 'orange', match: (i) => i.status === 'Submitted' },
    { key: 'Approved', label: 'Approved', icon: <CheckCircleOutlined />, tone: 'green', match: (i) => i.status === 'Approved' },
    { key: 'Rejected', label: 'Rejected', icon: <CloseCircleOutlined />, tone: 'red', match: (i) => i.status === 'Rejected' },
    { key: 'Draft', label: 'Assigned / In Progress', icon: <EditOutlined />, tone: 'purple', match: (i) => i.status === 'Draft' || i.status === 'Assigned' },
];

// Capture slots of the app -> readable labels. File links are signed, same-origin
// /api/v1/media/... URLs (nginx / Vite proxy /api to admin-service).
const SLOT_LABELS = {
    'front-side': 'Front', 'front-rh-side': 'Front RH', 'rh-side': 'RH Side', 'rear-rh-side': 'Rear RH', 'rear-side': 'Rear', 'rear-lh-side': 'Rear LH', 'lh-side': 'LH Side',
    dashboard: 'Dashboard', walkaround: 'Walk-around video', customer: 'Customer / Representative', inspector: 'Inspection agent', bill: 'Repair bill', main: 'Reinspection photo',
    policy_copy: 'Previous policy copy', puc: 'PUC', rc: 'Registration Certificate', aadhar: 'Aadhar Card', pan: 'Pan Card', others: 'Other document',
};
const slotLabel = (slot) => {
    if (SLOT_LABELS[slot]) return SLOT_LABELS[slot];
    const [doc, ...rest] = slot.split('_');
    if (SLOT_LABELS[doc]) return `${SLOT_LABELS[doc]} · ${rest.join(' ')}`;
    return slot.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

/** Active app users (agents / surveyors with mobile access) for the assign selects. */
const useFieldAgents = () => {
    const { items: users } = useCollection('users');
    const roles = useRoles();
    return useMemo(() => users
        .filter((u) => FIELD_ROLE_KEYS.includes(u.roleKey) && u.status === 'Active' && u.platform !== 'web')
        .map((u) => ({ value: u.id, label: `${u.name} · ${u.userId} (${roles.byKey[u.roleKey]?.name ?? u.roleKey})` })), [users, roles.byKey]);
};

const Section = ({ title, children, extra }) => (
    <section className="rounded-md p-3 mb-3" style={{ background: '#fff', border: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-[14px] font-semibold m-0" style={{ color: COLORS.primary }}>{title}</h3>
            {extra}
        </div>
        {children}
    </section>
);

const Gps = ({ m }) => (m.latitude != null ? (
    <a className="text-[10.5px]" href={`https://maps.google.com/?q=${m.latitude},${m.longitude}`} target="_blank" rel="noreferrer">
        <EnvironmentOutlined /> {m.latitude.toFixed(5)}, {m.longitude.toFixed(5)}
    </a>
) : null);

/** Photo grid with captions (label, GPS, time); click to preview. */
const PhotoGrid = ({ items }) => (items.length ? (
    <Image.PreviewGroup>
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {items.map((m) => (
                <figure key={m.id} className="m-0 rounded-md overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
                    {m.mime === 'application/pdf'
                        ? <a href={m.url} target="_blank" rel="noreferrer" className="flex items-center justify-center text-[12px]" style={{ height: 110 }}>Open PDF</a>
                        : <Image src={m.url} alt={slotLabel(m.slot)} height={110} width="100%" style={{ objectFit: 'cover' }} />}
                    <figcaption className="px-1.5 py-1 text-[11px] leading-tight">
                        <div className="font-medium truncate">{slotLabel(m.slot)}</div>
                        <div style={{ color: COLORS.textMuted }}>{formatDateTime(m.capturedAt ?? m.uploadedAt)}</div>
                        <Gps m={m} />
                    </figcaption>
                </figure>
            ))}
        </div>
    </Image.PreviewGroup>
) : <span className="text-[12px]" style={{ color: COLORS.textMuted }}>Nothing uploaded.</span>);

/** Detail drawer: everything the agent captured + the admin's review. */
const InspectionDrawer = ({ id, onClose, onReviewed, onCancelled }) => {
    const { message, modal } = App.useApp();
    const agents = useFieldAgents();
    const [reassignTo, setReassignTo] = useState(null);
    const logChange = useLogChange();
    const [item, setItem] = useState(null);
    const [error, setError] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [saving, setSaving] = useState(null);

    useEffect(() => {
        if (!id) return undefined;
        let live = true;
        setItem(null);
        setError(null);
        setRemarks('');
        api.get(`/preinspections/${encodeURIComponent(id)}`)
            .then((d) => { if (live) { setItem(d); setRemarks(d.reviewRemarks ?? ''); } })
            .catch((err) => { if (live) setError(err.message); });
        return () => { live = false; };
    }, [id]);

    const review = async (decision) => {
        if (decision === 'Rejected' && !remarks.trim()) {
            message.warning('Give a reason for rejecting.');
            return;
        }
        setSaving(decision);
        try {
            const updated = await api.patch(`/preinspections/${encodeURIComponent(id)}/review`, { decision, remarks: remarks.trim() || undefined });
            setItem(updated);
            logChange('Pre-Inspection', `${id} review`, STATUS_LABEL[item.status], decision);
            message.success(`${id} ${decision.toLowerCase()}`);
            onReviewed(updated);
        } catch (err) {
            message.error(err.message);
        } finally {
            setSaving(null);
        }
    };

    const reassign = async () => {
        setSaving('assign');
        try {
            const updated = await api.patch(`/preinspections/${encodeURIComponent(id)}/assign`, { agentId: reassignTo });
            logChange('Pre-Inspection', `${id} agent`, item.agentName ?? '—', updated.agentName);
            setItem(updated);
            setReassignTo(null);
            message.success(`${id} reassigned to ${updated.agentName}`);
            onReviewed(updated);
        } catch (err) {
            message.error(err.message);
        } finally {
            setSaving(null);
        }
    };

    const cancelCase = () => modal.confirm({
        title: `Cancel ${id}?`,
        content: 'The case disappears from the agent\'s app.',
        okText: 'Cancel case',
        okButtonProps: { danger: true },
        onOk: async () => {
            try {
                await api.del(`/preinspections/${encodeURIComponent(id)}`);
                logChange('Pre-Inspection', `${id} cancelled`, item.agentName ?? '—', '—');
                message.success(`${id} cancelled`);
                onCancelled(id);
            } catch (err) {
                message.error(err.message);
            }
        },
    });

    const media = item?.media ?? [];
    const ofKind = (k) => media.filter((m) => m.kind === k);
    const video = ofKind('video')[0];
    // Where the vehicle was photographed (the app sends GPS with each photo).
    const gpsPhoto = media.find((m) => m.latitude != null);

    return (
        <Drawer open={!!id} onClose={onClose} size={820} title={id ? `Pre-Inspection ${id}` : ''} destroyOnHidden
            extra={item && <StatusTag status={STATUS_LABEL[item.status]} />}
        >
            {error && <Empty description={error} />}
            {!item && !error && <div className="flex justify-center py-16"><Spin /></div>}
            {item && (
                <div className="text-[12.5px]">
                    <Section title="Summary">
                        <Descriptions size="small" column={{ xs: 1, sm: 2 }} items={[
                            { label: 'PI Ref. Number', children: item.id },
                            { label: 'Survey type', children: item.surveyType === 'Valuation' ? 'Valuation' : 'Pre-Inspection' },
                            { label: item.agentRole === 'surveyor' ? 'Surveyor' : 'Agent', children: `${item.agentName ?? '—'} (${item.agentUserId ?? item.agentId})` },
                            { label: 'Workflow', children: item.workflow === 'damage' ? 'Damage photos' : item.workflow === 'others' ? 'Other photos + declarations' : '—' },
                            { label: 'Started', children: formatDateTime(item.createdAt) },
                            { label: 'Submitted', children: formatDateTime(item.submittedAt) },
                            { label: 'Agent recommendation', children: item.agentRecommendation ? <Tag color={item.agentRecommendation === 'Approved' ? 'green' : 'red'}>{item.agentRecommendation === 'Approved' ? 'Recommended' : 'Not recommended'}</Tag> : '—' },
                            { label: 'Inspection location', children: item.latitude != null ? <Gps m={item} /> : (gpsPhoto ? <Gps m={gpsPhoto} /> : '—') },
                        ]} />
                    </Section>

                    <Section title="Owner & Vehicle Details">
                        <Descriptions size="small" column={{ xs: 1, sm: 2 }} items={[
                            ['Owner name', item.ownerName], ['Mobile', item.mobile], ['Email', item.email], ['Registration no.', item.registrationNumber],
                            ['State', item.state], ['Registration date', item.registrationDate], ['Product', item.product], ['Make / Model', `${item.make ?? ''} ${item.model ?? ''}`],
                            ['Variant', item.variant], ['Mfg. year', item.manufacturingYear], ['Owner serial no.', item.ownerSerialNumber], ['Odometer (KM)', item.odometer],
                            ...(item.idv ? [['Market value / IDV', `₹ ${item.idv}`]] : []),
                        ].map(([label, v]) => ({ label, children: v || '—' }))} />
                    </Section>

                    <Section title={`Vehicle Photos (${ofKind('photo').length})`}><PhotoGrid items={ofKind('photo')} /></Section>

                    <Section title="Walk-around Video">
                        {video ? <video src={video.url} controls preload="metadata" className="w-full rounded-md" style={{ maxHeight: 360, background: '#000' }} /> : <span style={{ color: COLORS.textMuted }}>No video uploaded.</span>}
                    </Section>

                    <Section title={`Documents (${ofKind('document').length})`}><PhotoGrid items={ofKind('document')} /></Section>

                    {item.workflow === 'others' && (
                        <Section title="Declarations & Signatures">
                            <div className="mb-2 flex flex-wrap gap-2">
                                <Tag color={item.customerDeclaration ? 'green' : 'default'}>Customer declaration {item.customerDeclaration ? 'accepted' : 'not accepted'}</Tag>
                                <Tag color={item.inspectorDeclaration ? 'green' : 'default'}>Inspector declaration {item.inspectorDeclaration ? 'accepted' : 'not accepted'}</Tag>
                            </div>
                            <PhotoGrid items={ofKind('signature')} />
                        </Section>
                    )}

                    {item.workflow === 'damage' && (
                        <Section title="Repair & Reinspection" extra={item.repairSubmittedAt && <span className="text-[11px]">Submitted {formatDateTime(item.repairSubmittedAt)}</span>}>
                            <PhotoGrid items={[...ofKind('reinspection'), ...ofKind('repair')]} />
                        </Section>
                    )}

                    <Section title="Review">
                        {['Assigned', 'Draft'].includes(item.status) ? (
                            <>
                                <p className="m-0 mb-2" style={{ color: COLORS.textMuted }}>
                                    {item.status === 'Assigned' ? `Assigned by ${item.assignedBy ?? 'admin'} — the agent has not started it yet.` : 'The agent is working on it — review opens once it is submitted.'}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <Select value={reassignTo} onChange={setReassignTo} placeholder="Reassign to…" options={agents.filter((a) => a.value !== item.agentId)} style={{ minWidth: 260 }} showSearch={{ optionFilterProp: 'label' }} />
                                    <Button onClick={reassign} disabled={!reassignTo} loading={saving === 'assign'}>Reassign</Button>
                                    {item.status === 'Assigned' && <Button danger onClick={cancelCase}>Cancel Case</Button>}
                                </div>
                            </>
                        ) : (
                            <>
                                {item.reviewedAt && (
                                    <p className="m-0 mb-2">Last review: <b>{item.status}</b> by {item.reviewedBy} on {formatDateTime(item.reviewedAt)}</p>
                                )}
                                <Input.TextArea rows={2} maxLength={500} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Remarks (required to reject)" className="mb-2" />
                                <div className="flex gap-2">
                                    <Button type="primary" loading={saving === 'Approved'} disabled={!!saving} onClick={() => review('Approved')}>Approve</Button>
                                    <Button danger loading={saving === 'Rejected'} disabled={!!saving} onClick={() => review('Rejected')}>Reject</Button>
                                </div>
                            </>
                        )}
                    </Section>
                </div>
            )}
        </Drawer>
    );
};

/**
 * Pre-Inspections -- what agents and surveyors submit from the Pre-Inspection
 * Agent app (owner & vehicle details, photos with GPS, walk-around video,
 * documents, declarations, signatures, repair & reinspection photos), with
 * the admin's Approve / Reject review.
 */
const PreInspectionsPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tile, setTile] = useState('all');
    const [q, setQ] = useState('');
    const [type, setType] = useState('all');
    const [openId, setOpenId] = useState(null);
    const [assignOpen, setAssignOpen] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [form] = Form.useForm();
    const agents = useFieldAgents();
    const logChange = useLogChange();
    const { message } = App.useApp();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setItems(await api.get('/preinspections'));
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);

    const assign = async (values) => {
        setAssigning(true);
        try {
            const created = await api.post('/preinspections', values);
            setItems((list) => [{ ...created, mediaCounts: {} }, ...list]);
            logChange('Pre-Inspection', 'Assigned', '—', `${created.id} → ${created.agentName}`);
            message.success(`${created.id} assigned to ${created.agentName}`);
            setAssignOpen(false);
        } catch (err) {
            message.error(err.message);
        } finally {
            setAssigning(false);
        }
    };

    const rows = useMemo(() => items.filter((i) => TILES.find((t) => t.key === tile).match(i)
        && (type === 'all' || i.surveyType === type)
        && matchesQuery(i, q, ['id', 'ownerName', 'registrationNumber', 'make', 'model', 'agentName', 'agentUserId', 'mobile'])), [items, tile, type, q]);

    const columns = [
        { title: 'PI Ref.', dataIndex: 'id', width: 110 },
        { title: 'Insured / Reg. No.', render: (_, i) => <><div className="font-medium">{i.ownerName}</div><div className="text-[11px]" style={{ color: COLORS.textMuted }}>{i.registrationNumber}</div></> },
        { title: 'Vehicle', render: (_, i) => [i.make, i.model, i.variant].filter(Boolean).join(' ') },
        { title: 'Survey', render: (_, i) => (i.surveyType === 'Valuation' ? 'Valuation' : 'Pre-Inspection') },
        { title: 'Agent', render: (_, i) => <><div>{i.agentName ?? '—'}</div><div className="text-[11px]" style={{ color: COLORS.textMuted }}>{i.agentRole === 'surveyor' ? 'Surveyor' : 'Agent'} · {i.agentUserId}</div></> },
        { title: 'Files', align: 'center', render: (_, i) => Object.values(i.mediaCounts ?? {}).reduce((a, b) => a + b, 0) },
        { title: 'Status', align: 'center', render: (_, i) => <StatusTag status={STATUS_LABEL[i.status]} minWidth={100} /> },
        { title: 'Submitted On', render: (_, i) => (i.submittedAt ? formatDateTime(i.submittedAt) : '—'), width: 170 },
        { title: 'Action', align: 'center', render: (_, i) => <Button size="small" onClick={() => setOpenId(i.id)} style={{ background: COLORS.primarySoft, color: COLORS.primary, border: 'none' }}>View</Button> },
    ];

    return (
        <>
            <PageTitle
                title="Pre-Inspections"
                subtitle="Assigned to and submitted from the Pre-Inspection Agent app"
                extra={(
                    <>
                        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Refresh</Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAssignOpen(true)}>Assign Pre-Inspection</Button>
                    </>
                )}
            />

            <div className="grid gap-2 grid-cols-2 lg:grid-cols-5 mb-3">
                {TILES.map((t) => (
                    <StatCard key={t.key} label={t.label} value={items.filter(t.match).length} icon={t.icon} tone={t.tone} active={tile === t.key} onClick={() => setTile(t.key)} />
                ))}
            </div>

            <div className="filter-bar flex flex-wrap gap-2 mb-2">
                <Input allowClear value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search PI ref, insured, reg. no., agent…" suffix={<SearchOutlined />} style={{ width: 'min(100%, 340px)' }} />
                <Select value={type} onChange={setType} style={{ width: 170 }} options={[{ value: 'all', label: 'All survey types' }, { value: 'pre inspection', label: 'Pre-Inspection' }, { value: 'Valuation', label: 'Valuation' }]} />
            </div>

            {error ? <Empty description={error} /> : (
                <DataTable columns={columns} dataSource={rows} loading={loading} pageSize={10} scrollX={1100} locale={{ emptyText: 'No pre-inspections yet — they appear here as agents submit them from the app' }}
                    onRow={(i) => ({ onDoubleClick: () => setOpenId(i.id) })}
                />
            )}

            <InspectionDrawer
                id={openId}
                onClose={() => setOpenId(null)}
                onReviewed={(u) => setItems((list) => list.map((x) => (x.id === u.id ? { ...x, ...u, mediaCounts: x.mediaCounts } : x)))}
                onCancelled={(cid) => { setItems((list) => list.filter((x) => x.id !== cid)); setOpenId(null); }}
            />

            <Modal title="Assign Pre-Inspection" open={assignOpen} onCancel={() => setAssignOpen(false)} onOk={() => form.submit()} okText="Assign" okButtonProps={{ loading: assigning }} destroyOnHidden>
                <Form form={form} layout="vertical" preserve={false} onFinish={assign} initialValues={{ surveyType: 'pre inspection' }}>
                    <Form.Item name="agentId" label="Agent / Surveyor" rules={[{ required: true, message: 'Select who will inspect' }]}
                        extra={agents.length ? 'They see the case as Pending in the app.' : 'No app users yet — create one in Create Users (role Pre-Inspection Agent, platform Mobile).'}>
                        <Select placeholder="Select agent or surveyor" options={agents} showSearch={{ optionFilterProp: 'label' }} />
                    </Form.Item>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                        <Form.Item name="ownerName" label="Insured name" rules={[{ required: true, message: 'Enter insured name' }]}><Input maxLength={80} /></Form.Item>
                        <Form.Item name="mobile" label="Mobile number" rules={[{ required: true, message: 'Enter mobile number' }, { pattern: /^(\+91[\s-]?)?[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile number' }]}><Input maxLength={14} /></Form.Item>
                        <Form.Item name="registrationNumber" label="Registration number" rules={[{ required: true, message: 'Enter registration number' }, { pattern: /^[A-Za-z0-9 ]{4,15}$/, message: 'Letters and numbers only' }]}><Input placeholder="MH12AB1234" /></Form.Item>
                        <Form.Item name="email" label="Email (optional)" rules={[{ type: 'email', message: 'Enter a valid email' }]}><Input /></Form.Item>
                    </div>
                    <Form.Item name="surveyType" label="Survey type">
                        <Select options={[{ value: 'pre inspection', label: 'Pre-Inspection' }, { value: 'Valuation', label: 'Valuation' }]} />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default PreInspectionsPage;
