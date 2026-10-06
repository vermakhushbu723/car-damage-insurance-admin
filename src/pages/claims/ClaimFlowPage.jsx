import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tabs, Input, Modal, Form, App } from 'antd';
import { BankOutlined, TeamOutlined, LoadingOutlined, CloseCircleOutlined } from '@ant-design/icons';
import StatCard from '../../components/ui/StatCard';
import PageTitle from '../../components/ui/PageTitle';
import OnOffSwitch from '../../components/ui/OnOffSwitch';
import StatusTag from '../../components/ui/StatusTag';
import ClaimJourney from '../../components/dashboard/ClaimJourney';
import { COLORS, CHANNEL_STYLES } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { PERMISSION_MODULES, PERMISSION_ACTIONS } from '../../data/roles';
import { useCollection, useLogChange, useRoles, useStoreValue, newId } from '../../store/AdminStore';

const TABS = [
    { key: 'overview', label: 'Configuration Overview' },
    { key: 'rule', label: 'Stage Rule' },
    { key: 'comm', label: 'Communication Triggers' },
    { key: 'tat', label: 'Stage TAT' },
];

const Box = ({ title, children, className = '' }) => (
    <div className={`rounded-lg min-w-0 ${className}`} style={{ background: '#fff', border: `1px solid ${COLORS.border}` }}>
        {title && <h3 className="text-[15px] font-semibold m-0 px-3 pt-3 pb-2" style={{ color: COLORS.primary }}>{title}</h3>}
        {children}
    </div>
);

const th = 'text-left font-medium px-3 py-1.5';
const td = 'px-3 py-1.5';

/**
 * Claim Workflow & Role Configuration -- claim journey (shared with the
 * Dashboard), stage owner / TAT / rules (Edit -> change, Save -> store),
 * communication triggers per stage and the operating model.
 */
