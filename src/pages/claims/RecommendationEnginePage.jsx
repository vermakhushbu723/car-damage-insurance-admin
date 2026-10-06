import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Form, Input, Select, Switch, App } from 'antd';
import { UserOutlined, CheckOutlined, SmileOutlined, LockOutlined, ExclamationOutlined } from '@ant-design/icons';
import PageTitle from '../../components/ui/PageTitle';
import StatCard from '../../components/ui/StatCard';
import OnOffSwitch from '../../components/ui/OnOffSwitch';
import ViewConfigLink from '../../components/ui/ViewConfigLink';
import { COLORS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { PAYEE_TYPES } from '../../data/modules';
import { useCollection, useLogChange, useStoreValue, newId } from '../../store/AdminStore';

const RESULTS = ['Auto recommended', 'TCT review', 'Sr. TCT review', 'Hold'];
const STAGES = ['ILA', 'FLA', 'Payment Recomendation', 'Fraud trigger'];
const toOptions = (arr) => arr.map((v) => ({ value: v, label: v }));

/**
 * Recommendation Engine -- recommendation rules (Modify -> inline status,
 * Save Matrix -> store) and per-payee payment validation checks.
 */
const RecommendationEnginePage = () => {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const [rec, setRec] = useStoreValue('recommendation');
    const { items: claims } = useCollection('claims');
    const { items: triggers } = useCollection('triggers');
    const logChange = useLogChange();

    const [draft, setDraft] = useState(rec.rules);
    const [modifying, setModifying] = useState(false);
    const [payee, setPayee] = useState(PAYEE_TYPES[0]);
    const [ruleForm, setRuleForm] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => setDraft(rec.rules), [rec.rules]);
    const dirty = JSON.stringify(draft) !== JSON.stringify(rec.rules);

    // Live numbers from claims in recommendation-ready stages.
    const stats = useMemo(() => {
        const pending = claims.filter((c) => ['ILA', 'FLA', 'AI ILA'].includes(c.stage));
        const belowLimit = rec.rules.find((r) => r.id === 'RR-1')?.status === 'Active';
        const auto = belowLimit ? pending.filter((c) => c.amount <= 50000).length : 0;
        const exception = triggers.filter((t) => ['Open', 'Escalated'].includes(t.status)).length;
        return { pending: pending.length, auto, manual: Math.max(0, pending.length - auto), exception };
    }, [claims, triggers, rec.rules]);

    const saveMatrix = () => {
        if (!dirty) {
            message.info('No changes to save.');
            setModifying(false);
            return;
        }
        draft.forEach((r) => {
            const before = rec.rules.find((b) => b.id === r.id);
            if (!before) logChange('Recommendation Engine', 'Rule Added', '—', r.rule);
            else if (JSON.stringify(before) !== JSON.stringify(r)) logChange('Recommendation Engine', r.rule, `${before.condition} · ${before.result} · ${before.status}`, `${r.condition} · ${r.result} · ${r.status}`);
        });
        rec.rules.filter((b) => !draft.some((r) => r.id === b.id)).forEach((b) => logChange('Recommendation Engine', 'Rule Removed', b.rule, '—'));
        setRec((x) => ({ ...x, rules: draft }));
        setModifying(false);
        message.success('Recommendation matrix saved');
    };

    const saveRule = (values) => {
        const editing = ruleForm?.rule;
        if (editing) setDraft((l) => l.map((r) => (r.id === editing.id ? { ...r, ...values } : r)));
        else setDraft((l) => [...l, { id: newId('RR'), status: 'Active', ...values }]);
        setRuleForm(null);
        message.info('Changed — click Save Matrix to apply');
    };

    const togglePay = (check, on) => {
        setRec((x) => ({ ...x, payValidation: { ...x.payValidation, [payee]: x.payValidation[payee].map((c) => (c.id === check.id ? { ...c, on } : c)) } }));
        logChange('Recommendation Engine', `${payee} · ${check.label}`, check.on ? 'ON' : 'OFF', on ? 'ON' : 'OFF');
    };

    const avg = rec.stats.avgTatMin;

    return (
        <>
            <PageTitle
                title="Recommendation Engine"
                extra={(
                    <>
                        <Button type="primary" style={{ minWidth: 110 }} onClick={() => setRuleForm({ rule: null })}>+ Add New</Button>
                        <Button type="primary" style={{ minWidth: 110 }} onClick={() => { if (modifying) setDraft(rec.rules); setModifying((m) => !m); }}>{modifying ? 'Cancel' : 'Modify'}</Button>
                        <Button type="primary" style={{ minWidth: 110 }} onClick={saveMatrix} disabled={!dirty}>Save Matrix</Button>
                    </>
                )}
            />

            <div className="grid gap-2 grid-cols-2 lg:grid-cols-5 mb-3">
                <StatCard label="Pending Recommendations" value={stats.pending} icon={<UserOutlined />} tone="blue" footer={<ViewConfigLink arrow={false} onClick={() => navigate(ROUTES.CLAIM_REPORT)} />} />
                <StatCard label="Auto Recommender" value={stats.auto} icon={<CheckOutlined />} tone="green" footer={<ViewConfigLink onClick={() => navigate(ROUTES.APPROVAL_LOGIC)} />} />
                <StatCard label="Manual Review" value={stats.manual} icon={<SmileOutlined />} tone="orange" footer={<ViewConfigLink onClick={() => navigate(ROUTES.CLAIM_REPORT)} />} />
                <StatCard label="Exception" value={stats.exception} icon={<LockOutlined />} tone="red" footer={<ViewConfigLink onClick={() => navigate(ROUTES.TRIGGER_HISTORY)} />} />
                <StatCard label="Average TAT" value={`${Math.floor(avg / 60)}h ${avg % 60}m`} icon={<ExclamationOutlined />} tone="purple" footer={<ViewConfigLink onClick={() => navigate(ROUTES.CLAIM_FLOW)} />} />
            </div>

            <div className="rounded-md mb-3" style={{ background: '#fff', border: `1px solid ${COLORS.border}` }}>
                <h3 className="text-[15px] font-semibold m-0 px-3 pt-3 pb-2" style={{ color: COLORS.primary }}>Recommendation Rules</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse', minWidth: 760 }}>
                        <thead>
                            <tr style={{ background: COLORS.tableHead }}>
                                {['Rule', 'Condition', 'Stage', 'Result', 'Status', 'Action'].map((h) => <th key={h} className="text-left font-semibold px-3 py-2">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {draft.map((r) => (
                                <tr key={r.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                                    <td className="px-3 py-2">{r.rule}</td>
                                    <td className="px-3 py-2">{r.condition}</td>
                                    <td className="px-3 py-2">{r.stage}</td>
                                    <td className="px-3 py-2">{r.result}</td>
                                    <td className="px-3 py-2">
                                        {modifying
                                            ? <Switch size="small" checked={r.status === 'Active'} checkedChildren="Active" unCheckedChildren="Inactive" onChange={(v) => setDraft((l) => l.map((x) => (x.id === r.id ? { ...x, status: v ? 'Active' : 'Inactive' } : x)))} />
                                            : <span style={{ color: r.status === 'Active' ? COLORS.textPrimary : COLORS.textMuted }}>{r.status}</span>}
                                    </td>
                                    <td className="px-3 py-2">
                                        <Button size="small" type="link" className="p-0" onClick={() => setRuleForm({ rule: r })}>Edit</Button>
                                        {modifying && <Button size="small" type="link" danger className="ml-2 p-0" onClick={() => setDraft((l) => l.filter((x) => x.id !== r.id))}>Remove</Button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {dirty && <p className="text-[11.5px] px-3 py-2 m-0" style={{ color: COLORS.warning }}>Unsaved changes — click Save Matrix.</p>}
            </div>

            <div className="rounded-md p-3" style={{ background: '#fff', border: `1px solid ${COLORS.border}` }}>
                <h3 className="text-[15px] font-semibold m-0 mb-2" style={{ color: COLORS.primary }}>Pay Validation</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                    {PAYEE_TYPES.map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setPayee(p)}
                            className="rounded px-4 py-1 text-[12.5px] font-medium"
                            style={{ minWidth: 90, background: payee === p ? COLORS.primary : '#F1F1F1', color: payee === p ? '#fff' : '#111', border: `1px solid ${payee === p ? COLORS.primary : '#DDD'}` }}
                        >
                            {p}
                        </button>
                    ))}
                </div>
                {rec.payValidation[payee].map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-2.5 text-[13.5px]" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <span>{c.label}</span>
                        <OnOffSwitch checked={c.on} onChange={(v) => togglePay(c, v)} ariaLabel={c.label} />
                    </div>
                ))}
            </div>

            <Modal
                open={!!ruleForm}
                title={ruleForm?.rule ? `Edit ${ruleForm.rule.rule}` : 'Add Recommendation Rule'}
                onCancel={() => setRuleForm(null)}
                onOk={() => form.submit()}
                okText="Apply"
                destroyOnHidden
                afterOpenChange={(o) => o && form.setFieldsValue(ruleForm?.rule ?? { stage: STAGES[0], result: RESULTS[0] })}
            >
                <Form form={form} layout="vertical" onFinish={saveRule}>
                    <Form.Item name="rule" label="Rule" rules={[{ required: true, message: 'Enter rule name' }]}><Input /></Form.Item>
                    <Form.Item name="condition" label="Condition" rules={[{ required: true, message: 'Enter condition' }]}><Input placeholder="e.g. Amount 50K" /></Form.Item>
                    <div className="grid grid-cols-2 gap-x-3">
                        <Form.Item name="stage" label="Stage" rules={[{ required: true }]}><Select options={toOptions(STAGES)} /></Form.Item>
                        <Form.Item name="result" label="Result" rules={[{ required: true }]}><Select options={toOptions(RESULTS)} /></Form.Item>
                    </div>
                </Form>
            </Modal>
        </>
    );
};

export default RecommendationEnginePage;
