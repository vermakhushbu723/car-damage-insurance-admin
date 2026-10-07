import React, { useState } from 'react';
import { Button, Tabs, Modal, Form, Input, Select, Switch, App, Timeline } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import PageTitle from '../../components/ui/PageTitle';
import StatusTag from '../../components/ui/StatusTag';
import DataTable from '../../components/ui/DataTable';
import OnOffSwitch from '../../components/ui/OnOffSwitch';
import { COLORS } from '../../constants/theme';
import { RETENTION_OPTIONS } from '../../data/modules';
import { useCollection, useLogChange, useStoreValue, newId } from '../../store/AdminStore';
import { getSession } from '../../auth/session';

const fmtLong = (iso) => dayjs(iso).format('DD MMMM YYYY hh:mm A');
const ENVIRONMENTS = ['Production', 'UAT', 'Sandbox'];
const newer = (a, b) => a.split('.').map(Number).reduce((r, n, i) => (r !== 0 ? r : n - (b.split('.').map(Number)[i] ?? 0)), 0) > 0;

const Heading = ({ title, sub }) => (
    <div className="mb-2">
        <h2 className="text-[18px] font-bold m-0" style={{ color: COLORS.primary }}>{title}</h2>
        <p className="text-[12.5px] font-semibold m-0 mt-0.5 max-w-[460px]">{sub}</p>
    </div>
);

const Card = ({ children, className = '' }) => (
    <div className={`rounded-md p-3 min-w-0 ${className}`} style={{ background: '#fff', border: `1px solid ${COLORS.border}` }}>{children}</div>
);

const CardTitle = ({ children, extra }) => (
    <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-[15px] font-semibold m-0" style={{ color: COLORS.primary }}>{children}</h3>
        {extra}
    </div>
);

/**
 * System Settings -- external API connections (Test / Configure), platform
 * version & update policy, and audit / compliance controls. Every action is
 * written to the compliance activity table and the audit trail.
 */
