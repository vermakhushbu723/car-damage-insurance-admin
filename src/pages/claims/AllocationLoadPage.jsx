import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Select, InputNumber, App, Progress, Switch } from 'antd';
import { UserOutlined, CheckOutlined, SmileOutlined, LockOutlined, ExclamationOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import PageTitle from '../../components/ui/PageTitle';
import StatCard from '../../components/ui/StatCard';
import ViewConfigLink from '../../components/ui/ViewConfigLink';
import { handlerLoad } from '../../components/dashboard/useDashboardStats';
import { COLORS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { useCollection, useLogChange, useReload, useStoreValue } from '../../store/AdminStore';
import { api } from '../../api/client';

const OPEN_STAGES = ['Intimation', 'Survey', 'AI ILA', 'ILA', 'FLA'];

/**
 * Allocation Load -- handler load from the claims assigned to each claim
 * handler. "Reasigned" moves open claims to another handler on the server;
 * Edit unlocks capacity limits, Save stores them (the Dashboard follows).
 * Handler Allocation Rule: a handler is full at capacity x threshold% open
 * claims; new claims for a full handler are allocated to the least-loaded
 * handler with room (applied by admin-service when claims arrive).
 */
const OVERFLOW_OPTIONS = [
    { value: 'branch-first', label: 'Same branch first, then any handler' },
    { value: 'least-loaded', label: 'Least-loaded handler (any branch)' },
];
const onOff = (v) => (v ? 'ON' : 'OFF');

const AllocationLoadPage = () => {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const { items: users, update } = useCollection('users');
    const claimsCol = useCollection('claims');
    const { items: branches } = useCollection('branches');
    const logChange = useLogChange();
    const reload = useReload();
    const [moving, setMoving] = useState(false);
    const [rule, setRule] = useStoreValue('allocation');
    const [ruleDraft, setRuleDraft] = useState(rule);
    useEffect(() => setRuleDraft(rule), [rule]);
    const ruleDirty = JSON.stringify(ruleDraft) !== JSON.stringify(rule);
    const [rebalancing, setRebalancing] = useState(false);

    const handlers = useMemo(() => users.filter((u) => u.roleKey === 'claim-handler' && u.status === 'Active').map((u) => ({ ...u, load: handlerLoad(u, rule.thresholdPct) })), [users, rule.thresholdPct]);
    const [editing, setEditing] = useState(false);
    const [capDraft, setCapDraft] = useState({});
    const [reassign, setReassign] = useState(null); // { from, to, count }

    const resetDraft = () => setCapDraft(Object.fromEntries(handlers.map((h) => [h.id, h.load.capacityLimit])));
    useEffect(resetDraft, [handlers]); // eslint-disable-line react-hooks/exhaustive-deps

    const dirty = handlers.some((h) => capDraft[h.id] !== undefined && capDraft[h.id] !== h.load.capacityLimit);
    const openClaims = claimsCol.items.filter((c) => OPEN_STAGES.includes(c.stage));
    const stats = {
        pending: openClaims.length,
        today: claimsCol.items.filter((c) => dayjs(c.intimatedAt).isAfter(dayjs().subtract(1, 'day'))).length,
        handlers: handlers.length,
        overloaded: handlers.filter((h) => h.load.status === 'High Load').length,
        avg: handlers.length ? Math.round(handlers.reduce((n, h) => n + h.load.inProgress, 0) / handlers.length) : 0,
    };

    const location = (h) => {
        const b = branches.find((x) => x.id === h.extra?.branchId);
        return b ? b.name.replace(/ Branch| HO/, ' hub') : h.city;
    };

    const saveRule = async () => {
        if (!(await setRule(ruleDraft))) return;
        if (rule.autoAllocate !== ruleDraft.autoAllocate) logChange('Allocation', 'Auto-allocation', onOff(rule.autoAllocate), onOff(ruleDraft.autoAllocate));
        if (rule.thresholdPct !== ruleDraft.thresholdPct) logChange('Allocation', 'Maximum threshold per handler', `${rule.thresholdPct}%`, `${ruleDraft.thresholdPct}%`);
        if (rule.overflow !== ruleDraft.overflow) logChange('Allocation', 'Overflow allocation', OVERFLOW_OPTIONS.find((o) => o.value === rule.overflow)?.label, OVERFLOW_OPTIONS.find((o) => o.value === ruleDraft.overflow)?.label);
        message.success('Handler allocation rule saved');
    };

    // Moves open claims off handlers above the threshold (newest first) to handlers with room.
    const rebalanceNow = async () => {
        setRebalancing(true);
        try {
            const res = await api.post('/claims/rebalance');
            await reload(['users', 'claims']);
            if (res.moved) {
                logChange('Allocation', 'Rebalance overloaded handlers', '—', `${res.moved} claim(s) moved`);
                message.success(`${res.moved} claim(s) moved to handlers with free capacity`);
            } else message.info('No handler is above the maximum threshold (or nobody has room).');
        } catch (err) {
            message.error(err.message);
        } finally {
            setRebalancing(false);
        }
    };

    const save = async () => {
        if (!dirty) {
            setEditing(false);
            return;
        }
        const changed = handlers.filter((h) => capDraft[h.id] !== h.load.capacityLimit);
        const saved = await Promise.all(changed.map((h) => update(h.id, { capacityLimit: capDraft[h.id] })));
        changed.forEach((h, i) => { if (saved[i]) logChange('Allocation', `${h.name} Capacity Limit`, h.load.capacityLimit, capDraft[h.id]); });
        setEditing(false);
        if (saved.every(Boolean)) message.success('Handler capacity saved');
    };

    const doReassign = async () => {
        const { from, to, count } = reassign;
        const src = handlers.find((h) => h.id === from);
        const dst = handlers.find((h) => h.id === to);
        if (!dst || !count) return;
        setMoving(true);
        try {
            // Oldest open claims of the source handler move to the target; loads are recounted on the server.
            const res = await api.post('/claims/reassign', { fromHandlerId: src.id, toHandlerId: dst.id, count });
            await reload(['users', 'claims']);
            logChange('Allocation', `Reassigned ${res.moved} claim(s)`, src.name, dst.name);
            message.success(`${res.moved} claim(s) moved from ${src.name} to ${dst.name}`);
            setReassign(null);
        } catch (err) {
            message.error(err.message);
        } finally {
            setMoving(false);
        }
    };

    const src = reassign && handlers.find((h) => h.id === reassign.from);

    return (
        <>
            <PageTitle
                title="Allocation Load"
                extra={(
                    <>
                        <Button type="primary" style={{ minWidth: 90 }} onClick={() => { if (editing) resetDraft(); setEditing((e) => !e); }}>{editing ? 'Cancel' : 'Edit'}</Button>
                        <Button type="primary" style={{ minWidth: 90 }} onClick={save} disabled={!dirty}>Save</Button>
                    </>
                )}
            />

            <div className="grid gap-2 grid-cols-2 lg:grid-cols-5 mb-3">
                <StatCard label="Claim Pending" value={stats.pending} icon={<UserOutlined />} tone="blue" footer={<ViewConfigLink arrow={false} onClick={() => navigate(ROUTES.CLAIM_REPORT)} />} />
                <StatCard label="Assigned Today" value={stats.today} icon={<CheckOutlined />} tone="green" footer={<ViewConfigLink onClick={() => navigate(ROUTES.CLAIM_REPORT)} />} />
                <StatCard label="Handler" value={stats.handlers} icon={<SmileOutlined />} tone="orange" footer={<ViewConfigLink onClick={() => navigate(ROUTES.USER_ACTIVATION)} />} />
                <StatCard label="Overloaded" value={stats.overloaded} icon={<LockOutlined />} tone="red" footer={<ViewConfigLink onClick={() => setEditing(true)} />} />
                <StatCard label="Average Load" value={stats.avg} icon={<ExclamationOutlined />} tone="purple" footer={<ViewConfigLink onClick={() => navigate(ROUTES.DASHBOARD)} />} />
            </div>

            <div className="rounded-md p-3 mb-3" style={{ background: '#fff', border: `1px solid ${COLORS.border}` }}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h3 className="text-[15px] font-semibold m-0" style={{ color: COLORS.primary }}>Handler Allocation Rule</h3>
                    <div className="flex gap-2">
                        <Button size="small" onClick={rebalanceNow} loading={rebalancing} disabled={!rule.autoAllocate || handlers.length < 2}>Rebalance Overloaded</Button>
                        <Button size="small" type="primary" onClick={saveRule} disabled={!ruleDirty}>Save Rule</Button>
                    </div>
                </div>
                <div className="grid gap-3 grid-cols-1 md:grid-cols-3 text-[12.5px]">
                    <div className="flex flex-col gap-1">
                        <span className="font-medium">Auto-allocation</span>
                        <span className="flex items-center gap-2">
                            <Switch size="small" checked={ruleDraft.autoAllocate} onChange={(v) => setRuleDraft((d) => ({ ...d, autoAllocate: v }))} aria-label="Auto-allocation" />
                            <span style={{ color: COLORS.textSecondary }}>{ruleDraft.autoAllocate ? 'Overloaded handlers are skipped' : 'Claims stay with the handler sent'}</span>
                        </span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="font-medium">Maximum threshold per handler <span className="font-normal" style={{ color: COLORS.textSecondary }}>(% of capacity limit)</span></span>
                        <InputNumber size="small" min={10} max={100} step={5} value={ruleDraft.thresholdPct} onChange={(v) => setRuleDraft((d) => ({ ...d, thresholdPct: v ?? 90 }))} suffix="%" style={{ width: 140 }} aria-label="Maximum threshold per handler" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="font-medium">When a handler is full, allocate to</span>
                        <Select size="small" value={ruleDraft.overflow} onChange={(v) => setRuleDraft((d) => ({ ...d, overflow: v }))} options={OVERFLOW_OPTIONS} aria-label="Overflow allocation" />
                    </div>
                </div>
                <p className="text-[11.5px] m-0 mt-2" style={{ color: COLORS.textSecondary }}>
                    A handler is full at capacity limit × {ruleDraft.thresholdPct}% open claims (capacity 100 → {Math.floor(ruleDraft.thresholdPct)} open). New claims for a full handler go to the least-loaded handler with room; capacity limits are set with Edit.
                </p>
            </div>

            <div className="rounded-md" style={{ background: '#fff', border: `1px solid ${COLORS.border}` }}>
                <h3 className="text-[15px] font-semibold m-0 px-3 pt-3 pb-2" style={{ color: COLORS.primary }}>Current Handler Load</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse', minWidth: 720 }}>
                        <thead>
                            <tr style={{ background: COLORS.tableHead }}>
                                <th className="text-left font-semibold px-3 py-2">Handler</th>
                                <th className="text-left font-semibold px-3 py-2">Location</th>
                                <th className="text-center font-semibold px-3 py-2">Open</th>
                                <th className="text-left font-semibold px-3 py-2" style={{ width: 200 }}>{editing ? 'Capacity Limit' : 'Utilisation'}</th>
                                <th className="text-center font-semibold px-3 py-2">Load</th>
                            </tr>
                        </thead>
                        <tbody>
                            {handlers.map((h) => (
                                <tr key={h.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                                    <td className="px-3 py-2">{h.name}</td>
                                    <td className="px-3 py-2">{location(h)}</td>
                                    <td className="px-3 py-2 text-center">
                                        <span style={{ color: h.load.status === 'High Load' ? '#B91C1C' : undefined, fontWeight: h.load.status === 'High Load' ? 600 : 400 }}>{h.load.inProgress}</span>
                                        <span className="text-[11px]" style={{ color: COLORS.textMuted }}> / {h.load.limit}</span>
                                    </td>
                                    <td className="px-3 py-2">
                                        {editing
                                            ? <InputNumber size="small" min={1} max={500} value={capDraft[h.id]} onChange={(v) => setCapDraft((d) => ({ ...d, [h.id]: v ?? 1 }))} />
                                            : <Progress percent={Math.min(100, h.load.pct)} size="small" strokeColor={h.load.status === 'High Load' ? '#B91C1C' : COLORS.primary} format={() => `${h.load.pct}%`} />}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <Button size="small" type="link" disabled={!h.load.inProgress || handlers.length < 2} onClick={() => setReassign({ from: h.id, to: undefined, count: Math.min(5, h.load.inProgress) })}>Reasigned</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal open={!!reassign} title={`Reassign claims — ${src?.name ?? ''}`} onCancel={() => setReassign(null)} onOk={doReassign} okText="Reassign" okButtonProps={{ disabled: !reassign?.to, loading: moving }} destroyOnHidden>
                {reassign && (
                    <div className="flex flex-col gap-3 text-[12.5px]">
                        <div>{src.name} has <b>{src.load.inProgress}</b> open claim(s) · load {src.load.pct}%.</div>
                        <label className="flex flex-col">Move to handler
                            <Select
                                className="w-full mt-1"
                                placeholder="Select handler"
                                value={reassign.to}
                                onChange={(to) => setReassign((r) => ({ ...r, to }))}
                                options={handlers.filter((h) => h.id !== src.id).map((h) => ({ value: h.id, label: `${h.name} — ${h.load.pct}% load (${h.load.inProgress} open)` }))}
                            />
                        </label>
                        <label className="flex flex-col">Number of claims
                            <InputNumber className="w-full mt-1" min={1} max={src.load.inProgress} value={reassign.count} onChange={(count) => setReassign((r) => ({ ...r, count: count ?? 1 }))} />
                        </label>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default AllocationLoadPage;
