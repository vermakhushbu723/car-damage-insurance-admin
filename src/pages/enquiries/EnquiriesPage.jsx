import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Input, Select, Button, Drawer, Empty, App, Descriptions } from 'antd';
import {
    SearchOutlined, InboxOutlined, BellOutlined, PhoneOutlined, StarOutlined, CheckCircleOutlined, ReloadOutlined, MailOutlined,
} from '@ant-design/icons';
import PageTitle from '../../components/ui/PageTitle';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusTag from '../../components/ui/StatusTag';
import { COLORS } from '../../constants/theme';
import { api } from '../../api/client';
import { useLogChange } from '../../store/AdminStore';
import { formatDateTime, matchesQuery } from '../../utils/format';

// Same lists as the website's Contact form (ibima-assist-website/src/data/enquiry.js).
const INTEREST_LABEL = {
    'motor-claim-survey': 'Motor Claim Survey',
    'pre-inspection': 'Pre-Inspection & Break-in',
    'ai-damage-assessment': 'AI Damage Assessment',
    'intimation-management': 'Intimation Management',
    'surveyor-mobile-app': 'Surveyor Mobile App',
    'partner-network-console': 'Partner Network Console',
    'non-motor-claims': 'Non-Motor Claims',
    'whole-platform': 'The whole platform',
    'not-sure': 'Not sure yet',
};
const STATUS = {
    new: 'New', contacted: 'Contacted', qualified: 'Qualified', closed: 'Closed', spam: 'Spam',
};
const TILES = [
    { key: 'all', label: 'Total', icon: <InboxOutlined />, tone: 'blue', match: () => true },
    { key: 'new', label: 'New', icon: <BellOutlined />, tone: 'orange', match: (e) => e.status === 'new' },
    { key: 'contacted', label: 'Contacted', icon: <PhoneOutlined />, tone: 'purple', match: (e) => e.status === 'contacted' },
    { key: 'qualified', label: 'Qualified', icon: <StarOutlined />, tone: 'green', match: (e) => e.status === 'qualified' },
    { key: 'closed', label: 'Closed / Spam', icon: <CheckCircleOutlined />, tone: 'red', match: (e) => e.status === 'closed' || e.status === 'spam' },
];

