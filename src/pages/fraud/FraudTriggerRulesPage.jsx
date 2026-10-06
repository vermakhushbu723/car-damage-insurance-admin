import React, { useState } from 'react';
import { Button, Modal, Form, Input, InputNumber, Select, App } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import PageTitle from '../../components/ui/PageTitle';
import OnOffSwitch from '../../components/ui/OnOffSwitch';
import StatusTag from '../../components/ui/StatusTag';
import { COLORS } from '../../constants/theme';
import { SEVERITIES, FRAUD_STAGES, RULE_DESIGN } from '../../data/modules';
import { useCollection, useLogChange, useStoreValue, newId } from '../../store/AdminStore';
import { formatNumber } from '../../utils/format';

const toOptions = (arr) => arr.map((v) => ({ value: v, label: v }));
const DOCUMENTS = ['Unique', 'Duplicate', 'Mismatch'];
const SEVERITY_RANK = { Low: 1, Medium: 2, High: 3, Critical: 4 };

/** Does `rule` fire for the simulated claim? */
const fires = (rule, sim) => {
    switch (rule.key) {
        case 'priorClaims': return sim.priorClaims >= (rule.threshold ?? 3);
        case 'mismatch': return sim.documents === 'Mismatch';
        case 'amount': return sim.amount > (rule.threshold ?? 50000);
        case 'duplicate': return sim.documents === 'Duplicate';
        default: return rule.threshold ? sim.amount > rule.threshold : false;
    }
};

/** Routing matrix row for a total score ("50", "30-49", "1-14"). */
const routeFor = (matrix, score) => matrix.filter((r) => r.active).find((r) => {
    const [lo, hi] = r.score.split('-').map(Number);
    return hi ? score >= lo && score <= hi : score >= lo;
});

/**
 * Fraud Trigger Rules -- rule table (toggle / Edit / Create; changes are
 * Draft until Publish Rules), a simulator that runs the active rules and
 * the routing matrix against a sample claim, and the rule-design notes.
 */
