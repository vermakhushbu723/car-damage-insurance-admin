import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Switch, Tooltip, App } from 'antd';
import {
    TeamOutlined, ApartmentOutlined, CheckSquareOutlined, LineChartOutlined, SafetyOutlined, InfoCircleOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import { ROUTES } from '../../constants/routes';
import { useLogChange, useStoreValue } from '../../store/AdminStore';
import { formatNumber } from '../../utils/format';
import useDashboardStats from './useDashboardStats';

const onOff = (v) => (v ? 'ON' : 'OFF');

const Card = ({ icon, color, title, info, children, linkLabel, onLink }) => (
    <div className="rounded-lg p-2.5 flex flex-col min-w-0" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(15,23,42,0.12)' }}>
        <div className="flex items-center gap-2 mb-1.5">
            <span className="flex items-center justify-center rounded-full shrink-0 text-white" style={{ width: 32, height: 32, background: color, fontSize: 15 }}>{icon}</span>
            <span className="flex-1 min-w-0 text-[13px] font-semibold truncate" style={{ color }}>{title}</span>
            <Tooltip title={info}><InfoCircleOutlined style={{ fontSize: 12, color: '#334155' }} /></Tooltip>
        </div>
        <div className="flex-1 flex flex-col gap-1 text-[11.5px]">{children}</div>
        <button type="button" onClick={onLink} className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-medium text-left" style={{ color: '#1677FF' }}>
            {linkLabel} <ArrowRightOutlined />
        </button>
    </div>
);

const ToggleRow = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between gap-2">
        <span>{label}</span>
        <Switch size="small" checked={checked} onChange={onChange} aria-label={label} />
    </div>
);

/**
 * The five module cards along the top of Dashboard / Active Users. The
 * toggles write straight to the stored config and land in "Recent
 * Configuration Changes".
 */
const ModuleCards = () => {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const stats = useDashboardStats();
    const [config, setConfig] = useStoreValue('config');
    const logChange = useLogChange();

    const toggle = (section, key, module, change) => async (value) => {
        if (!(await setConfig((c) => ({ ...c, [section]: { ...c[section], [key]: value } })))) return;
        logChange(module, change, onOff(!value), onOff(value));
        message.success(`${change} turned ${value ? 'on' : 'off'}`);
    };

    return (
        <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
            <Card icon={<TeamOutlined />} color="#1463FF" title="Active Users" info="Users with Active status across all roles" linkLabel="View Breakdown" onLink={() => navigate(ROUTES.ACTIVE_USERS)}>
                <span className="text-[22px] font-bold leading-none" style={{ color: '#0F172A' }}>{formatNumber(stats.activeUsers)}</span>
            </Card>

            <Card icon={<ApartmentOutlined />} color="#12894A" title="Claim Flow" info="Claim flow automation switches" linkLabel="Manage Flow Settings" onLink={() => navigate(ROUTES.CLAIM_FLOW)}>
                <ToggleRow label="Recommendation Engine" checked={config.claimFlow.recommendationEngine} onChange={toggle('claimFlow', 'recommendationEngine', 'Claim Flow', 'Recommendation Engine')} />
                <ToggleRow label="Auto - Approval" checked={config.claimFlow.autoApproval} onChange={toggle('claimFlow', 'autoApproval', 'Claim Flow', 'Auto-Approval')} />
            </Card>

            <Card icon={<CheckSquareOutlined />} color="#7C3AED" title="Approval Logic" info="Approval stages switched on for claims" linkLabel="Configue Approval Logic" onLink={() => navigate(ROUTES.APPROVAL_LOGIC)}>
                <ToggleRow label="ILA Approval" checked={config.approval.ila} onChange={toggle('approval', 'ila', 'Approval Logic', 'ILA Approval')} />
                <ToggleRow label="FLA Approval" checked={config.approval.fla} onChange={toggle('approval', 'fla', 'Approval Logic', 'FLA Approval')} />
            </Card>

            <Card icon={<LineChartOutlined />} color="#F59E0B" title="Allocation Load" info="Total claims vs capacity of active claim handlers" linkLabel="View Allocation Details" onLink={() => navigate(ROUTES.ALLOCATION_LOAD)}>
                <div className="flex justify-between"><span>Current Load</span><b>{stats.currentLoadPct}%</b></div>
                <div className="flex justify-between"><span>Mapped Handlers</span><b>{stats.mappedHandlers}</b></div>
            </Card>

            <Card icon={<SafetyOutlined />} color="#C81E1E" title="Fraud Routing" info="Auto-approve claims with no fraud trigger" linkLabel="Configure Routing" onLink={() => navigate(ROUTES.FRAUD_ROUTING)}>
                <ToggleRow label="Auto Approve" checked={config.fraud.autoApprove} onChange={toggle('fraud', 'autoApprove', 'Fraud Routing', 'Auto Approve')} />
            </Card>
        </div>
    );
};

export default ModuleCards;
