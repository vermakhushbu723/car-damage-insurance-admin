import React, { useMemo, useState } from 'react';
import { Input, Button, Select, Tabs, Modal, Form, Switch, App, AutoComplete, Tooltip } from 'antd';
import { EditOutlined, BankOutlined, UserOutlined, LoadingOutlined, CloseCircleOutlined, SendOutlined } from '@ant-design/icons';
import DataTable from '../../components/ui/DataTable';
import StatusTag from '../../components/ui/StatusTag';
import StatCard from '../../components/ui/StatCard';
import { COLORS, CHANNEL_STYLES } from '../../constants/theme';
import { COMM_STAGES, COMM_CHANNELS, COMM_RECIPIENTS, SEND_TIMINGS, REMINDER_OPTIONS } from '../../data/seed';
import { useCollection, useLogChange, useReload, newId } from '../../store/AdminStore';
import { api } from '../../api/client';
import { downloadCsv, formatDate, formatNumber, matchesQuery } from '../../utils/format';
import dayjs from 'dayjs';

const toOptions = (arr) => arr.map((v) => ({ value: v, label: v }));

const ChannelPill = ({ name, disabled }) => {
    const s = CHANNEL_STYLES[name] ?? { bg: '#E2E8F0', color: '#475569' };
    return (
        <Tooltip title={disabled ? `${name} channel is switched off` : ''}>
            <span className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[11.5px] whitespace-nowrap" style={{ background: s.bg, color: s.color, minWidth: 64, opacity: disabled ? 0.4 : 1, textDecoration: disabled ? 'line-through' : 'none' }}>
                {name}
            </span>
        </Tooltip>
    );
};

const EditButton = ({ onClick }) => (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[12px]" style={{ background: COLORS.primarySoft, color: COLORS.primary }}>
        Edit <EditOutlined />
    </button>
);

/** Create / edit a stage-wise rule. */
const RuleModal = ({ open, rule, templates, onClose, onSave }) => {
    const [form] = Form.useForm();
    return (
        <Modal
            open={open}
            width={680}
            title={rule ? 'Edit Communication Rule' : 'Create Communication Tool'}
            onCancel={onClose}
            onOk={() => form.submit()}
            okText={rule ? 'Save Changes' : 'Create'}
            destroyOnHidden
            afterOpenChange={(o) => o && form.setFieldsValue(rule ?? { stage: COMM_STAGES[0], channels: ['Email'], recipients: ['Insured'], initialSend: 'Immediately', reminder: '--', status: 'Active' })}
        >
            <Form form={form} layout="vertical" onFinish={onSave}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                    <Form.Item name="stage" label="Stage" rules={[{ required: true }]}>
                        <Select options={toOptions(COMM_STAGES)} />
                    </Form.Item>
                    <Form.Item name="trigger" label="Trigger/Event" rules={[{ required: true, message: 'Enter the trigger event' }]}>
                        <Input placeholder="e.g. Claim Registered" />
                    </Form.Item>
                    <Form.Item name="template" label="Template" rules={[{ required: true, message: 'Pick or type a template' }]} extra="Typing a new name creates the template under the Templates tab." className="sm:col-span-2">
                        <AutoComplete options={templates.map((t) => ({ value: t.name }))} filterOption={(input, o) => o.value.toLowerCase().includes(input.toLowerCase())}>
                            <Input placeholder="Claim Registration Confirmation" />
                        </AutoComplete>
                    </Form.Item>
                    <Form.Item name="recipients" label="Recipients" rules={[{ required: true, type: 'array', min: 1, message: 'Select recipients' }]}>
                        <Select mode="multiple" options={toOptions(COMM_RECIPIENTS)} />
                    </Form.Item>
                    <Form.Item name="channels" label="Channels" rules={[{ required: true, type: 'array', min: 1, message: 'Select at least one channel' }]}>
                        <Select mode="multiple" options={toOptions(COMM_CHANNELS)} />
                    </Form.Item>
                    <Form.Item name="initialSend" label="Initial Send" rules={[{ required: true }]}>
                        <Select options={toOptions(SEND_TIMINGS)} />
                    </Form.Item>
                    <Form.Item name="reminder" label="Reminder" rules={[{ required: true }]}>
                        <Select options={toOptions(REMINDER_OPTIONS)} />
                    </Form.Item>
                    <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                        <Select options={toOptions(['Active', 'Inactive'])} />
                    </Form.Item>
                </div>
            </Form>
        </Modal>
    );
};

