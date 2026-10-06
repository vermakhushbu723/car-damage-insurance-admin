import React, { useEffect, useState } from 'react';
import { Button, Tabs, Modal, Form, Input, InputNumber, Select, Switch, App, Empty } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import PageTitle from '../../components/ui/PageTitle';
import OnOffSwitch from '../../components/ui/OnOffSwitch';
import StatusTag from '../../components/ui/StatusTag';
import DataTable from '../../components/ui/DataTable';
import { COLORS, SEVERITY_STYLES } from '../../constants/theme';
import { SEVERITIES } from '../../data/modules';
import { useCollection, useLogChange, useStoreValue, newId } from '../../store/AdminStore';
import { getSession } from '../../auth/session';
import { formatDate, formatNumber } from '../../utils/format';

const toOptions = (arr) => arr.map((v) => ({ value: v, label: v }));
const APPROVAL_STAGES = ['ILA Approval', 'FLA Approval', 'Payment Approval', 'All Approval'];
const ACTIONS = ['Auto Approve', 'Route to authority', 'Hold and escalate', 'Manual review'];

/** Evaluates one approval rule against a test claim. Returns { pass, result }. */
const evaluate = (rule, t) => {
    if (rule.id === 'AR-2') {
        const pass = t.exceptions === 0 && t.surveyComplete;
        return { pass, result: pass ? rule.action : 'Manual review (exceptions or survey pending)' };
    }
    if (rule.id === 'AR-4') {
        return t.criticalFraud ? { pass: false, result: rule.action } : { pass: true, result: 'No hold — continue' };
    }
    const limit = rule.threshold ?? 50000;
    const pass = t.amount <= limit;
    return { pass, result: pass ? rule.action : `Above ₹ ${formatNumber(limit)} — route to authority` };
};

const SeverityChip = ({ value }) => {
    const s = SEVERITY_STYLES[value] ?? SEVERITY_STYLES.Low;
    return <span className="rounded-full px-2.5 py-0.5 text-[11.5px]" style={{ background: s.bg, color: s.color }}>{value}</span>;
};

const LogicCard = ({ rule, onToggle, onEdit, onTest }) => (
    <div className="rounded-md p-3" style={{ background: '#F4F4F4', border: '1px solid #DDDDDD' }}>
        <div className="flex items-center gap-3 mb-2">
            <SeverityChip value={rule.severity} />
            <h3 className="text-[15px] font-semibold m-0">{rule.title}</h3>
            {rule.pending && <StatusTag status="Draft" size="sm" minWidth={40} />}
        </div>
        <div className="grid gap-2 items-start text-[12px]" style={{ gridTemplateColumns: '1.4fr 1fr 0.9fr auto' }}>
            <div><div className="font-medium">Stage</div><div>{rule.stage}</div></div>
            <div><div className="font-medium">Condition</div><div>{rule.condition}{rule.threshold ? ` (₹ ${formatNumber(rule.threshold)})` : ''}</div></div>
            <div><div className="font-medium">Action</div><div>{rule.action}</div></div>
            <OnOffSwitch checked={rule.enabled} onChange={onToggle} ariaLabel={rule.title} />
        </div>
        <div className="flex gap-2 mt-2">
            <Button size="small" onClick={onEdit} style={{ borderColor: '#222', minWidth: 64 }}>Edit</Button>
            <Button size="small" onClick={onTest} style={{ borderColor: '#222' }}>Test Rule</Button>
        </div>
    </div>
);

/**
 * Approval Logic -- rule cards (shared with the Dashboard's Approval Logic
 * Matrix; edits stay "Draft" until Publish), the role authority matrix and
 * the publish history.
 */
