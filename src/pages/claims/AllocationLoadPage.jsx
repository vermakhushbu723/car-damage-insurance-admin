import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Select, InputNumber, App, Progress } from 'antd';
import { UserOutlined, CheckOutlined, SmileOutlined, LockOutlined, ExclamationOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import PageTitle from '../../components/ui/PageTitle';
import StatCard from '../../components/ui/StatCard';
import ViewConfigLink from '../../components/ui/ViewConfigLink';
import { handlerLoad, HIGH_LOAD_PCT } from '../../components/dashboard/useDashboardStats';
import { COLORS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { useCollection, useLogChange, useReload } from '../../store/AdminStore';
import { api } from '../../api/client';

const OPEN_STAGES = ['Intimation', 'Survey', 'AI ILA', 'ILA', 'FLA'];

/**
 * Allocation Load -- handler load from the claims assigned to each claim
 * handler. "Reasigned" moves open claims to another handler on the server;
 * Edit unlocks capacity limits, Save stores them (the Dashboard follows).
 */
const AllocationLoadPage = () => {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const { items: users, update } = useCollection('users');
    const claimsCol = useCollection('claims');
    const { items: branches } = useCollection('branches');
    const logChange = useLogChange();
    const reload = useReload();
    const [moving, setMoving] = useState(false);

    const handlers = useMemo(() => users.filter((u) => u.roleKey === 'claim-handler' && u.status === 'Active').map((u) => ({ ...u, load: handlerLoad(u) })), [users]);
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
        overloaded: handlers.filter((h) => h.load.pct >= HIGH_LOAD_PCT).length,
        avg: handlers.length ? Math.round(handlers.reduce((n, h) => n + h.load.inProgress, 0) / handlers.length) : 0,
    };

    const location = (h) => {
        const b = branches.find((x) => x.id === h.extra?.branchId);
        return b ? b.name.replace(/ Branch| HO/, ' hub') : h.city;
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
                                    <td className="px-3 py-2 text-center">{h.load.inProgress}</td>
                                    <td className="px-3 py-2">
                                        {editing
                                            ? <InputNumber size="small" min={1} max={500} value={capDraft[h.id]} onChange={(v) => setCapDraft((d) => ({ ...d, [h.id]: v ?? 1 }))} />
                                            : <Progress percent={Math.min(100, h.load.pct)} size="small" strokeColor={h.load.pct >= HIGH_LOAD_PCT ? '#B91C1C' : COLORS.primary} format={() => `${h.load.pct}%`} />}
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