const TemplateModal = ({ open, template, onClose, onSave }) => {
    const [form] = Form.useForm();
    return (
        <Modal open={open} title={template ? `Edit ${template.name}` : 'Add Template'} onCancel={onClose} onOk={() => form.submit()} okText="Save" destroyOnHidden afterOpenChange={(o) => o && form.setFieldsValue(template ?? { status: 'Active', channel: 'Email' })}>
            <Form form={form} layout="vertical" onFinish={onSave}>
                <Form.Item name="name" label="Template Name" rules={[{ required: true, message: 'Enter name' }]}><Input /></Form.Item>
                <Form.Item name="channel" label="Channel(s)" rules={[{ required: true }]}><Input placeholder="Email, Whats App" /></Form.Item>
                <Form.Item name="body" label="Message" rules={[{ required: true, message: 'Enter message' }]}><Input.TextArea rows={5} /></Form.Item>
                <Form.Item name="status" label="Status"><Select options={toOptions(['Active', 'Inactive'])} /></Form.Item>
            </Form>
        </Modal>
    );
};

/**
 * Stage-wise Communication Matrix -- rules per claim stage (filter, edit,
 * export CSV), their message templates, and the delivery channels.
 */
const CommunicationSetupPage = () => {
    const { message } = App.useApp();
    const rulesCol = useCollection('commRules');
    const templatesCol = useCollection('commTemplates');
    const channelsCol = useCollection('channels');
    const logsCol = useCollection('commLogs');
    const [viewLog, setViewLog] = useState(null);
    const logChange = useLogChange();
    const reload = useReload();
    const rules = rulesCol.items;
    const templates = templatesCol.items;
    const channels = channelsCol.items;

    const [tab, setTab] = useState('matrix');
    const [draft, setDraft] = useState({ q: '', stage: 'all', channel: 'all' });
    const [filters, setFilters] = useState(draft);
    const [ruleForm, setRuleForm] = useState(null);
    const [templateForm, setTemplateForm] = useState(null);

    const disabledChannels = channels.filter((c) => !c.enabled).map((c) => c.name);

    const stats = useMemo(() => ({
        activeRules: rules.filter((r) => r.status === 'Active').length,
        activeTemplates: templates.filter((t) => t.status === 'Active').length,
        reminders: rules.filter((r) => r.status === 'Active' && r.reminder !== '--').length,
        sentToday: channels.reduce((n, c) => n + (c.enabled ? c.sentToday : 0), 0),
    }), [rules, templates, channels]);

    const filteredRules = rules.filter((r) => (
        matchesQuery(r, filters.q, ['stage', 'trigger', 'template'])
        && (filters.stage === 'all' || r.stage === filters.stage)
        && (filters.channel === 'all' || r.channels.includes(filters.channel))
    ));

    const ensureTemplate = async (name, channelsUsed) => {
        if (!templates.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
            await templatesCol.add({ id: newId('CT'), name, channel: channelsUsed.join(', '), body: `Dear {{insured_name}}, update on claim {{claim_no}}: ${name}.`, status: 'Active', updatedAt: new Date().toISOString() });
        }
    };

    const saveRule = async (values) => {
        const clean = { ...values, template: values.template.trim(), trigger: values.trigger.trim() };
        const editing = ruleForm?.rule;
        if (!(await (editing ? rulesCol.update(editing.id, clean) : rulesCol.add({ ...clean, id: newId('CR') })))) return;
        await ensureTemplate(clean.template, clean.channels);
        if (editing) {
            const diffs = ['channels', 'reminder', 'status', 'initialSend', 'template'].filter((k) => JSON.stringify(editing[k]) !== JSON.stringify(clean[k]));
            diffs.forEach((k) => logChange('Communication Setup', `${clean.trigger} · ${k}`, [].concat(editing[k]).join(', '), [].concat(clean[k]).join(', ')));
            if (!diffs.length) logChange('Communication Setup', clean.trigger, '—', 'Updated');
            message.success('Rule updated');
        } else {
            logChange('Communication Setup', 'Rule Created', '—', `${clean.stage} · ${clean.trigger}`);
            message.success('Communication rule created');
            setTab('matrix');
        }
        setRuleForm(null);
    };

    const saveTemplate = async (values) => {
        const editing = templateForm?.template;
        if (editing) {
            if (!(await templatesCol.update(editing.id, { ...values, updatedAt: new Date().toISOString() }))) return;
            // Keep rule references pointing at the renamed template.
            if (editing.name !== values.name) await rulesCol.setAll((list) => list.map((r) => (r.template === editing.name ? { ...r, template: values.name } : r)));
            logChange('Communication Setup', `Template ${values.name}`, editing.status, values.status);
        } else {
            if (!(await templatesCol.add({ ...values, id: newId('CT'), updatedAt: new Date().toISOString() }))) return;
            logChange('Communication Setup', 'Template Added', '—', values.name);
        }
        message.success('Template saved');
        setTemplateForm(null);
    };

    const toggleChannel = async (c, enabled) => {
        if (!(await channelsCol.update(c.id, { enabled }))) return;
        logChange('Communication Setup', `${c.name} channel`, c.enabled ? 'ON' : 'OFF', enabled ? 'ON' : 'OFF');
    };

    // Retry a failed message through the Communication Gateway (System Settings); delivery counts toward Sent Today.
    const retry = async (log) => {
        const ch = channels.find((c) => c.name === log.channel);
        if (!ch?.enabled) {
            message.error(`${log.channel} channel is switched off — enable it under Channels first.`);
            return;
        }
        try {
            await api.post(`/comm-logs/${log.id}/retry`);
        } catch (err) {
            message.error(err.message);
            return;
        }
        await reload(['commLogs', 'channels']);
        logChange('Communication Setup', `Retry ${log.claim} · ${log.channel}`, 'Failed', 'Delivered');
        message.success(`${log.communication} re-sent to ${log.recipient} via ${log.channel}`);
    };

    const logColumns = [
        { title: 'Date/Time', dataIndex: 'at', render: (d) => dayjs(d).format('DD MMM YYYY HH:mm') },
        { title: 'Claim', dataIndex: 'claim' },
        { title: 'Communication', dataIndex: 'communication' },
        { title: 'Recipient', dataIndex: 'recipient' },
        { title: 'Channel', dataIndex: 'channel', render: (c) => <ChannelPill name={c} />, align: 'center' },
        { title: 'Status', dataIndex: 'status', render: (s) => <StatusTag status={s} minWidth={80} />, align: 'center' },
        {
            title: 'Action',
            align: 'center',
            render: (_, l) => (
                <button type="button" onClick={() => (l.status === 'Failed' ? retry(l) : setViewLog(l))} className="rounded px-3 py-0.5 text-[12px]" style={{ background: COLORS.primarySoft, color: COLORS.primary, minWidth: 70 }}>
                    {l.status === 'Failed' ? 'Retry' : 'View'}
                </button>
            ),
        },
    ];

    const sendTest = async (c) => {
        try {
            await api.post(`/channels/${c.id}/test`);
            message.success(`Test ${c.name} message sent${c.provider ? ` via ${c.provider}` : ''}`);
        } catch (err) {
            message.error(err.message);
        }
        await reload(['commLogs', 'channels']);
    };

    const exportMatrix = () => {
        downloadCsv(`communication-matrix-${new Date().toISOString().slice(0, 10)}.csv`, filteredRules, [
            { title: 'Stage', value: (r) => r.stage },
            { title: 'Trigger/Event', value: (r) => r.trigger },
            { title: 'Template', value: (r) => r.template },
            { title: 'Recipients', value: (r) => r.recipients.join(', ') },
            { title: 'Channels', value: (r) => r.channels.join(', ') },
            { title: 'Initial Send', value: (r) => r.initialSend },
            { title: 'Reminder', value: (r) => r.reminder },
            { title: 'Status', value: (r) => r.status },
        ]);
        message.success(`Exported ${filteredRules.length} rules`);
    };

    const ruleColumns = [
        { title: 'Stage', dataIndex: 'stage' },
        { title: 'Trigger/Event', dataIndex: 'trigger' },
        { title: 'Template', dataIndex: 'template' },
        { title: 'Recipients', render: (_, r) => <span className="text-[12.5px]">{r.recipients.join(', ')}</span> },
        { title: 'Channels', align: 'center', render: (_, r) => <div className="flex gap-1 justify-center">{r.channels.map((c) => <ChannelPill key={c} name={c} disabled={disabledChannels.includes(c)} />)}</div> },
        { title: 'Initial Send', dataIndex: 'initialSend', align: 'center' },
        { title: 'Reminder', dataIndex: 'reminder', align: 'center' },
        { title: 'Status', render: (_, r) => <StatusTag status={r.status} minWidth={72} />, align: 'center' },
        { title: 'Action', render: (_, r) => <EditButton onClick={() => setRuleForm({ rule: r })} />, align: 'center' },
    ];

    const templateColumns = [
        { title: 'Template', dataIndex: 'name' },
        { title: 'Channel(s)', dataIndex: 'channel' },
        { title: 'Used In Rules', align: 'center', render: (_, t) => rules.filter((r) => r.template === t.name).length },
        { title: 'Updated', dataIndex: 'updatedAt', render: formatDate },
        {
            title: 'Status',
            align: 'center',
            render: (_, t) => (
                <Switch
                    size="small"
                    checked={t.status === 'Active'}
                    onChange={(v) => {
                        templatesCol.update(t.id, { status: v ? 'Active' : 'Inactive' });
                        logChange('Communication Setup', `Template ${t.name}`, t.status, v ? 'Active' : 'Inactive');
                    }}
                />
            ),
        },
        { title: 'Action', align: 'center', render: (_, t) => <EditButton onClick={() => setTemplateForm({ template: t })} /> },
    ];

    const channelColumns = [
        { title: 'Channel', render: (_, c) => <ChannelPill name={c.name} /> },
        { title: 'Provider', dataIndex: 'provider' },
        { title: 'Sender ID', dataIndex: 'senderId' },
        { title: 'Rules Using', align: 'center', render: (_, c) => rules.filter((r) => r.channels.includes(c.name)).length },
        { title: 'Sent Today', align: 'center', render: (_, c) => formatNumber(c.sentToday) },
        { title: 'Enabled', align: 'center', render: (_, c) => <Switch checked={c.enabled} onChange={(v) => toggleChannel(c, v)} /> },
        { title: 'Action', align: 'center', render: (_, c) => <Button size="small" icon={<SendOutlined />} disabled={!c.enabled} onClick={() => sendTest(c)}>Send Test</Button> },
    ];

    return (
        <>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h1 className="text-[20px] font-bold m-0" style={{ color: COLORS.primary }}>Stage-wise Communication Matrix</h1>
                <Button type="primary" size="small" style={{ height: 28 }} onClick={() => setRuleForm({ rule: null })}>+ Create Communication Tool</Button>
            </div>

            <div className="grid gap-2 grid-cols-2 lg:grid-cols-4 mb-2">
                <StatCard label="Active Rules" value={stats.activeRules} icon={<BankOutlined />} tone="blue" />
                <StatCard label="Active Templates" value={stats.activeTemplates} icon={<UserOutlined />} tone="green" />
                <StatCard label="Reminders" value={stats.reminders} icon={<LoadingOutlined />} tone="orange" />
                <StatCard label="Sent Today" value={formatNumber(stats.sentToday)} icon={<CloseCircleOutlined />} tone="red" />
            </div>

            <Tabs
                className="page-tabs"
                activeKey={tab}
                onChange={setTab}
                items={[
                    { key: 'matrix', label: <span className="text-[13px]">Stage Wise Matrix</span> },
                    { key: 'templates', label: <span className="text-[13px]">Templates</span> },
                    { key: 'channels', label: <span className="text-[13px]">Channels</span> },
                    { key: 'logs', label: <span className="text-[13px]">Communication Logs</span> },
                ]}
            />

            {tab === 'matrix' && (
                <>
                    <div className="flex flex-wrap gap-2 mb-2">
                        <Input allowClear value={draft.q} onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))} onPressEnter={() => setFilters(draft)} placeholder="Search Stage/ Event/ Template" style={{ width: 230, background: '#F4F4F4' }} />
                        <Select value={draft.stage} onChange={(v) => setDraft((d) => ({ ...d, stage: v }))} style={{ width: 190 }} options={[{ value: 'all', label: 'All Stages' }, ...toOptions(COMM_STAGES)]} />
                        <Select value={draft.channel} onChange={(v) => setDraft((d) => ({ ...d, channel: v }))} style={{ width: 190 }} options={[{ value: 'all', label: 'All Channels' }, ...toOptions(COMM_CHANNELS)]} />
                        <Button type="primary" style={{ minWidth: 110 }} onClick={() => setFilters(draft)}>Apply Filters</Button>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
                        <h3 className="text-[14px] font-semibold m-0" style={{ color: COLORS.primary }}>Stage Wise Access Rules</h3>
                        <Button type="primary" onClick={exportMatrix}>Export Matrix</Button>
                    </div>
                    <DataTable className="table-blue-head" columns={ruleColumns} dataSource={filteredRules} pageSize={11} scrollX={1100} size="small" locale={{ emptyText: 'No rules match these filters' }} />
                </>
            )}

            {tab === 'templates' && (
                <DataTable
                    className="table-blue-head"
                    title="Communication Templates"
                    extra={<Button type="primary" onClick={() => setTemplateForm({ template: null })}>+ Add Template</Button>}
                    columns={templateColumns}
                    dataSource={templates}
                    pageSize={10}
                    scrollX={900}
                />
            )}

            {tab === 'logs' && (
                <DataTable className="table-blue-head" title={<span style={{ color: COLORS.primary }}>Communication Logs</span>} columns={logColumns} dataSource={logsCol.items} pageSize={10} scrollX={950} />
            )}

            <Modal open={!!viewLog} title={viewLog && `${viewLog.claim} · ${viewLog.communication}`} onCancel={() => setViewLog(null)} footer={null}>
                {viewLog && (
                    <div className="text-[12.5px] flex flex-col gap-1.5">
                        <div><b>Recipient:</b> {viewLog.recipient}</div>
                        <div><b>Channel:</b> {viewLog.channel} · <b>Status:</b> {viewLog.status}</div>
                        <div><b>Sent:</b> {dayjs(viewLog.at).format('DD MMM YYYY, hh:mm A')}</div>
                        <div className="rounded p-3 mt-1" style={{ background: COLORS.bgField }}>{viewLog.message}</div>
                    </div>
                )}
            </Modal>

            {tab === 'channels' && (
                <DataTable className="table-blue-head" title="Delivery Channels" columns={channelColumns} dataSource={channels} pagination={false} scrollX={900} />
            )}

            <RuleModal open={!!ruleForm} rule={ruleForm?.rule} templates={templates} onClose={() => setRuleForm(null)} onSave={saveRule} />
            <TemplateModal open={!!templateForm} template={templateForm?.template} onClose={() => setTemplateForm(null)} onSave={saveTemplate} />
        </>
    );
};

export default CommunicationSetupPage;