const ApprovalLogicPage = () => {
    const { message } = App.useApp();
    const [config, setConfig] = useStoreValue('config');
    const authority = useCollection('authorityMatrix');
    const history = useCollection('approvalHistory');
    const logChange = useLogChange();

    const [tab, setTab] = useState('logic');
    const [ruleForm, setRuleForm] = useState(null);
    const [testRule, setTestRule] = useState(null);
    const [test, setTest] = useState({ amount: 45000, exceptions: 0, surveyComplete: true, criticalFraud: false });
    const [modifying, setModifying] = useState(false);
    const [matrixDraft, setMatrixDraft] = useState(authority.items);
    const [form] = Form.useForm();

    useEffect(() => setMatrixDraft(authority.items), [authority.items]);
    const rules = config.approvalRules;
    const matrixDirty = JSON.stringify(matrixDraft) !== JSON.stringify(authority.items);

    const patchRule = (id, patch) => setConfig((c) => ({ ...c, approvalRules: c.approvalRules.map((r) => (r.id === id ? { ...r, ...patch, pending: true } : r)) }));

    const toggle = (rule, v) => {
        patchRule(rule.id, { enabled: v });
        logChange('Approval Logic', rule.title, rule.enabled ? 'ON' : 'OFF', v ? 'ON' : 'OFF');
    };

    const saveRule = (values) => {
        const editing = ruleForm?.rule;
        if (editing) {
            patchRule(editing.id, values);
            logChange('Approval Logic', `${values.title} rule`, editing.condition, values.condition);
            message.success('Rule updated — publish to apply');
        } else {
            const rule = { ...values, id: newId('AR'), enabled: true, pending: true, name: values.title, desc: values.condition };
            setConfig((c) => ({ ...c, approvalRules: [...c.approvalRules, rule] }));
            logChange('Approval Logic', 'Rule Added', '—', values.title);
            message.success('Rule added — publish to apply');
        }
        setRuleForm(null);
    };

    const publish = () => {
        const pending = rules.filter((r) => r.pending);
        if (!pending.length) {
            message.info('No unpublished changes.');
            return;
        }
        const by = getSession()?.name ?? 'Super Admin';
        pending.forEach((r) => history.add({ id: newId('AH'), date: new Date().toISOString(), rule: r.title, changedBy: by, status: 'Published' }));
        setConfig((c) => ({ ...c, approvalRules: c.approvalRules.map(({ pending: _p, ...r }) => r) }));
        logChange('Approval Logic', 'Publish Changes', '—', `${pending.length} rule(s) published`);
        message.success(`${pending.length} rule(s) published`);
    };

    const setCell = (id, key, value) => setMatrixDraft((list) => list.map((r) => (r.id === id ? { ...r, [key]: value } : r)));

    const saveMatrix = () => {
        if (!matrixDirty) {
            message.info('No changes to save.');
            setModifying(false);
            return;
        }
        matrixDraft.forEach((r) => {
            const before = authority.items.find((b) => b.id === r.id);
            ['motorOD', 'fire', 'other'].forEach((k) => { if (before && before[k] !== r[k]) logChange('Approval Logic', `${r.role} · ${k === 'motorOD' ? 'Motor OD' : k === 'fire' ? 'Fire' : 'Other'}`, before[k], r[k]); });
            if (!before) logChange('Approval Logic', 'Authority Added', '—', r.role);
        });
        authority.setAll(matrixDraft);
        setModifying(false);
        message.success('Authority matrix saved');
    };

    const addAuthority = () => {
        setMatrixDraft((list) => [...list, { id: newId('AU'), role: 'New Role', motorOD: '--', fire: '--', other: '--' }]);
        setModifying(true);
    };

    const cell = (r, key) => (modifying
        ? <Input size="small" value={r[key]} onChange={(e) => setCell(r.id, key, e.target.value)} style={{ background: '#fff', maxWidth: 200 }} />
        : r[key]);

    const actions = {
        logic: (
            <>
                <Button type="primary" onClick={() => setRuleForm({ rule: null })}>+ Add Rule</Button>
                <Button type="primary" onClick={publish}>Publish changers{rules.some((r) => r.pending) ? ` (${rules.filter((r) => r.pending).length})` : ''}</Button>
            </>
        ),
        authority: (
            <>
                <Button type="primary" style={{ minWidth: 100 }} onClick={addAuthority}>+ Add New</Button>
                <Button type="primary" style={{ minWidth: 100 }} onClick={() => { if (modifying) setMatrixDraft(authority.items); setModifying((m) => !m); }}>{modifying ? 'Cancel' : 'Modify'}</Button>
                <Button type="primary" style={{ minWidth: 100 }} onClick={saveMatrix} disabled={!matrixDirty}>Save Matrix</Button>
            </>
        ),
        history: null,
    };

    const testResults = testRule && rules.filter((r) => (testRule === 'all' ? r.enabled : r.id === testRule.id)).map((r) => ({ rule: r, ...evaluate(r, test) }));

    return (
        <>
            <PageTitle title="Approval Logic" className="mb-1" extra={actions[tab]} />
            <Tabs
                className="page-tabs"
                activeKey={tab}
                onChange={setTab}
                items={[{ key: 'logic', label: 'Logic Matrix' }, { key: 'authority', label: 'Authority Matrix' }, { key: 'history', label: 'History' }].map((t) => ({ ...t, label: <span className="text-[13.5px]">{t.label}</span> }))}
            />

            {tab === 'logic' && (
                <div className="flex flex-col gap-2 max-w-[1200px]">
                    <div className="rounded-md px-3 py-2 text-center text-[13px]" style={{ background: COLORS.primarySoft, color: COLORS.primary, border: `1px solid ${COLORS.primary}` }}>
                        Auto Approval Executes Only When All Configured Condition Pass. Critical Fraud/Trigger Hold Always Overrides.
                        <Button size="small" type="link" onClick={() => setTestRule('all')}>Test all rules</Button>
                    </div>
                    {rules.map((r) => (
                        <LogicCard key={r.id} rule={r} onToggle={(v) => toggle(r, v)} onEdit={() => setRuleForm({ rule: r })} onTest={() => setTestRule(r)} />
                    ))}
                </div>
            )}

            {tab === 'authority' && (
                <div className="rounded-md" style={{ background: '#fff', border: `1px solid ${COLORS.border}` }}>
                    <h3 className="text-[15px] font-semibold m-0 px-3 pt-3 pb-2" style={{ color: COLORS.primary }}>Authority Matrix</h3>
                    <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: COLORS.tableHead }}>
                                {['Role', 'Motor OD', 'Fire', 'Other', ''].map((h) => <th key={h} className="text-left font-semibold px-3 py-2">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {matrixDraft.map((r) => (
                                <tr key={r.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                                    <td className="px-3 py-2">{cell(r, 'role')}</td>
                                    <td className="px-3 py-2">{cell(r, 'motorOD')}</td>
                                    <td className="px-3 py-2">{cell(r, 'fire')}</td>
                                    <td className="px-3 py-2">{cell(r, 'other')}</td>
                                    <td className="px-3 py-2 text-right" style={{ width: 70 }}>
                                        {modifying && <Button size="small" type="link" danger onClick={() => setMatrixDraft((l) => l.filter((x) => x.id !== r.id))}>Remove</Button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {modifying && <p className="text-[11.5px] px-3 py-2 m-0" style={{ color: COLORS.textSecondary }}>Edit the limits, then Save Matrix.</p>}
                </div>
            )}

            {tab === 'history' && (
                <div className="rounded-md" style={{ background: '#fff', border: `1px solid ${COLORS.border}` }}>
                    <h3 className="text-[15px] font-semibold m-0 px-3 pt-3 pb-2" style={{ color: COLORS.primary }}>Approval History</h3>
                    <DataTable
                        className="border-0"
                        columns={[
                            { title: 'Date', dataIndex: 'date', render: (d) => formatDate(d) },
                            { title: 'Rule', dataIndex: 'rule' },
                            { title: 'Changed by', dataIndex: 'changedBy' },
                            { title: 'Status', dataIndex: 'status', render: (s) => <StatusTag status={s} size="sm" /> },
                        ]}
                        dataSource={history.items}
                        pageSize={10}
                        scrollX={600}
                        locale={{ emptyText: <Empty description="No published changes yet" /> }}
                    />
                </div>
            )}

            <Modal
                open={!!ruleForm}
                title={ruleForm?.rule ? `Edit ${ruleForm.rule.title}` : 'Add Rule'}
                onCancel={() => setRuleForm(null)}
                onOk={() => form.submit()}
                okText="Save"
                destroyOnHidden
                afterOpenChange={(o) => o && form.setFieldsValue(ruleForm?.rule ?? { severity: 'High', stage: APPROVAL_STAGES[0], action: ACTIONS[0] })}
            >
                <Form form={form} layout="vertical" onFinish={saveRule}>
                    <Form.Item name="title" label="Rule name" rules={[{ required: true, message: 'Enter rule name' }]}><Input /></Form.Item>
                    <div className="grid grid-cols-2 gap-x-3">
                        <Form.Item name="severity" label="Severity" rules={[{ required: true }]}><Select options={toOptions(SEVERITIES)} /></Form.Item>
                        <Form.Item name="stage" label="Stage" rules={[{ required: true }]}><Select options={toOptions(APPROVAL_STAGES)} /></Form.Item>
                        <Form.Item name="action" label="Action" rules={[{ required: true }]}><Select options={toOptions(ACTIONS)} /></Form.Item>
                        <Form.Item name="threshold" label="Amount threshold (₹)"><InputNumber className="w-full" min={0} step={5000} /></Form.Item>
                    </div>
                    <Form.Item name="condition" label="Condition" rules={[{ required: true, message: 'Enter condition' }]}><Input /></Form.Item>
                </Form>
            </Modal>

            <Modal open={!!testRule} title={testRule === 'all' ? 'Test all active rules' : `Test Rule — ${testRule?.title}`} onCancel={() => setTestRule(null)} footer={null} width={560} destroyOnHidden>
                <div className="grid grid-cols-2 gap-3 mb-3 text-[12px]">
                    <label className="flex flex-col">Claim amount (₹)<InputNumber className="w-full mt-1" min={0} step={5000} value={test.amount} onChange={(v) => setTest((t) => ({ ...t, amount: v ?? 0 }))} /></label>
                    <label className="flex flex-col">Exception count<InputNumber className="w-full mt-1" min={0} value={test.exceptions} onChange={(v) => setTest((t) => ({ ...t, exceptions: v ?? 0 }))} /></label>
                    <label className="flex items-center gap-2">Survey complete <Switch size="small" checked={test.surveyComplete} onChange={(v) => setTest((t) => ({ ...t, surveyComplete: v }))} /></label>
                    <label className="flex items-center gap-2">Critical fraud trigger <Switch size="small" checked={test.criticalFraud} onChange={(v) => setTest((t) => ({ ...t, criticalFraud: v }))} /></label>
                </div>
                {testResults?.map(({ rule, pass, result }) => (
                    <div key={rule.id} className="flex items-center gap-2 rounded px-2 py-1.5 mb-1 text-[12.5px]" style={{ background: pass ? '#D1EEDD' : '#F6CDCD' }}>
                        {pass ? <CheckCircleFilled style={{ color: '#1E8E4E' }} /> : <CloseCircleFilled style={{ color: '#C81E1E' }} />}
                        <b>{rule.title}:</b> {result}
                    </div>
                ))}
                {testRule === 'all' && testResults && (
                    <div className="mt-2 text-[13px] font-semibold">
                        Outcome: {testResults.some((r) => r.rule.id === 'AR-4' && !r.pass) ? 'Hold and escalate' : testResults.every((r) => r.pass) ? 'Auto Approve' : 'Route to authority / manual review'}
                    </div>
                )}
            </Modal>
        </>
    );
};

export default ApprovalLogicPage;