/** Detail + follow-up (status, notes, delete). */
const EnquiryDrawer = ({ enquiry, onClose, onSaved, onDeleted }) => {
    const { message, modal } = App.useApp();
    const logChange = useLogChange();
    const [status, setStatus] = useState(enquiry?.status);
    const [notes, setNotes] = useState(enquiry?.notes ?? '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setStatus(enquiry?.status);
        setNotes(enquiry?.notes ?? '');
    }, [enquiry]);

    const dirty = enquiry && (status !== enquiry.status || (notes ?? '') !== (enquiry.notes ?? ''));

    const save = async () => {
        setSaving(true);
        try {
            const updated = await api.patch(`/enquiries/${enquiry.id}`, { status, notes });
            if (status !== enquiry.status) logChange('Enquiries', `${enquiry.id} · ${enquiry.name}`, STATUS[enquiry.status], STATUS[status]);
            message.success('Enquiry updated');
            onSaved(updated);
        } catch (err) {
            message.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const remove = () => modal.confirm({
        title: `Delete ${enquiry.id}?`,
        content: 'Use this for spam. It cannot be undone.',
        okText: 'Delete',
        okButtonProps: { danger: true },
        onOk: async () => {
            try {
                await api.del(`/enquiries/${enquiry.id}`);
                logChange('Enquiries', `${enquiry.id} deleted`, enquiry.name, '—');
                message.success(`${enquiry.id} deleted`);
                onDeleted(enquiry.id);
            } catch (err) {
                message.error(err.message);
            }
        },
    });

    return (
        <Drawer open={!!enquiry} onClose={onClose} size={620} title={enquiry ? `Enquiry ${enquiry.id}` : ''} destroyOnHidden
            extra={enquiry && <StatusTag status={STATUS[enquiry.status]} />}
        >
            {enquiry && (
                <div className="text-[12.5px] flex flex-col gap-3">
                    <Descriptions size="small" column={1} bordered items={[
                        { label: 'Name', children: enquiry.name },
                        { label: 'Organisation', children: enquiry.organisation },
                        { label: 'Email', children: <a href={`mailto:${enquiry.email}`}><MailOutlined /> {enquiry.email}</a> },
                        { label: 'Phone', children: <a href={`tel:${enquiry.phone.replace(/[^\d+]/g, '')}`}><PhoneOutlined /> {enquiry.phone}</a> },
                        { label: 'You are a', children: enquiry.orgType || '—' },
                        { label: 'Interested in', children: INTEREST_LABEL[enquiry.interest] ?? enquiry.interest ?? '—' },
                        { label: 'Received', children: `${formatDateTime(enquiry.createdAt)} · ${enquiry.source === 'app' ? 'IBima Assist app' : 'Website'}` },
                    ]} />
                    <div>
                        <div className="font-semibold mb-1" style={{ color: COLORS.primary }}>What are you trying to fix?</div>
                        <div className="rounded-md p-2.5 whitespace-pre-wrap" style={{ background: COLORS.bgField, border: `1px solid ${COLORS.border}` }}>{enquiry.message}</div>
                    </div>
                    <div className="rounded-md p-3" style={{ border: `1px solid ${COLORS.border}` }}>
                        <div className="font-semibold mb-2" style={{ color: COLORS.primary }}>Follow-up</div>
                        <Select value={status} onChange={setStatus} style={{ width: 200 }} options={Object.entries(STATUS).map(([value, label]) => ({ value, label }))} className="mb-2" aria-label="Status" />
                        <Input.TextArea rows={3} maxLength={4000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (call outcome, demo date…)" />
                        {enquiry.handledBy && <div className="mt-1 text-[11px]" style={{ color: COLORS.textMuted }}>Last updated by {enquiry.handledBy} · {formatDateTime(enquiry.updatedAt)}</div>}
                        <div className="flex justify-between gap-2 mt-2">
                            <Button danger onClick={remove}>Delete</Button>
                            <Button type="primary" onClick={save} loading={saving} disabled={!dirty}>Save</Button>
                        </div>
                    </div>
                </div>
            )}
        </Drawer>
    );
};

/**
 * Enquiries -- Contact form submissions from the IBima Assist app
 * (ibima-assist-app), with status and notes for the follow-up.
 */
const EnquiriesPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tile, setTile] = useState('all');
    const [q, setQ] = useState('');
    const [interest, setInterest] = useState('all');
    const [openId, setOpenId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setItems(await api.get('/enquiries'));
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);

    const rows = useMemo(() => items.filter((e) => TILES.find((t) => t.key === tile).match(e)
        && (interest === 'all' || e.interest === interest)
        && matchesQuery(e, q, ['id', 'name', 'organisation', 'email', 'phone', 'message', 'orgType'])), [items, tile, interest, q]);
    const open = items.find((e) => e.id === openId) ?? null;

    const columns = [
        { title: 'ID', dataIndex: 'id', width: 100 },
        { title: 'Name / Organisation', render: (_, e) => <><div className="font-medium">{e.name}</div><div className="text-[11px]" style={{ color: COLORS.textMuted }}>{e.organisation}</div></> },
        { title: 'Contact', render: (_, e) => <><div>{e.email}</div><div className="text-[11px]" style={{ color: COLORS.textMuted }}>{e.phone}</div></> },
        { title: 'You are a', dataIndex: 'orgType', render: (v) => v || '—' },
        { title: 'Interested in', dataIndex: 'interest', render: (v) => INTEREST_LABEL[v] ?? (v || '—') },
        { title: 'Status', align: 'center', render: (_, e) => <StatusTag status={STATUS[e.status]} minWidth={84} /> },
        { title: 'Received', dataIndex: 'createdAt', render: formatDateTime, width: 170 },
        { title: 'Action', align: 'center', render: (_, e) => <Button size="small" onClick={() => setOpenId(e.id)} style={{ background: COLORS.primarySoft, color: COLORS.primary, border: 'none' }}>View</Button> },
    ];

    return (
        <>
            <PageTitle title="Enquiries" subtitle="Contact form submissions from the IBima Assist app" extra={<Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Refresh</Button>} />

            <div className="grid gap-2 grid-cols-2 lg:grid-cols-5 mb-3">
                {TILES.map((t) => <StatCard key={t.key} label={t.label} value={items.filter(t.match).length} icon={t.icon} tone={t.tone} active={tile === t.key} onClick={() => setTile(t.key)} />)}
            </div>

            <div className="filter-bar flex flex-wrap gap-2 mb-2">
                <Input allowClear value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, organisation, email, phone…" suffix={<SearchOutlined />} style={{ width: 'min(100%, 340px)' }} />
                <Select value={interest} onChange={setInterest} style={{ width: 220 }} options={[{ value: 'all', label: 'All solutions' }, ...Object.entries(INTEREST_LABEL).map(([value, label]) => ({ value, label }))]} />
            </div>

            {error ? <Empty description={error} /> : (
                <DataTable columns={columns} dataSource={rows} loading={loading} pageSize={10} scrollX={1050}
                    locale={{ emptyText: 'No enquiries yet — they appear here when someone submits the Contact form in the app' }}
                    onRow={(e) => ({ onDoubleClick: () => setOpenId(e.id) })}
                />
            )}

            <EnquiryDrawer
                enquiry={open}
                onClose={() => setOpenId(null)}
                onSaved={(u) => setItems((list) => list.map((x) => (x.id === u.id ? u : x)))}
                onDeleted={(id) => { setItems((list) => list.filter((x) => x.id !== id)); setOpenId(null); }}
            />
        </>
    );
};

export default EnquiriesPage;
