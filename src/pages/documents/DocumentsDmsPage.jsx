import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { App, Button, Descriptions, Empty, Input, Segmented, Select, Spin, Tag, Upload } from 'antd';
import {
    ArrowLeftOutlined, BookOutlined, CheckCircleOutlined, CloudUploadOutlined, DeleteOutlined, DownloadOutlined, ExperimentOutlined,
    FileTextOutlined, InfoCircleOutlined, LoadingOutlined, SyncOutlined, UploadOutlined, MessageOutlined, IdcardOutlined, FileProtectOutlined,
    SafetyCertificateOutlined, FolderOutlined, SolutionOutlined, FilePdfOutlined, AuditOutlined,
} from '@ant-design/icons';
import PageTitle from '../../components/ui/PageTitle';
import StatusTag from '../../components/ui/StatusTag';
import { COLORS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { api, uploadFile } from '../../api/client';
import { useLogChange } from '../../store/AdminStore';
import { formatDateTime } from '../../utils/format';
import { PhotoGrid, Gps, slotLabel } from '../preinspection/PreInspectionsPage';

const { Dragger } = Upload;
const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';

// Document types per record kind. Pre-inspection = the app's Document Upload
// screen (slot `<key>_<side or n>`); enquiry = files the admin attaches.
const DOC_TYPES = {
    inspection: [
        { key: 'policy_copy', code: 'POL', label: 'Previous policy copy', icon: FileProtectOutlined },
        { key: 'puc', code: 'PUC', label: 'Pollution certificate', icon: SafetyCertificateOutlined },
        { key: 'rc', code: 'RC', label: 'Registration Certificate', icon: FileTextOutlined },
        { key: 'aadhar', code: 'AAD', label: 'Aadhar Card', icon: IdcardOutlined },
        { key: 'pan', code: 'PAN', label: 'Pan Card', icon: IdcardOutlined },
        { key: 'others', code: 'OTHER', label: 'Other documents', icon: FolderOutlined, optional: true },
    ],
    enquiry: [
        { key: 'proposal', code: 'PRO', label: 'Proposal / Quotation', icon: FileTextOutlined },
        { key: 'agreement', code: 'AGR', label: 'Agreement / MoU', icon: FileProtectOutlined },
        { key: 'kyc', code: 'KYC', label: 'KYC / Company documents', icon: SolutionOutlined },
        { key: 'other', code: 'OTHER', label: 'Other documents', icon: FolderOutlined, optional: true },
    ],
};

const TABS = {
    inspection: [
        { key: 'documents', label: 'Documents', icon: FileTextOutlined },
        { key: 'survey', label: 'Survey', icon: BookOutlined },
        { key: 'assessment', label: 'Assessment', icon: ExperimentOutlined },
        { key: 'decision', label: 'Decision', icon: InfoCircleOutlined },
    ],
    enquiry: [
        { key: 'documents', label: 'Documents', icon: FileTextOutlined },
        { key: 'enquiry', label: 'Enquiry', icon: MessageOutlined },
        { key: 'decision', label: 'Decision', icon: InfoCircleOutlined },
    ],
};

const PI_STATUS = { Assigned: 'Assigned', Draft: 'In Progress', Submitted: 'Pending Review', Approved: 'Approved', Rejected: 'Rejected' };
const ENQ_STATUS = { new: 'New', contacted: 'Contacted', qualified: 'Qualified', closed: 'Closed', spam: 'Spam' };
const sizeLabel = (b) => (b >= 1024 * 1024 ? `${(b / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** One record of either app in a common shape (list + case bar). */
const toCase = (type, r) => (type === 'inspection'
    ? {
        type, id: r.id, status: PI_STATUS[r.status], title: r.ownerName, raw: r,
        bar: [['PI Ref', r.id], ['', PI_STATUS[r.status]], ['Insured', r.ownerName], ['Vehicle', [r.make, r.model].filter(Boolean).join(' ') || '—'], ['Reg No', r.registrationNumber]],
        search: `${r.id} ${r.ownerName} ${r.registrationNumber} ${r.make ?? ''} ${r.model ?? ''}`,
        option: `${r.id} · ${r.ownerName} · ${r.registrationNumber}`,
    }
    : {
        type, id: r.id, status: ENQ_STATUS[r.status], title: r.name, raw: r,
        bar: [['Enquiry', r.id], ['', ENQ_STATUS[r.status]], ['Name', r.name], ['Organisation', r.organisation], ['Phone', r.phone]],
        search: `${r.id} ${r.name} ${r.organisation} ${r.email} ${r.phone}`,
        option: `${r.id} · ${r.name} · ${r.organisation}`,
    });

/** Files of the open record in a common shape: { id, docType, slot, name, sizeBytes, mime, url, at }. */
function documentsOf(type, detail) {
    if (!detail) return [];
    if (type === 'enquiry') {
        return (detail.files ?? []).map((f) => ({ id: f.id, docType: f.docType, name: f.name, sizeBytes: f.sizeBytes, mime: f.mime, url: f.url, at: f.uploadedAt, by: f.uploadedBy }));
    }
    return (detail.media ?? []).filter((m) => m.kind === 'document').map((m) => {
        const type = DOC_TYPES.inspection.find((d) => m.slot === d.key || m.slot.startsWith(`${d.key}_`));
        // `rc_Front-Side` -> "Registration Certificate · Front Side"; DMS slots (`puc_dms-<ts>`) -> the type alone.
        const side = type ? m.slot.slice(type.key.length + 1).replace(/^dms-\d+$/, '').replace(/[-_]+/g, ' ').trim() : '';
        return {
            id: m.id,
            slot: m.slot,
            docType: type?.key ?? 'others',
            name: type ? (side ? `${type.label} · ${side}` : type.label) : slotLabel(m.slot),
            sizeBytes: m.sizeBytes,
            mime: m.mime,
            url: m.url,
            at: m.uploadedAt,
        };
    });
}

const Panel = ({ title, sub, children, extra }) => (
    <section className="rounded-lg p-3" style={{ background: '#fff', border: `1px solid ${COLORS.border}` }}>
        {(title || extra) && (
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                    {title && <h2 className="m-0 text-[14px] font-bold" style={{ color: COLORS.primary }}>{title}</h2>}
                    {sub && <p className="m-0 text-[11.5px] font-medium" style={{ color: COLORS.textSecondary }}>{sub}</p>}
                </div>
                {extra}
            </div>
        )}
        {children}
    </section>
);

const softBtn = { background: COLORS.primarySoft, color: COLORS.primary, border: 'none' };

/**
 * Documents DMS -- one place for the files of both apps: pre-inspections
 * from the Pre-Inspection Agent app (documents, survey photos & video,
 * declarations, decision) and enquiries from the IBima Assist app (files
 * the team attaches, the enquiry, follow-up). Layout follows the call-center
 * portal's Documents DMS screen.
 */
const DocumentsDmsPage = () => {
    const { message, modal } = App.useApp();
    const navigate = useNavigate();
    const logChange = useLogChange();
    const [params, setParams] = useSearchParams();
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [source, setSource] = useState(params.get('type') ?? 'all');
    const [selected, setSelected] = useState(params.get('id') ? `${params.get('type')}:${params.get('id')}` : null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [tab, setTab] = useState('documents');
    const [uploadType, setUploadType] = useState(null);
    const [busy, setBusy] = useState(null);
    const fileInput = useRef(null);
    const pendingTarget = useRef(null);

    // Both apps' records.
    const loadCases = useCallback(async () => {
        setLoading(true);
        try {
            const [inspections, enquiries] = await Promise.all([api.get('/preinspections'), api.get('/enquiries')]);
            setCases([...inspections.map((r) => toCase('inspection', r)), ...enquiries.map((r) => toCase('enquiry', r))]);
        } catch (err) {
            message.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [message]);
    useEffect(() => { loadCases(); }, [loadCases]);

    const visible = useMemo(() => cases.filter((c) => source === 'all' || c.type === source), [cases, source]);
    const current = cases.find((c) => `${c.type}:${c.id}` === selected) ?? null;

    // Open the newest record when none is picked.
    useEffect(() => {
        if (!loading && !current && visible.length) setSelected(`${visible[0].type}:${visible[0].id}`);
    }, [loading, current, visible]);

    const loadDetail = useCallback(async (c) => {
        if (!c) return;
        setDetailLoading(true);
        try {
            const path = c.type === 'inspection' ? `/preinspections/${encodeURIComponent(c.id)}` : `/enquiries/${encodeURIComponent(c.id)}`;
            setDetail({ key: `${c.type}:${c.id}`, data: await api.get(path) });
        } catch (err) {
            message.error(err.message);
        } finally {
            setDetailLoading(false);
        }
    }, [message]);

    useEffect(() => {
        if (!current) return;
        setTab('documents');
        setUploadType(current.type === 'inspection' ? 'others' : 'other');
        setParams({ type: current.type, id: current.id }, { replace: true });
        loadDetail(current);
    }, [current?.type, current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const data = detail && current && detail.key === `${current.type}:${current.id}` ? detail.data : null;
    const docs = documentsOf(current?.type, data);
    const types = current ? DOC_TYPES[current.type] : [];

    // ---------- uploads ----------
    const upload = async (file, docType, replace) => {
        if (!current) return;
        setBusy(replace?.id ?? docType);
        try {
            if (current.type === 'inspection') {
                const slot = replace?.slot ?? `${docType}_dms-${Date.now()}`;
                await uploadFile(`/preinspections/${encodeURIComponent(current.id)}/documents/${encodeURIComponent(slot)}`, file);
            } else {
                await uploadFile(`/enquiries/${encodeURIComponent(current.id)}/files/${docType}`, file);
                if (replace) await api.del(`/enquiries/${encodeURIComponent(current.id)}/files/${replace.id}`);
            }
            const label = types.find((t) => t.key === docType)?.label ?? docType;
            logChange('Documents DMS', `${current.id} · ${label}`, replace ? replace.name : '—', file.name);
            message.success(`${label} ${replace ? 'replaced' : 'uploaded'}`);
            await loadDetail(current);
        } catch (err) {
            message.error(err.message);
        } finally {
            setBusy(null);
        }
    };

    /** Card buttons open the hidden file input for that type (or that file, to replace it). */
    const pickFor = (docType, replace = null) => {
        pendingTarget.current = { docType, replace };
        fileInput.current?.click();
    };

    const onPicked = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        const target = pendingTarget.current;
        if (file && target) upload(file, target.docType, target.replace);
    };

    const remove = (doc) => modal.confirm({
        title: `Remove ${doc.name}?`,
        content: 'The file is deleted from the DMS.',
        okText: 'Remove',
        okButtonProps: { danger: true },
        onOk: async () => {
            try {
                await api.del(current.type === 'inspection'
                    ? `/preinspections/${encodeURIComponent(current.id)}/documents/${doc.id}`
                    : `/enquiries/${encodeURIComponent(current.id)}/files/${doc.id}`);
                logChange('Documents DMS', `${current.id} · ${doc.name}`, 'Uploaded', 'Removed');
                message.success('File removed');
                await loadDetail(current);
            } catch (err) {
                message.error(err.message);
            }
        },
    });

    // ---------- decision ----------
    const [remarks, setRemarks] = useState('');
    const [enqStatus, setEnqStatus] = useState(null);
    const [notes, setNotes] = useState('');
    useEffect(() => {
        setRemarks(data?.reviewRemarks ?? '');
        setEnqStatus(data?.status ?? null);
        setNotes(data?.notes ?? '');
    }, [data]);

    const review = async (decision) => {
        if (decision === 'Rejected' && !remarks.trim()) return message.warning('Give a reason for rejecting.');
        setBusy(decision);
        try {
            await api.patch(`/preinspections/${encodeURIComponent(current.id)}/review`, { decision, remarks: remarks.trim() || undefined });
            logChange('Pre-Inspection', `${current.id} review`, current.status, decision);
            message.success(`${current.id} ${decision.toLowerCase()}`);
            await Promise.all([loadDetail(current), loadCases()]);
        } catch (err) {
            message.error(err.message);
        } finally {
            setBusy(null);
        }
        return undefined;
    };

    const saveEnquiry = async () => {
        setBusy('enquiry');
        try {
            await api.patch(`/enquiries/${encodeURIComponent(current.id)}`, { status: enqStatus, notes });
            if (enqStatus !== data.status) logChange('Enquiries', `${current.id} · ${data.name}`, ENQ_STATUS[data.status], ENQ_STATUS[enqStatus]);
            message.success('Enquiry updated');
            await Promise.all([loadDetail(current), loadCases()]);
        } catch (err) {
            message.error(err.message);
        } finally {
            setBusy(null);
        }
    };

    // ---------- render ----------
    const docCard = (t) => {
        const files = docs.filter((d) => d.docType === t.key);
        const uploaded = files.length > 0;
        const Icon = t.icon;
        return (
            <div key={t.key} className="rounded-lg px-3 py-3" style={{ background: '#fff', border: `1px solid ${COLORS.border}` }}>
                <div className="mb-2 flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[14px]" style={{ background: '#dce6fb', color: COLORS.primary }}><Icon /></span>
                    <span className="min-w-0">
                        <span className="block text-[11.5px] font-bold" style={{ color: COLORS.primary }}>{t.code}{files.length > 1 ? ` · ${files.length} files` : ''}</span>
                        <span className="block truncate text-[11.5px]">{t.label}</span>
                    </span>
                </div>
                {(uploaded || !t.optional) && (
                    <span className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold ${uploaded ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-600'}`}>
                        {uploaded ? <CheckCircleOutlined /> : <LoadingOutlined />} {uploaded ? 'Uploaded' : 'Pending'}
                    </span>
                )}
                {uploaded ? (
                    <div className="grid grid-cols-2 gap-1.5">
                        <Button size="small" icon={<DownloadOutlined />} href={files[0].url} target="_blank" style={softBtn}>Download</Button>
                        <Button size="small" icon={<SyncOutlined />} loading={busy === files[0].id} onClick={() => pickFor(t.key, files[0])} style={softBtn}>Replace</Button>
                    </div>
                ) : (
                    <Button size="small" block icon={<UploadOutlined />} loading={busy === t.key} onClick={() => pickFor(t.key)} style={softBtn}>Upload</Button>
                )}
            </div>
        );
    };

    const documentsTab = (
        <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
                <Panel title="Upload Documents" sub={current?.type === 'inspection' ? 'Add or replace documents for this pre-inspection' : 'Attach documents to this enquiry'}>
                    <Select size="small" value={uploadType} onChange={setUploadType} className="mb-2 w-full" options={types.map((t) => ({ value: t.key, label: `${t.code} — ${t.label}` }))} aria-label="Document type" />
                    <Dragger
                        multiple
                        accept={ACCEPT}
                        showUploadList={false}
                        height={170}
                        beforeUpload={(file) => { upload(file, uploadType); return false; }}
                        className="!rounded-lg !bg-white"
                    >
                        <p className="!mb-1 text-[20px]" style={{ color: COLORS.primary }}><CloudUploadOutlined /></p>
                        <p className="!mb-0.5 text-[11.5px]">Drag &amp; Drop Files Here</p>
                        <p className="!mb-2 text-[11px]" style={{ color: COLORS.textMuted }}>JPG, PNG, WEBP or PDF</p>
                        <span className="inline-flex rounded-md px-3 py-1 text-[11.5px] font-semibold" style={softBtn}>Browse Files</span>
                    </Dragger>
                </Panel>
                <Panel title="Document Type">
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">{types.map(docCard)}</div>
                </Panel>
            </div>
            <Panel title={`Uploaded Files (${docs.length})`}>
                {docs.length ? (
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                        {docs.map((d) => (
                            <div key={d.id} className="rounded-lg px-3 py-2.5" style={{ border: `1px solid ${COLORS.border}` }}>
                                <div className="flex items-start gap-2">
                                    <span className="text-[16px]" style={{ color: d.mime === 'application/pdf' ? '#DC2626' : COLORS.primary }}>{d.mime === 'application/pdf' ? <FilePdfOutlined /> : <FileTextOutlined />}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="m-0 truncate text-[12.5px] font-bold" style={{ color: COLORS.primary }} title={d.name}>{d.name}</p>
                                        <p className="m-0 text-[11px]" style={{ color: COLORS.textSecondary }}>{sizeLabel(d.sizeBytes)} · {formatDateTime(d.at)}{d.by ? ` · ${d.by}` : ''}</p>
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="h-1.5 flex-1 rounded-full bg-emerald-500" />
                                    <span className="text-[11px] font-semibold">100%</span>
                                    <Button size="small" type="text" icon={<DownloadOutlined />} href={d.url} target="_blank" aria-label={`Download ${d.name}`} />
                                    <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => remove(d)} aria-label={`Remove ${d.name}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <span className="text-[12px]" style={{ color: COLORS.textMuted }}>No files yet.</span>}
            </Panel>
        </div>
    );

    const media = data?.media ?? [];
    const ofKind = (k) => media.filter((m) => m.kind === k);
    const video = ofKind('video')[0];
    const gpsPhoto = media.find((m) => m.latitude != null);

    const surveyTab = data && (
        <div className="flex flex-col gap-3">
            <Panel title={`Vehicle Photos (${ofKind('photo').length})`} sub="Captured in the Pre-Inspection Agent app (time and GPS on each photo)"><PhotoGrid items={ofKind('photo')} /></Panel>
            <Panel title="Walk-around Video">
                {video ? <video src={video.url} controls preload="metadata" className="w-full rounded-md" style={{ maxHeight: 360, background: '#000' }} /> : <span style={{ color: COLORS.textMuted }}>No video uploaded.</span>}
            </Panel>
            {(ofKind('reinspection').length > 0 || ofKind('repair').length > 0) && (
                <Panel title="Repair & Reinspection"><PhotoGrid items={[...ofKind('reinspection'), ...ofKind('repair')]} /></Panel>
            )}
        </div>
    );

    const assessmentTab = data && (
        <div className="flex flex-col gap-3">
            <Panel title="Owner & Vehicle Details">
                <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 3 }} items={[
                    ['Owner name', data.ownerName], ['Mobile', data.mobile], ['Email', data.email], ['Registration no.', data.registrationNumber],
                    ['State', data.state], ['Registration date', data.registrationDate], ['Product', data.product], ['Make / Model', `${data.make ?? ''} ${data.model ?? ''}`.trim()],
                    ['Variant', data.variant], ['Mfg. year', data.manufacturingYear], ['Owner serial no.', data.ownerSerialNumber], ['Odometer (KM)', data.odometer],
                    ['Survey type', data.surveyType === 'Valuation' ? 'Valuation' : 'Pre-Inspection'], ...(data.idv ? [['Market value / IDV', `₹ ${data.idv}`]] : []),
                ].map(([label, v]) => ({ label, children: v || '—' }))} />
            </Panel>
            <Panel title="Inspection">
                <Descriptions size="small" column={{ xs: 1, sm: 2 }} items={[
                    { label: data.agentRole === 'surveyor' ? 'Surveyor' : 'Agent', children: `${data.agentName ?? '—'} (${data.agentUserId ?? data.agentId})` },
                    { label: 'Submitted', children: formatDateTime(data.submittedAt) },
                    { label: 'Location', children: gpsPhoto ? <Gps m={gpsPhoto} /> : '—' },
                    { label: 'Agent recommendation', children: data.agentRecommendation ? <Tag color={data.agentRecommendation === 'Approved' ? 'green' : 'red'}>{data.agentRecommendation === 'Approved' ? 'Recommended' : 'Not recommended'}</Tag> : '—' },
                    { label: 'Customer declaration', children: data.customerDeclaration ? 'Accepted' : '—' },
                    { label: 'Inspector declaration', children: data.inspectorDeclaration ? 'Accepted' : '—' },
                ]} />
            </Panel>
            <Panel title="Signatures"><PhotoGrid items={ofKind('signature')} /></Panel>
        </div>
    );

    const inspectionDecision = data && (
        <Panel title="Decision" sub={data.reviewedAt ? `Last review: ${data.status} by ${data.reviewedBy} on ${formatDateTime(data.reviewedAt)}` : undefined}>
            {['Assigned', 'Draft'].includes(data.status) ? (
                <span style={{ color: COLORS.textMuted }}>The agent has not submitted this pre-inspection yet.</span>
            ) : (
                <div className="max-w-[640px]">
                    <Input.TextArea rows={3} maxLength={500} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Remarks (required to reject)" className="mb-2" />
                    <div className="flex gap-2">
                        <Button type="primary" icon={<AuditOutlined />} loading={busy === 'Approved'} disabled={!!busy} onClick={() => review('Approved')}>Approve</Button>
                        <Button danger loading={busy === 'Rejected'} disabled={!!busy} onClick={() => review('Rejected')}>Reject</Button>
                    </div>
                </div>
            )}
        </Panel>
    );

    const enquiryTab = data && (
        <Panel title="Enquiry" sub={`Received ${formatDateTime(data.createdAt)} from the ${data.source === 'app' ? 'IBima Assist app' : 'website'}`}>
            <Descriptions size="small" column={{ xs: 1, sm: 2 }} items={[
                ['Name', data.name], ['Organisation', data.organisation], ['Email', data.email], ['Phone', data.phone], ['You are a', data.orgType], ['Interested in', data.interest],
            ].map(([label, v]) => ({ label, children: v || '—' }))} />
            <div className="mt-2 rounded-md p-2.5 whitespace-pre-wrap text-[12.5px]" style={{ background: COLORS.bgField, border: `1px solid ${COLORS.border}` }}>{data.message}</div>
        </Panel>
    );

    const enquiryDecision = data && (
        <Panel title="Decision" sub={data.handledBy ? `Last updated by ${data.handledBy} · ${formatDateTime(data.updatedAt)}` : undefined}>
            <div className="max-w-[640px]">
                <Select value={enqStatus} onChange={setEnqStatus} style={{ width: 200 }} className="mb-2" options={Object.entries(ENQ_STATUS).map(([value, label]) => ({ value, label }))} aria-label="Enquiry status" />
                <Input.TextArea rows={3} maxLength={4000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (call outcome, next step…)" className="mb-2" />
                <Button type="primary" loading={busy === 'enquiry'} onClick={saveEnquiry} disabled={enqStatus === data.status && (notes ?? '') === (data.notes ?? '')}>Save</Button>
            </div>
        </Panel>
    );

    const body = {
        documents: documentsTab,
        survey: surveyTab,
        assessment: assessmentTab,
        decision: current?.type === 'inspection' ? inspectionDecision : enquiryDecision,
        enquiry: enquiryTab,
    }[tab];

    return (
        <div className="flex flex-col gap-3">
            <input ref={fileInput} type="file" accept={ACCEPT} style={{ display: 'none' }} onChange={onPicked} />
            <PageTitle
                title="Documents DMS"
                subtitle="Files and records from the Pre-Inspection Agent app and the IBima Assist app"
                extra={(
                    <>
                        <Segmented
                            size="small"
                            value={source}
                            onChange={(v) => { setSource(v); setSelected(null); }}
                            options={[{ value: 'all', label: 'All' }, { value: 'inspection', label: 'Pre-Inspection' }, { value: 'enquiry', label: 'IBima Assist app' }]}
                        />
                        <Select
                            showSearch={{ optionFilterProp: 'search' }}
                            value={current ? selected : undefined}
                            onChange={setSelected}
                            placeholder="Search PI ref, enquiry, name…"
                            style={{ width: 320 }}
                            loading={loading}
                            options={visible.map((c) => ({ value: `${c.type}:${c.id}`, label: c.option, search: c.search }))}
                            aria-label="Record"
                        />
                    </>
                )}
            />

            {!loading && !current && <Empty description="No records yet — pre-inspections and enquiries from the apps appear here" />}

            {current && (
                <>
                    <section className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg px-4 py-2.5" style={{ background: '#F4F6FA', border: `1px solid ${COLORS.border}` }}>
                        <button
                            type="button"
                            onClick={() => navigate(current.type === 'inspection' ? ROUTES.PRE_INSPECTIONS : ROUTES.ENQUIRIES)}
                            className="flex items-center gap-1.5 text-[12.5px] font-semibold"
                        >
                            <ArrowLeftOutlined /> Back
                        </button>
                        {current.bar.map(([label, value], i) => (
                            <span key={`${label}${i}`} className="pl-5 text-[12.5px] font-semibold" style={{ borderLeft: `1px solid ${COLORS.border}` }}>
                                {label === '' ? <StatusTag status={value} size="sm" /> : `${label}: ${value || '—'}`}
                            </span>
                        ))}
                        <Tag className="ml-auto" color={current.type === 'inspection' ? 'blue' : 'purple'}>{current.type === 'inspection' ? 'Pre-Inspection Agent app' : 'IBima Assist app'}</Tag>
                    </section>

                    <section className="flex flex-wrap gap-6 rounded-lg px-4 py-2.5" style={{ background: '#F4F6FA', border: `1px solid ${COLORS.border}` }} role="tablist">
                        {TABS[current.type].map((t) => {
                            const Icon = t.icon;
                            return (
                                <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
                                    className="flex items-center gap-1.5 text-[13px] font-semibold"
                                    style={{ color: tab === t.key ? COLORS.primary : COLORS.textPrimary }}
                                >
                                    <Icon /> {t.label}
                                </button>
                            );
                        })}
                    </section>

                    {detailLoading && !data ? <div className="flex justify-center py-16"><Spin /></div> : body}
                </>
            )}
        </div>
    );
};

export default DocumentsDmsPage;
