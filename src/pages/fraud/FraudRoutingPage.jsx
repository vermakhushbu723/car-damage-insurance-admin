import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, App, Empty } from 'antd';
import { UserOutlined, CheckOutlined, SmileOutlined, LockOutlined, ExclamationOutlined } from '@ant-design/icons';
import PageTitle from '../../components/ui/PageTitle';
import StatCard from '../../components/ui/StatCard';
import ViewConfigLink from '../../components/ui/ViewConfigLink';
import OnOffSwitch from '../../components/ui/OnOffSwitch';
import StatusTag from '../../components/ui/StatusTag';
import { COLORS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { useCollection, useLogChange, useStoreValue } from '../../store/AdminStore';

const OPEN = ['Open', 'Under review', 'Escalated'];

/**
 * Fraud Routing -- severity -> action routing matrix (Edit to change,
 * Save to store), the open trigger queue and routing safeguards.
 */
const FraudRoutingPage = () => {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const [routing, setRouting] = useStoreValue('routing');
    const { items: triggers } = useCollection('triggers');
    const logChange = useLogChange();

    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(routing.matrix);
    useEffect(() => setDraft(routing.matrix), [routing.matrix]);
    const dirty = JSON.stringify(draft) !== JSON.stringify(routing.matrix);

    const open = triggers.filter((t) => OPEN.includes(t.status));
    const stats = {
        active: open.length,
        autoRouted: routing.stats.autoRouted + triggers.length,
        critical: open.filter((t) => t.score >= 50).length,
        audit: open.filter((t) => t.route === 'Audit').length,
        cleared: routing.stats.autoCleared + triggers.filter((t) => t.status === 'Cleared').length,
    };

    const setRow = (id, patch) => setDraft((l) => l.map((r) => (r.id === id ? { ...r, ...patch } : r)));

    const save = async () => {
        if (!dirty) {
            message.info('No changes to save.');
            setEditing(false);
            return;
        }
        draft.forEach((r) => {
            const b = routing.matrix.find((x) => x.id === r.id);
            ['score', 'action', 'recipient', 'hold'].forEach((k) => { if (b[k] !== r[k]) logChange('Fraud Routing', `${r.severity} ${k}`, b[k], r[k]); });
            if (b.active !== r.active) logChange('Fraud Routing', `${r.severity} routing`, b.active ? 'ON' : 'OFF', r.active ? 'ON' : 'OFF');
        });
        if (!(await setRouting((x) => ({ ...x, matrix: draft })))) return;
        setEditing(false);
        message.success('Routing matrix saved');
    };

    const toggleSafeguard = async (s, on) => {
        if (!(await setRouting((x) => ({ ...x, safeguards: x.safeguards.map((g) => (g.id === s.id ? { ...g, on } : g)) })))) return;
        logChange('Fraud Routing', s.label, s.on ? 'ON' : 'OFF', on ? 'ON' : 'OFF');
    };

    const cell = (r, key, opts) => {
        if (!editing) return r[key];
        if (opts) return <Select size="small" value={r[key]} onChange={(v) => setRow(r.id, { [key]: v })} options={opts.map((o) => ({ value: o, label: o }))} style={{ width: 80 }} />;
        return <Input size="small" value={r[key]} onChange={(e) => setRow(r.id, { [key]: e.target.value })} style={{ background: '#fff', maxWidth: 170 }} />;
    };

    return (
        <>
            <PageTitle
                title="Fraud Routing"
                extra={(
                    <>
                        <Button type="primary" style={{ minWidth: 90 }} onClick={() => { if (editing) setDraft(routing.matrix); setEditing((e) => !e); }}>{editing ? 'Cancel' : 'Edit'}</Button>
                        <Button type="primary" style={{ minWidth: 90 }} onClick={save} disabled={!dirty}>Save</Button>
                    </>
                )}
            />

            <div className="grid gap-2 grid-cols-2 lg:grid-cols-5 mb-3">
                <StatCard label="Active Trigger" value={stats.active} icon={<UserOutlined />} tone="blue" footer={<ViewConfigLink arrow={false} onClick={() => navigate(ROUTES.TRIGGER_HISTORY)} />} />
                <StatCard label="Auto Router" value={stats.autoRouted} icon={<CheckOutlined />} tone="green" footer={<ViewConfigLink onClick={() => setEditing(true)} />} />
                <StatCard label="Critical Open" value={stats.critical} icon={<SmileOutlined />} tone="orange" footer={<ViewConfigLink onClick={() => navigate(ROUTES.TRIGGER_HISTORY)} />} />
                <StatCard label="Audit Queue" value={stats.audit} icon={<LockOutlined />} tone="red" footer={<ViewConfigLink onClick={() => navigate(ROUTES.TRIGGER_HISTORY)} />} />
                <StatCard label="Auto Cleared" value={stats.cleared} icon={<ExclamationOutlined />} tone="purple" footer={<ViewConfigLink onClick={() => navigate(ROUTES.FRAUD_TRIGGER_RULES)} />} />
            </div>

            <div className="rounded-md mb-3" style={{ background: '#fff', border: `1px solid ${COLORS.border}` }}>
                <h3 className="text-[15px] font-semibold m-0 px-3 pt-3 pb-2" style={{ color: COLORS.primary }}>Routing Matrix</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse', minWidth: 760 }}>
                        <thead>
                            <tr style={{ background: COLORS.tableHead }}>
                                {['Severity', 'Score', 'Action', 'Recipient', 'Hold', 'Active'].map((h) => <th key={h} className={`font-semibold px-3 py-2 ${h === 'Active' ? 'text-center' : 'text-left'}`}>{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {draft.map((r) => (
                                <tr key={r.id} style={{ borderTop: `1px solid ${COLORS.border}`, opacity: r.active ? 1 : 0.55 }}>
                                    <td className="px-3 py-2">{r.severity}</td>
                                    <td className="px-3 py-2">{cell(r, 'score')}</td>
                                    <td className="px-3 py-2">{cell(r, 'action')}</td>
                                    <td className="px-3 py-2">{cell(r, 'recipient')}</td>
                                    <td className="px-3 py-2">{cell(r, 'hold', ['Yes', 'No'])}</td>
                                    <td className="px-3 py-2 text-center"><OnOffSwitch checked={r.active} onChange={(v) => setRow(r.id, { active: v })} ariaLabel={`${r.severity} routing`} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {dirty && <p className="text-[11.5px] px-3 py-2 m-0" style={{ color: COLORS.warning }}>Unsaved changes — click Save.</p>}
            </div>

            <div className="grid gap-3 grid-cols-1 xl:grid-cols-2">
                <div className="rounded-md p-3" style={{ background: '#F6F7F9', border: `1px solid ${COLORS.border}` }}>
                    <h3 className="text-[15px] font-semibold m-0 mb-2" style={{ color: COLORS.primary }}>Open Trigger Queue</h3>
                    {open.length ? open.map((t) => (
                        <button key={t.id} type="button" onClick={() => navigate(ROUTES.TRIGGER_HISTORY)} className="w-full flex items-center justify-between gap-2 py-1.5 text-left text-[12.5px]" style={{ borderBottom: '1px solid #DDD' }}>
                            <span><b className="mr-2">{t.claim}</b>{t.trigger}</span>
                            <StatusTag status={t.route === 'Audit' ? 'Audit' : 'Handler review'} size="sm" minWidth={50} />
                        </button>
                    )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No open triggers" />}
                </div>
                <div className="rounded-md p-3" style={{ background: '#F6F7F9', border: `1px solid ${COLORS.border}` }}>
                    <h3 className="text-[15px] font-semibold m-0 mb-2" style={{ color: COLORS.primary }}>Safeguards</h3>
                    {routing.safeguards.map((s) => (
                        <div key={s.id} className="flex items-center justify-between py-2 text-[12.5px]" style={{ borderBottom: '1px solid #DDD' }}>
                            <span>{s.label}</span>
                            <OnOffSwitch checked={s.on} onChange={(v) => toggleSafeguard(s, v)} ariaLabel={s.label} />
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default FraudRoutingPage;
