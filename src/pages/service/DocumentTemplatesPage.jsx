import React, { useMemo, useRef, useState } from 'react';
import { Input, Button, Modal, Form, Select, Pagination, App, Tag, Empty } from 'antd';
import { SearchOutlined, DatabaseOutlined, ClockCircleOutlined, BankOutlined } from '@ant-design/icons';
import { COLORS } from '../../constants/theme';
import { TEMPLATE_CATEGORIES, CATEGORY_COLORS, TEMPLATE_PLACEHOLDERS, SAMPLE_VALUES } from '../../data/seed';
import { useCollection, useLogChange, newId } from '../../store/AdminStore';
import { matchesQuery, timeAgo } from '../../utils/format';

const PAGE_SIZE = 8;
const bumpVersion = (v) => {
    const [major, minor = '0'] = String(v).split('.');
    return `${major}.${Number(minor) + 1}`;
};

/** Template body with {{placeholders}} swapped for sample values (highlighted). */
const renderPreview = (body) => body.split(/(\{\{\w+\}\})/g).map((part, i) => {
    const m = part.match(/^\{\{(\w+)\}\}$/);
    if (!m) return <React.Fragment key={i}>{part}</React.Fragment>;
    return <mark key={i} className="rounded px-0.5" style={{ background: '#FFF3C4' }}>{SAMPLE_VALUES[m[1]] ?? part}</mark>;
});

const TemplateCard = ({ t, onPreview, onEdit }) => (
    <div className="rounded flex flex-col p-3 min-w-0" style={{ background: '#F4F4F4', border: '1px solid #DDDDDD', minHeight: 250 }}>
        <div className="flex items-start gap-2.5 mt-2">
            <span className="rounded-full shrink-0" style={{ width: 34, height: 34, background: CATEGORY_COLORS[t.category] ?? '#CBD5E1' }} />
            <div className="min-w-0">
                <h3 className="text-[14px] font-semibold m-0 leading-tight" style={{ color: COLORS.primary }}>{t.name}</h3>
                <span className="inline-block mt-1 rounded-full px-2 text-[11px]" style={{ border: '1px solid #222' }}>{t.category}</span>
                {t.status === 'Inactive' && <Tag className="ml-1.5" color="default">Inactive</Tag>}
            </div>
        </div>
        <ul className="list-none p-0 m-0 mt-5 flex flex-col gap-1.5 text-[12px]">
            <li className="flex items-center gap-2"><DatabaseOutlined style={{ fontSize: 13 }} /> Version:{t.version}</li>
            <li className="flex items-center gap-2"><ClockCircleOutlined style={{ fontSize: 13 }} /> Updated {timeAgo(t.updatedAt)}</li>
            <li className="flex items-center gap-2"><BankOutlined style={{ fontSize: 13 }} /> Used By {t.branchIds.length} Branches</li>
        </ul>
        <div className="flex-1" />
        <div className="grid grid-cols-2 gap-2 mt-4">
            <Button type="primary" onClick={onPreview} style={{ height: 30, fontSize: 12 }}>Preview</Button>
            <Button onClick={onEdit} style={{ height: 30, fontSize: 12, color: COLORS.primary, borderColor: COLORS.primary }}>Edit</Button>
        </div>
    </div>
);

/** Create / edit template. Placeholder chips insert at the cursor. */
const TemplateModal = ({ open, template, onClose, onSave, branches }) => {
    const [form] = Form.useForm();
    const bodyRef = useRef(null);

    const insert = (ph) => {
        const el = bodyRef.current?.resizableTextArea?.textArea;
        const body = form.getFieldValue('body') ?? '';
        const start = el?.selectionStart ?? body.length;
        const end = el?.selectionEnd ?? body.length;
        form.setFieldValue('body', body.slice(0, start) + ph + body.slice(end));
        requestAnimationFrame(() => {
            el?.focus();
            el?.setSelectionRange(start + ph.length, start + ph.length);
        });
    };

    return (
        <Modal
            open={open}
            width={720}
            title={template ? `Edit ${template.name}` : 'Create Template'}
            onCancel={onClose}
            onOk={() => form.submit()}
            okText={template ? `Save as v${bumpVersion(template.version)}` : 'Create Template'}
            destroyOnHidden
            afterOpenChange={(o) => o && form.setFieldsValue(template ?? { category: TEMPLATE_CATEGORIES[0], status: 'Active', branchIds: [], body: '' })}
        >
            <Form form={form} layout="vertical" onFinish={onSave}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3">
                    <Form.Item name="name" label="Template Name" rules={[{ required: true, message: 'Enter template name' }]} className="sm:col-span-3">
                        <Input placeholder="e.g. Motor Claim Intimation" maxLength={60} />
                    </Form.Item>
                    <Form.Item name="category" label="Category" rules={[{ required: true }]} className="sm:col-span-2">
                        <Select options={TEMPLATE_CATEGORIES.map((c) => ({ value: c, label: c }))} />
                    </Form.Item>
                    <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                        <Select options={['Active', 'Inactive'].map((c) => ({ value: c, label: c }))} />
                    </Form.Item>
                </div>
                <Form.Item
                    name="branchIds"
                    label={(
                        <span className="flex items-center gap-3">
                            Used By Branches
                            <button type="button" className="text-[12px]" style={{ color: COLORS.primary }} onClick={() => form.setFieldValue('branchIds', branches.map((b) => b.id))}>Select all</button>
                        </span>
                    )}
                    rules={[{ required: true, type: 'array', min: 1, message: 'Select at least one branch' }]}
                >
                    <Select mode="multiple" maxTagCount="responsive" placeholder="Select branches" options={branches.map((b) => ({ value: b.id, label: b.name }))} optionFilterProp="label" />
                </Form.Item>
                <div className="flex flex-wrap gap-1 mb-1.5">
                    {TEMPLATE_PLACEHOLDERS.map((ph) => (
                        <button key={ph} type="button" onClick={() => insert(ph)} className="rounded px-1.5 py-0.5 text-[11px] font-mono" style={{ background: COLORS.bgSoftBlue, color: COLORS.primary }}>{ph}</button>
                    ))}
                </div>
                <Form.Item name="body" label="Template Content" rules={[{ required: true, message: 'Enter template content' }, { min: 20, message: 'Content looks too short' }]}>
                    <Input.TextArea ref={bodyRef} rows={9} placeholder="Dear {{insured_name}}, ..." />
                </Form.Item>
            </Form>
        </Modal>
    );
};