const FraudTriggerRulesPage = () => {
    const { message } = App.useApp();
    const rules = useCollection('fraudRules');
    const [routing] = useStoreValue('routing');
    const logChange = useLogChange();

    const [ruleForm, setRuleForm] = useState(null);
    const [sim, setSim] = useState({ amount: 75000, priorClaims: 3, documents: 'Duplicate' });
    const [result, setResult] = useState(null);
    const [form] = Form.useForm();

    const pending = rules.items.filter((r) => r.pending);

    const toggle = (r, active) => {
        rules.update(r.id, { active, pending: true });
        logChange('Fraud Trigger Rules', r.rule, r.active ? 'ON' : 'OFF', active ? 'ON' : 'OFF');
    };

    const save = (values) => {
        const editing = ruleForm?.rule;
        if (editing) {
            rules.update(editing.id, { ...values, pending: true });
            logChange('Fraud Trigger Rules', `${values.rule} rule`, `${editing.severity} · ${editing.score}`, `${values.severity} · ${values.score}`);
        } else {
            rules.setAll((l) => [...l, { ...values, id: newId('FR'), active: true, pending: true }]);
            logChange('Fraud Trigger Rules', 'Trigger Created', '—', `${values.rule} (${values.severity}, ${values.score})`);
        }
        message.success('Saved as draft — click Publish Rules to apply');
        setRuleForm(null);
    };

    const publish = () => {
        if (!pending.length) {
            message.info('No draft changes to publish.');
            return;
        }
        rules.setAll((l) => l.map(({ pending: _p, ...r }) => r));
        logChange('Fraud Trigger Rules', 'Publish Rules', '—', `${pending.length} rule(s) published`);
        message.success(`${pending.length} rule(s) published`);
    };

    const run = () => {
        const hits = rules.items.filter((r) => r.active && fires(r, sim));
        const score = hits.reduce((n, r) => n + Number(r.score), 0);
        const severity = hits.reduce((s, r) => (SEVERITY_RANK[r.severity] > SEVERITY_RANK[s] ? r.severity : s), 'Low');
        setResult({ hits, score, severity, route: score ? routeFor(routing.matrix, score) : null });
    };

    return (
        <>
            <PageTitle
                title="Fraud Trigger Rules"
                extra={(
                    <>
                        <Button type="primary" onClick={() => setRuleForm({ rule: null })}>+ Create Trigger</Button>
                        <Button type="primary" onClick={publish}>Publish Rules{pending.length ? ` (${pending.length})` : ''}</Button>
                    </>
                )}
            />

            <div className="rounded-md mb-3" style={{ background: '#fff', border: `1px solid ${COLORS.border}` }}>
                <h3 className="text-[15px] font-semibold m-0 px-3 pt-3 pb-2" style={{ color: COLORS.primary }}>Fraud Trigger Rule</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse', minWidth: 900 }}>
                        <thead>
                            <tr style={{ background: COLORS.tableHead }}>
                                {['Rule', 'Stage', 'Severity', 'Score', 'Condition', 'Action', 'Active', ''].map((h) => <th key={h} className="text-left font-semibold px-3 py-2">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {rules.items.map((r) => (
                                <tr key={r.id} style={{ borderTop: `1px solid ${COLORS.border}`, opacity: r.active ? 1 : 0.6 }}>
                                    <td className="px-3 py-2">{r.rule}{r.pending && <span className="ml-1.5"><StatusTag status="Draft" size="sm" minWidth={36} /></span>}</td>
                                    <td className="px-3 py-2">{r.stage}</td>
                                    <td className="px-3 py-2"><StatusTag status={r.severity} minWidth={64} /></td>
                                    <td className="px-3 py-2">{r.score}</td>
                                    <td className="px-3 py-2" style={{ maxWidth: 200 }}>{r.condition}</td>
                                    <td className="px-3 py-2">{r.action}</td>
                                    <td className="px-3 py-2"><OnOffSwitch checked={r.active} onChange={(v) => toggle(r, v)} ariaLabel={r.rule} /></td>
                                    <td className="px-3 py-2">
                                        <button type="button" onClick={() => setRuleForm({ rule: r })} className="rounded px-2.5 py-0.5 text-[12.5px]" style={{ background: COLORS.primarySoft, color: COLORS.primary }}>Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid gap-3 grid-cols-1 xl:grid-cols-2">
                <div className="rounded-md p-3" style={{ background: '#fff', border: `1px solid ${COLORS.border}` }}>
                    <h3 className="text-[15px] font-semibold m-0 mb-2" style={{ color: COLORS.primary }}>Rules Simulator</h3>
                    <div className="grid grid-cols-3 gap-2 text-[12.5px] font-semibold">
                        <label className="flex flex-col">Claim Amount<InputNumber className="w-full mt-1" min={0} step={5000} value={sim.amount} onChange={(v) => setSim((s) => ({ ...s, amount: v ?? 0 }))} /></label>
                        <label className="flex flex-col">Prior Claims<InputNumber className="w-full mt-1" min={0} max={20} value={sim.priorClaims} onChange={(v) => setSim((s) => ({ ...s, priorClaims: v ?? 0 }))} /></label>
                        <label className="flex flex-col">Documents<Select className="w-full mt-1" value={sim.documents} onChange={(v) => setSim((s) => ({ ...s, documents: v }))} options={toOptions(DOCUMENTS)} /></label>
                    </div>
                    <Button type="primary" className="mt-3" onClick={run}>Run Simulation</Button>
                    {result && (
                        <div className="mt-3 text-[12.5px]">
                            {rules.items.filter((r) => r.active).map((r) => {
                                const hit = result.hits.includes(r);
                                return (
                                    <div key={r.id} className="flex items-center gap-2 py-0.5">
                                        {hit ? <CloseCircleFilled style={{ color: COLORS.danger }} /> : <CheckCircleFilled style={{ color: COLORS.success }} />}
                                        <span>{r.rule}</span>
                                        <span className="ml-auto" style={{ color: hit ? COLORS.danger : COLORS.textMuted }}>{hit ? `+${r.score}` : 'not triggered'}</span>
                                    </div>
                                );
                            })}
                            <div className="mt-2 rounded px-3 py-2" style={{ background: result.score ? '#FDEFC8' : '#D1EEDD' }}>
                                <b>Total score {result.score}</b>
                                {result.score
                                    ? <> · {result.severity} · {result.route ? `${result.route.action} → ${result.route.recipient}${result.route.hold === 'Yes' ? ' (claim on hold)' : ''}` : 'No active routing for this score'}</>
                                    : ` · No trigger — claim of ₹ ${formatNumber(sim.amount)} continues normally`}
                            </div>
                        </div>
                    )}
                </div>
                <div className="rounded-md p-3" style={{ background: '#fff', border: `1px solid ${COLORS.border}` }}>
                    <h3 className="text-[15px] font-semibold m-0 mb-2" style={{ color: COLORS.primary }}>Rule Design</h3>
                    <div className="flex flex-col gap-2">
                        {RULE_DESIGN.map((t) => <div key={t} className="rounded px-3 py-2.5 text-[12px]" style={{ background: '#F4F4F4', border: '1px solid #E5E5E5', color: COLORS.textSecondary }}>{t}</div>)}
                    </div>
                </div>
            </div>

            <Modal
                open={!!ruleForm}
                title={ruleForm?.rule ? `Edit ${ruleForm.rule.rule}` : 'Create Trigger'}
                onCancel={() => setRuleForm(null)}
                onOk={() => form.submit()}
                okText="Save Draft"
                destroyOnHidden
                afterOpenChange={(o) => o && form.setFieldsValue(ruleForm?.rule ?? { stage: FRAUD_STAGES[0], severity: 'Medium', score: 20 })}
            >
                <Form form={form} layout="vertical" onFinish={save}>
                    <Form.Item name="rule" label="Rule" rules={[{ required: true, message: 'Enter rule name' }]}><Input /></Form.Item>
                    <div className="grid grid-cols-3 gap-x-3">
                        <Form.Item name="stage" label="Stage" rules={[{ required: true }]}><Select options={toOptions(FRAUD_STAGES)} /></Form.Item>
                        <Form.Item name="severity" label="Severity" rules={[{ required: true }]}><Select options={toOptions(SEVERITIES)} /></Form.Item>
                        <Form.Item name="score" label="Score" rules={[{ required: true, message: 'Enter score' }]}><InputNumber min={1} max={100} className="w-full" /></Form.Item>
                    </div>
                    <Form.Item name="condition" label="Condition" rules={[{ required: true, message: 'Enter condition' }]}><Input /></Form.Item>
                    <div className="grid grid-cols-2 gap-x-3">
                        <Form.Item name="action" label="Action" rules={[{ required: true, message: 'Enter action' }]}><Input placeholder="e.g. Route to audit" /></Form.Item>
                        <Form.Item name="threshold" label="Threshold (optional)" extra="Amount or count used by the simulator"><InputNumber min={0} className="w-full" /></Form.Item>
                    </div>
                </Form>
            </Modal>
        </>
    );
};

export default FraudTriggerRulesPage;