const SystemSettingsPage = () => {
    const { message, modal } = App.useApp();
    const integrations = useCollection('integrations');
    const complianceLog = useCollection('complianceLog');
    const [sys, setSys] = useStoreValue('systemUpdate');
    const [compliance, setCompliance] = useStoreValue('compliance');
    const logChange = useLogChange();

    const [tab, setTab] = useState('api');
    const [testing, setTesting] = useState(null);
    const [configuring, setConfiguring] = useState(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [checking, setChecking] = useState(false);
    const [form] = Form.useForm();

    const user = getSession()?.name ?? 'Admin';
    const record = (activity, module, status = 'Success', by = user) => complianceLog.add({ id: newId('CL'), at: new Date().toISOString(), user: by, activity, module, status });

    // ---------- API integration ----------
    const test = (it) => {
        setTesting(it.id);
        setTimeout(() => {
            const ok = /^https:\/\//.test(it.endpoint ?? '');
            const responseSec = ok ? Math.round((0.5 + Math.random() * 2.4) * 10) / 10 : 0;
            const status = !ok ? 'Failed' : responseSec > 2 ? 'Warning' : 'Connected';
            integrations.update(it.id, { status, responseSec, syncAt: new Date().toISOString() });
            record(`Tested ${it.name}`, 'API Integration', ok ? 'Success' : 'Failed');
            setTesting(null);
            if (status === 'Connected') message.success(`${it.name}: connected in ${responseSec}s`);
            else if (status === 'Warning') message.warning(`${it.name}: slow response (${responseSec}s)`);
            else message.error(`${it.name}: connection failed — check the endpoint`);
        }, 900);
    };

    const saveConfig = (values) => {
        const it = configuring;
        integrations.update(it.id, { ...values, status: 'Connected', syncAt: new Date().toISOString() });
        logChange('API Integration', it.name, `${it.env} · ${it.endpoint}`, `${values.env} · ${values.endpoint}`);
        record('Updated API Configuration', 'API Integration');
        message.success(`${it.name} configuration saved`);
        setConfiguring(null);
    };

    const detailLine = (it) => {
        if (it.id === 'INT-2') return `Last sync ${dayjs(it.syncAt).isSame(dayjs(), 'day') ? 'Today' : dayjs(it.syncAt).format('DD MMM')} ${dayjs(it.syncAt).format('hh:mm A')}`;
        if (it.id === 'INT-3') return `Response Time ${it.responseSec} sec`;
        return `${it.type.toUpperCase()} - ${it.env}`;
    };

    // ---------- System update ----------
    const upToDate = !newer(sys.latest, sys.current);
    const checkUpdate = () => {
        setChecking(true);
        setTimeout(() => {
            setChecking(false);
            if (upToDate) {
                message.success(`${sys.product} v${sys.current} is the latest version.`);
                return;
            }
            modal.confirm({
                title: `Update to v${sys.latest}?`,
                content: sys.maintenanceApproval
                    ? 'Maintenance approval is required — this sends an update request for approval.'
                    : `The platform moves from v${sys.current} to v${sys.latest}.${sys.maintenanceMode ? ' Users are restricted during the update (maintenance mode on).' : ''}`,
                okText: sys.maintenanceApproval ? 'Request Approval' : 'Update Now',
                onOk: () => {
                    if (sys.maintenanceApproval) {
                        record(`Update to v${sys.latest} requested`, 'System Update', 'Approval Log');
                        logChange('System Update', 'Update request', `v${sys.current}`, `v${sys.latest} (awaiting approval)`);
                        message.info('Update request sent for maintenance approval');
                        return;
                    }
                    const deployment = { id: newId('DP'), version: sys.latest, at: new Date().toISOString(), by: user, notes: 'Platform update' };
                    setSys((s) => ({ ...s, current: s.latest, deployments: [deployment, ...s.deployments] }));
                    record(`Updated to v${sys.latest}`, 'System Update');
                    logChange('System Update', 'Platform Version', `v${sys.current}`, `v${sys.latest}`);
                    message.success(`Updated to v${sys.latest}`);
                },
            });
        }, 700);
    };

    const toggleSys = (key, label) => (v) => {
        setSys((s) => ({ ...s, [key]: v }));
        logChange('System Update', label, v ? 'OFF' : 'ON', v ? 'ON' : 'OFF');
        record(`${label} ${v ? 'enabled' : 'disabled'}`, 'System Update');
    };

    // ---------- Audit & compliance ----------
    const setComp = (key, label, value, display) => {
        const needsApproval = compliance.configApproval && key !== 'configApproval';
        setCompliance((c) => ({ ...c, [key]: value }));
        logChange('Compilance', label, display(compliance[key]), display(value));
        record(`Change ${label}`, 'Compilance', needsApproval ? 'Approval Log' : 'Success');
        if (needsApproval) message.info('Change recorded — config change approval is on, so it is logged for approval.');
    };
    const onOff = (v) => (v ? 'ON' : 'OFF');

    const latestDeploy = sys.deployments[0];

    return (
        <>
            <PageTitle title="System Settings" className="mb-1" />
            <Tabs
                className="page-tabs"
                activeKey={tab}
                onChange={setTab}
                items={[{ key: 'api', label: 'API Integration' }, { key: 'update', label: 'System Update' }, { key: 'audit', label: 'Audit & Compilance' }].map((t) => ({ ...t, label: <span className="text-[13.5px]">{t.label}</span> }))}
            />

            {tab === 'api' && (
                <>
                    <Heading title="API Integration" sub="External System connections used by IBima Assist" />
                    <div className="grid gap-2 grid-cols-1 lg:grid-cols-3 mb-3">
                        {integrations.items.map((it) => (
                            <Card key={it.id}>
                                <CardTitle extra={<StatusTag status={it.status} size="sm" minWidth={60} />}>{it.name}</CardTitle>
                                <div className="text-[12.5px]">{it.desc}</div>
                                <div className="text-[12.5px] mb-2">{detailLine(it)}</div>
                                <div className="grid grid-cols-2 gap-2 max-w-[260px]">
                                    <Button loading={testing === it.id} onClick={() => test(it)} style={{ color: COLORS.primary, borderColor: COLORS.primary }}>Test</Button>
                                    <Button type="primary" onClick={() => setConfiguring(it)}>Configure</Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                    <DataTable
                        className="table-blue-head"
                        pagination={false}
                        scrollX={800}
                        dataSource={integrations.items}
                        columns={[
                            { title: 'Intigration', dataIndex: 'name' },
                            { title: 'Type', dataIndex: 'type' },
                            { title: 'Environment', dataIndex: 'env' },
                            { title: 'Sync', dataIndex: 'syncAt', render: fmtLong },
                            { title: 'Status', dataIndex: 'status', render: (s) => <StatusTag status={s} minWidth={80} />, align: 'center' },
                            {
                                title: 'Action',
                                align: 'center',
                                render: (_, it) => (
                                    <button type="button" onClick={() => setConfiguring(it)} className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[12px]" style={{ background: COLORS.primarySoft, color: COLORS.primary }}>
                                        Edit <EditOutlined />
                                    </button>
                                ),
                            },
                        ]}
                    />
                </>
            )}

            {tab === 'update' && (
                <>
                    <Heading title="System Update" sub="Control Platforms Version updates maintenance and development history" />
                    <Card className="mb-3">
                        <CardTitle extra={<StatusTag status={upToDate ? 'Up to Date' : 'Pending'} size="sm" />}>Current Version</CardTitle>
                        <div className="text-[14px] font-semibold">{sys.product} v{sys.current}</div>
                        <div className="text-[11.5px] font-semibold mb-2">{sys.environment}</div>
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded px-3 py-3" style={{ background: COLORS.primarySoft }}>
                            <div>
                                <div className="text-[14px] font-semibold">Latest Available: v{sys.latest}</div>
                                <div className="text-[11.5px] font-semibold">Release Date {dayjs(sys.latestReleasedAt).format('DD MMMM YYYY')}</div>
                            </div>
                            <Button type="primary" loading={checking} onClick={checkUpdate}>Check/Update</Button>
                        </div>
                    </Card>
                    <div className="grid gap-2 grid-cols-1 lg:grid-cols-3">
                        <Card>
                            <CardTitle>Update Policy</CardTitle>
                            <div className="flex justify-between items-center py-1 text-[13px]"><span>Maintenance approval required</span><OnOffSwitch checked={sys.maintenanceApproval} onChange={toggleSys('maintenanceApproval', 'Maintenance approval')} /></div>
                            <div className="flex justify-between items-center py-1 text-[13px]"><span>Auto security patches</span><OnOffSwitch checked={sys.autoSecurityPatches} onChange={toggleSys('autoSecurityPatches', 'Auto security patches')} /></div>
                        </Card>
                        <Card>
                            <CardTitle>Maintenance Mode</CardTitle>
                            <div className="text-[13px]">Restrict Access during planned updates</div>
                            <div className="flex justify-between items-center py-1 text-[13px]"><span className="font-medium" style={{ color: sys.maintenanceMode ? COLORS.danger : COLORS.textPrimary }}>{sys.maintenanceMode ? 'ON' : 'OFF'}</span><OnOffSwitch checked={sys.maintenanceMode} onChange={toggleSys('maintenanceMode', 'Maintenance mode')} /></div>
                        </Card>
                        <Card>
                            <CardTitle extra={<span className="text-[13px] font-medium">v{latestDeploy.version}</span>}>Deployment History</CardTitle>
                            <div className="text-[13px]">Last successful development</div>
                            <div className="text-[13px] mb-2">{dayjs(latestDeploy.at).format('DD MMMM YYYY - hh:mm A')}</div>
                            <Button type="primary" style={{ minWidth: 110 }} onClick={() => setHistoryOpen(true)}>View</Button>
                        </Card>
                    </div>
                </>
            )}

            {tab === 'audit' && (
                <>
                    <Heading title="Audit & Compliance" sub="Configure audit controls and monitor compliance - sensitive activities" />
                    <div className="grid gap-2 grid-cols-1 lg:grid-cols-3 mb-3">
                        <Card>
                            <CardTitle>Audit Login</CardTitle>
                            <div className="text-[13px]">Record user and system activites</div>
                            <div className="text-[13px]">Capture admin action</div>
                            <div className="flex justify-end mt-2"><OnOffSwitch checked={compliance.auditLogin} onChange={(v) => setComp('auditLogin', 'Audit login', v, onOff)} /></div>
                        </Card>
                        <Card>
                            <CardTitle>Audit Retention</CardTitle>
                            <div className="text-[13px] mb-2">Audit retention period for audit records</div>
                            <Select className="w-full" value={compliance.retention} onChange={(v) => setComp('retention', 'Retention policy', v, (x) => x)} options={RETENTION_OPTIONS.map((o) => ({ value: o, label: o }))} />
                        </Card>
                        <Card>
                            <CardTitle>Compilance Control</CardTitle>
                            <div className="flex justify-between items-center py-1 text-[13px]"><span>Input activity loging</span><OnOffSwitch checked={compliance.inputLogging} onChange={(v) => setComp('inputLogging', 'Input activity logging', v, onOff)} /></div>
                            <div className="flex justify-between items-center py-1 text-[13px]"><span>Config change approval</span><OnOffSwitch checked={compliance.configApproval} onChange={(v) => setComp('configApproval', 'Config change approval', v, onOff)} /></div>
                        </Card>
                    </div>
                    <DataTable
                        className="table-blue-head"
                        pageSize={8}
                        scrollX={800}
                        dataSource={complianceLog.items}
                        columns={[
                            { title: 'Date & Time', dataIndex: 'at', render: fmtLong },
                            { title: 'User', dataIndex: 'user' },
                            { title: 'Activity', dataIndex: 'activity' },
                            { title: 'Module', dataIndex: 'module' },
                            { title: 'Status', dataIndex: 'status', render: (s) => <StatusTag status={s} minWidth={90} />, align: 'center' },
                        ]}
                    />
                </>
            )}

            <Modal
                open={!!configuring}
                title={`Configure ${configuring?.name ?? ''}`}
                onCancel={() => setConfiguring(null)}
                onOk={() => form.submit()}
                okText="Save"
                destroyOnHidden
                afterOpenChange={(o) => o && form.setFieldsValue({ ...configuring, apiKey: configuring?.apiKey ?? '' })}
            >
                <Form form={form} layout="vertical" onFinish={saveConfig}>
                    <Form.Item name="endpoint" label="Endpoint URL" rules={[{ required: true, message: 'Enter endpoint' }, { type: 'url', message: 'Enter a valid URL' }]}><Input placeholder="https://" /></Form.Item>
                    <div className="grid grid-cols-2 gap-x-3">
                        <Form.Item name="type" label="Type" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="env" label="Environment" rules={[{ required: true }]}><Select options={ENVIRONMENTS.map((e) => ({ value: e, label: e }))} /></Form.Item>
                    </div>
                    <Form.Item name="apiKey" label="API key / secret" extra="Stored only in this browser for the demo."><Input.Password placeholder="••••••••" /></Form.Item>
                    <Form.Item name="retry" label="Retry on failure" valuePropName="checked" initialValue><Switch size="small" /></Form.Item>
                </Form>
            </Modal>

            <Modal open={historyOpen} title="Deployment History" onCancel={() => setHistoryOpen(false)} footer={null}>
                <Timeline
                    items={sys.deployments.map((d) => ({
                        color: d.id === latestDeploy.id ? 'green' : 'blue',
                        content: <div className="text-[12.5px]"><b>v{d.version}</b> · {dayjs(d.at).format('DD MMM YYYY, hh:mm A')} · {d.by}<div style={{ color: COLORS.textSecondary }}>{d.notes}</div></div>,
                    }))}
                />
            </Modal>
        </>
    );
};

export default SystemSettingsPage;