/**
 * Document Templates -- search + category chips, cards with Preview
 * (placeholders filled with sample data) and Edit (saving bumps the
 * version and "Updated" date).
 */
const DocumentTemplatesPage = () => {
    const { message } = App.useApp();
    const { items: templates, add, update } = useCollection('documentTemplates');
    const { items: branches } = useCollection('branches');
    const logChange = useLogChange();

    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('All');
    const [page, setPage] = useState(1);
    const [previewId, setPreviewId] = useState(null);
    const [formState, setFormState] = useState(null);

    const filtered = useMemo(
        () => templates.filter((t) => (category === 'All' || t.category === category) && matchesQuery(t, query, ['name', 'category', 'body'])),
        [templates, category, query],
    );
    const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const preview = templates.find((t) => t.id === previewId);

    const save = (values) => {
        const editing = formState?.template;
        const clean = { ...values, name: values.name.trim() };
        if (editing) {
            const version = bumpVersion(editing.version);
            update(editing.id, { ...clean, version, updatedAt: new Date().toISOString() });
            logChange('Document Templates', clean.name, `v${editing.version}`, `v${version}`);
            message.success(`${clean.name} saved as v${version}`);
        } else {
            add({ ...clean, id: newId('TPL'), version: '1.0', updatedAt: new Date().toISOString() });
            logChange('Document Templates', 'Template Created', '—', `${clean.name} (${clean.category})`);
            setCategory('All');
            setPage(1);
            message.success(`${clean.name} created`);
        }
        setFormState(null);
    };

    const chip = (c) => {
        const on = category === c;
        return (
            <button
                key={c}
                type="button"
                onClick={() => { setCategory(c); setPage(1); }}
                className="rounded px-3 text-[12px] whitespace-nowrap"
                style={{ height: 28, minWidth: 70, background: on ? COLORS.primary : '#fff', color: on ? '#fff' : '#111', border: `1px solid ${on ? COLORS.primary : '#222'}` }}
            >
                {c}
            </button>
        );
    };

    return (
        <>
            <h1 className="text-[20px] font-bold m-0 mb-3" style={{ color: COLORS.primary }}>Document Templates</h1>

            <div className="filter-bar flex flex-wrap items-center justify-between gap-2 mb-3">
                <Input allowClear value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search Templates" suffix={<SearchOutlined />} style={{ width: 'min(100%, 380px)' }} />
                <Button type="primary" style={{ minWidth: 140 }} onClick={() => setFormState({ template: null })}>+ Create Template</Button>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
                {['All', ...TEMPLATE_CATEGORIES].map(chip)}
            </div>

            {pageRows.length ? (
                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
                    {pageRows.map((t) => <TemplateCard key={t.id} t={t} onPreview={() => setPreviewId(t.id)} onEdit={() => setFormState({ template: t })} />)}
                </div>
            ) : (
                <Empty className="py-10" description="No templates found" />
            )}

            {filtered.length > PAGE_SIZE && (
                <div className="app-table flex justify-end mt-4">
                    <Pagination current={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} showSizeChanger={false} />
                </div>
            )}

            <Modal
                open={!!preview}
                width={680}
                title={preview && <span>{preview.name} <span className="text-[12px] font-normal text-slate-500">· {preview.category} · v{preview.version}</span></span>}
                onCancel={() => setPreviewId(null)}
                footer={preview && (
                    <>
                        <Button onClick={() => setPreviewId(null)}>Close</Button>
                        <Button type="primary" onClick={() => { setPreviewId(null); setFormState({ template: preview }); }}>Edit</Button>
                    </>
                )}
            >
                {preview && (
                    <>
                        <div className="rounded-md p-4 whitespace-pre-wrap text-[12.5px] leading-5" style={{ background: '#fff', border: `1px solid ${COLORS.border}`, boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
                            {renderPreview(preview.body)}
                        </div>
                        <p className="text-[12px] text-slate-500 mt-2 mb-0">Highlighted values are sample data that replace the template placeholders.</p>
                    </>
                )}
            </Modal>

            <TemplateModal open={!!formState} template={formState?.template} onClose={() => setFormState(null)} onSave={save} branches={branches} />
        </>
    );
};

export default DocumentTemplatesPage;