const ClaimFlowPage = () => {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const [stageConfig, setStageConfig] = useStoreValue('stageConfig');
    const { items: users } = useCollection('users');
    const { items: commRules } = useCollection('commRules');
    const roles = useRoles();
    const logChange = useLogChange();

    const [tab, setTab] = useState('tat');
    const [model, setModel] = useState('saas');
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(stageConfig.stages);
    const [addOpen, setAddOpen] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => setDraft(stageConfig.stages), [stageConfig.stages]);

    const dirty = JSON.stringify(draft) !== JSON.stringify(stageConfig.stages);
    const permissionRules = useMemo(
        () => roles.list.reduce((n, r) => n + PERMISSION_MODULES.reduce((m, mod) => m + PERMISSION_ACTIONS.filter((a) => r.permissions?.[mod]?.[a.key]).length, 0), 0),
        [roles.list],
    );

    const setStage = (id, patch) => setDraft((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));

    const save = () => {
        if (!dirty) {
            message.info('No changes to save.');
            setEditing(false);
            return;
        }
        draft.forEach((s) => {
            const before = stageConfig.stages.find((b) => b.id === s.id);
            if (!before) return;
            ['owner', 'tat', 'rule'].forEach((k) => { if (before[k] !== s[k]) logChange('Claim Flow', `${s.stage} ${k.toUpperCase()}`, before[k], s[k]); });
            if (before.active !== s.active) logChange('Claim Flow', `${s.stage} Stage`, before.active ? 'ON' : 'OFF', s.active ? 'ON' : 'OFF');
        });
        setStageConfig((c) => ({ ...c, stages: draft }));
        setEditing(false);
        message.success('Stage configuration saved');
    };

    const addStage = (values) => {
        const stage = { id: newId('ST'), active: true, ...values };
        setStageConfig((c) => ({ ...c, stages: [...c.stages, stage] }));
        logChange('Claim Flow', 'Stage Added', '—', `${values.stage} (${values.owner}, ${values.tat})`);
        message.success(`${values.stage} stage added`);
        setAddOpen(false);
        form.resetFields();
    };

    const editableCell = (s, key) => (editing
        ? <Input size="small" value={s[key]} onChange={(e) => setStage(s.id, { [key]: e.target.value })} style={{ background: '#fff' }} />
        : s[key]);

    const commCount = (stage) => commRules.filter((r) => stage.toLowerCase().startsWith(r.stage.toLowerCase().slice(0, 5))).length;
    const op = stageConfig.operatingModel[model];

    return (
        <>
            <PageTitle
                title="Claim Workflow & Role Configuration"
                extra={(
                    <>
                        <Button type="primary" style={{ minWidth: 100 }} onClick={() => setAddOpen(true)}>Add Stage</Button>
                        <Button style={{ minWidth: 100, color: COLORS.primary, borderColor: COLORS.primary }} onClick={() => setEditing((e) => !e)}>{editing ? 'Cancel Edit' : 'Edit'}</Button>
                        <Button style={{ minWidth: 100, color: COLORS.primary, borderColor: COLORS.primary }} onClick={save} disabled={!dirty}>Save</Button>
                    </>
                )}
            />

            <div className="grid gap-2 grid-cols-2 lg:grid-cols-4 mb-3">
                <StatCard label="Active Workflow Stages" value={draft.filter((s) => s.active).length} icon={<BankOutlined />} tone="blue" />
                <StatCard label="Active Roles" value={roles.list.length} icon={<TeamOutlined />} tone="green" onClick={() => navigate(ROUTES.ROLES)} />
                <StatCard label="Users" value={users.length} icon={<LoadingOutlined />} tone="orange" onClick={() => navigate(ROUTES.USER_ACTIVATION)} />
                <StatCard label="Permission Rules" value={permissionRules} icon={<CloseCircleOutlined />} tone="red" onClick={() => navigate(ROUTES.ROLES)} />
            </div>

            <ClaimJourney />

            <Tabs className="page-tabs mt-3" activeKey={tab} onChange={setTab} items={TABS.map((t) => ({ key: t.key, label: <span className="text-[13px]">{t.label}</span> }))} />

            {tab === 'tat' && (
                <div className="grid gap-3 grid-cols-1 xl:grid-cols-2">
                    <Box title="Stage  Configuration">
                        <div className="overflow-x-auto">
                            <table className="w-full text-[12.5px]" style={{ borderCollapse: 'collapse', minWidth: 460 }}>
                                <thead>
                                    <tr style={{ background: COLORS.primarySoft }}>
                                        <th className={th}>Stage</th><th className={th}>Owner</th><th className={th}>TAT</th><th className={`${th} text-center`}>Active</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {draft.map((s) => (
                                        <tr key={s.id} style={{ borderBottom: `1px solid ${COLORS.border}`, opacity: s.active ? 1 : 0.55 }}>
                                            <td className={td}>{s.stage}</td>
                                            <td className={td}>{editableCell(s, 'owner')}</td>
                                            <td className={td} style={{ width: 110 }}>{editableCell(s, 'tat')}</td>
                                            <td className={`${td} text-center`}><OnOffSwitch checked={s.active} onChange={(v) => setStage(s.id, { active: v })} ariaLabel={s.stage} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Box>
                    <Box title="Operating Model">
                        <div className="px-3 pb-3">
                            <Tabs
                                className="page-tabs"
                                activeKey={model}
                                onChange={setModel}
                                items={[{ key: 'saas', label: 'SaaS' }, { key: 'provider', label: 'As Service Provider' }]}
                            />
                            <div className="rounded px-3 py-1.5 text-[12px] mb-2" style={{ background: COLORS.primarySoft, color: COLORS.primary }}>{op.banner}</div>
                            {op.rows.map(([k, v]) => (
                                <div key={k} className="flex justify-between py-1.5 text-[13px]"><span>{k}</span><span>{v}</span></div>
                            ))}
                        </div>
                    </Box>
                </div>
            )}

            {tab === 'overview' && (
                <Box title="Configuration Overview">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12.5px]" style={{ borderCollapse: 'collapse', minWidth: 640 }}>
                            <thead>
                                <tr style={{ background: COLORS.primarySoft }}>
                                    <th className={th}>Stage</th><th className={th}>Owner</th><th className={th}>TAT</th><th className={th}>Communication Rules</th><th className={`${th} text-center`}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {draft.map((s) => (
                                    <tr key={s.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                                        <td className={td}>{s.stage}</td><td className={td}>{s.owner}</td><td className={td}>{s.tat}</td>
                                        <td className={td}>{commCount(s.stage)}</td>
                                        <td className={`${td} text-center`}><StatusTag status={s.active ? 'Active' : 'Inactive'} size="sm" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Box>
            )}

            {tab === 'rule' && (
                <Box title="Stage Rule">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12.5px]" style={{ borderCollapse: 'collapse', minWidth: 640 }}>
                            <thead>
                                <tr style={{ background: COLORS.primarySoft }}>
                                    <th className={th}>Stage</th><th className={th}>Rule</th><th className={th}>Owner</th><th className={`${th} text-center`}>Active</th>
                                </tr>
                            </thead>
                            <tbody>
                                {draft.map((s) => (
                                    <tr key={s.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                                        <td className={td} style={{ width: 170 }}>{s.stage}</td>
                                        <td className={td}>{editableCell(s, 'rule')}</td>
                                        <td className={td} style={{ width: 160 }}>{s.owner}</td>
                                        <td className={`${td} text-center`}><OnOffSwitch checked={s.active} onChange={(v) => setStage(s.id, { active: v })} ariaLabel={s.stage} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!editing && <p className="text-[11.5px] px-3 py-2 m-0" style={{ color: COLORS.textSecondary }}>Click Edit to change stage rules, then Save.</p>}
                </Box>
            )}

            {tab === 'comm' && (
                <Box title="Communication Triggers">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12.5px]" style={{ borderCollapse: 'collapse', minWidth: 720 }}>
                            <thead>
                                <tr style={{ background: COLORS.primarySoft }}>
                                    <th className={th}>Stage</th><th className={th}>Trigger/Event</th><th className={th}>Template</th><th className={th}>Channels</th><th className={th}>Reminder</th><th className={`${th} text-center`}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {commRules.map((r) => (
                                    <tr key={r.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                                        <td className={td}>{r.stage}</td><td className={td}>{r.trigger}</td><td className={td}>{r.template}</td>
                                        <td className={td}>
                                            <div className="flex gap-1">
                                                {r.channels.map((c) => <span key={c} className="rounded px-1.5 text-[11px]" style={{ background: CHANNEL_STYLES[c]?.bg, color: CHANNEL_STYLES[c]?.color }}>{c}</span>)}
                                            </div>
                                        </td>
                                        <td className={td}>{r.reminder}</td>
                                        <td className={`${td} text-center`}><StatusTag status={r.status} size="sm" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-3 py-2">
                        <Button size="small" type="link" className="p-0" onClick={() => navigate(ROUTES.COMMUNICATION)}>Manage in Communication Setup →</Button>
                    </div>
                </Box>
            )}

            <Modal open={addOpen} title="Add Stage" onCancel={() => setAddOpen(false)} onOk={() => form.submit()} okText="Add Stage" destroyOnHidden>
                <Form form={form} layout="vertical" onFinish={addStage}>
                    <Form.Item name="stage" label="Stage name" rules={[{ required: true, message: 'Enter stage name' }, { validator: (_, v) => (v && stageConfig.stages.some((s) => s.stage.toLowerCase() === v.trim().toLowerCase()) ? Promise.reject(new Error('Stage already exists')) : Promise.resolve()) }]}>
                        <Input placeholder="e.g. Salvage Disposal" />
                    </Form.Item>
                    <div className="grid grid-cols-2 gap-x-3">
                        <Form.Item name="owner" label="Owner" rules={[{ required: true, message: 'Enter owner' }]}><Input placeholder="e.g. Claim Handler" /></Form.Item>
                        <Form.Item name="tat" label="TAT" rules={[{ required: true, message: 'Enter TAT' }]}><Input placeholder="e.g. 04 Hrs" /></Form.Item>
                    </div>
                    <Form.Item name="rule" label="Stage rule" rules={[{ required: true, message: 'Enter rule' }]}><Input placeholder="e.g. Salvage value approved" /></Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default ClaimFlowPage;
