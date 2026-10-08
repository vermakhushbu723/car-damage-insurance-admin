import React, { useEffect, useState } from 'react';
import { Button, Tooltip, App } from 'antd';
import {
    FileAddOutlined, UserSwitchOutlined, UserOutlined, FileTextOutlined, RobotOutlined, AuditOutlined, ProfileOutlined,
    FileDoneOutlined, SafetyCertificateOutlined, WalletOutlined, FolderOpenOutlined, DollarOutlined,
} from '@ant-design/icons';
import { COLORS } from '../../constants/theme';
import { JOURNEY_STAGES } from '../../data/seed';
import { useLogChange, useStoreValue } from '../../store/AdminStore';
const STAGE_ICONS = {
    Intimation: FileAddOutlined,
    'Handler Allocation': UserSwitchOutlined,
    'Surveyor Allocation': UserOutlined,
    'Claim Details': FileTextOutlined,
    'AI ILA': RobotOutlined,
    'Handler ILA': AuditOutlined,
    FLA: ProfileOutlined,
    Recommendation: FileDoneOutlined,
    Approval: SafetyCertificateOutlined,
    'Survey Fee Bill': DollarOutlined,
    Settlement: WalletOutlined,
    DMS: FolderOpenOutlined,
};
const LOCKED_STAGES = ['Intimation'];
const MODE_LABEL = { saas: 'SaaS', full: 'Full - Insurer Workflow' };
const KEY_STAGES = ['Surveyor Allocation', 'Recommendation', 'Approval'];
const Box = ({ children, className = '' }) => (
    <div className={`rounded-lg min-w-0 ${className}`} style={{ background: '#fff', boxShadow: '0 1px 4px rgba(15,23,42,0.12)' }}>{children}</div>
);

const journeyBanner = (mode, enabled) => {
    const on = KEY_STAGES.filter((s) => enabled[s]);
    const off = KEY_STAGES.filter((s) => !enabled[s]);
    const list = (arr) => (arr.length > 1 ? `${arr.slice(0, -1).join(', ')} & ${arr[arr.length - 1]}` : arr[0]);
    const parts = [];
    if (on.length) parts.push(`${list(on)} ${on.length > 1 ? 'Are' : 'Is'} Enabled`);
    if (off.length) parts.push(`${list(off)} ${off.length > 1 ? 'Are' : 'Is'} Disabled`);
    const fee = mode === 'saas' ? 'Fee Bill Is Not Applicable' : `Survey Fee Bill Is ${enabled['Survey Fee Bill'] ? 'Enabled' : 'Disabled'}`;
    return `${mode === 'saas' ? 'SaaS' : 'Full Insurer Workflow'}: ${parts.join('. ')}. ${fee}`;
};

/** Claim Journey strip (Dashboard + Claim Flow) -- click a stage to switch it on/off, then Save Configuration. */
const ClaimJourney = () => {
    const { message } = App.useApp();
    const [config, setConfig] = useStoreValue('config');
    const logChange = useLogChange();
    const [mode, setMode] = useState(config.journey.mode);
    const [draft, setDraft] = useState(config.journey.enabled);

    // Pick up the saved configuration.
    useEffect(() => {
        setMode(config.journey.mode);
        setDraft(config.journey.enabled);
    }, [config.journey]);

    const stages = JOURNEY_STAGES[mode];
    const enabled = draft[mode];
    const dirty = mode !== config.journey.mode || JSON.stringify(draft) !== JSON.stringify(config.journey.enabled);

    const toggleStage = (stage) => {
        if (LOCKED_STAGES.includes(stage)) {
            message.info(`${stage} is always part of the claim journey.`);
            return;
        }
        setDraft((d) => ({ ...d, [mode]: { ...d[mode], [stage]: !d[mode][stage] } }));
    };

    const save = async () => {
        const before = config.journey;
        if (!(await setConfig((c) => ({ ...c, journey: { mode, enabled: draft } })))) return;
        if (before.mode !== mode) logChange('Claim Flow', 'Claim Journey Mode', MODE_LABEL[before.mode], MODE_LABEL[mode]);
        JOURNEY_STAGES[mode].forEach((s) => {
            if (before.enabled[mode][s] !== draft[mode][s]) logChange('Claim Flow', `${s} Stage`, before.enabled[mode][s] ? 'ON' : 'OFF', draft[mode][s] ? 'ON' : 'OFF');
        });
        message.success('Claim journey configuration saved');
    };

    const otherMode = mode === 'saas' ? 'full' : 'saas';

    return (
        <Box className="p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <h3 className="text-[13.5px] font-semibold m-0" style={{ color: COLORS.primary }}>Claim Journey - {mode === 'saas' ? 'SaaS' : 'Full Insurer Workflow'}</h3>
                <div className="flex gap-2">
                    <Button size="small" onClick={() => setMode(otherMode)} style={{ background: COLORS.primarySoft, color: COLORS.primary, border: 'none', height: 26 }}>
                        {otherMode === 'full' ? 'Full - Insurer Workflow' : 'SaaS Workflow'}
                    </Button>
                    <Button size="small" type="primary" onClick={save} disabled={!dirty} style={{ height: 26 }}>Save Configuration</Button>
                </div>
            </div>
            <div className="mt-2 rounded-md px-3 py-1.5 text-[12px]" style={{ background: COLORS.bgBanner, color: '#0F172A' }}>{journeyBanner(mode, enabled)}</div>
            <div className="mt-3 overflow-x-auto">
                <div className="flex items-start" style={{ minWidth: stages.length * 80 }}>
                    {stages.map((stage, i) => {
                        const Icon = STAGE_ICONS[stage] ?? FileTextOutlined;
                        const on = enabled[stage];
                        return (
                            <React.Fragment key={stage}>
                                <Tooltip title={LOCKED_STAGES.includes(stage) ? 'Always on' : `Click to turn ${on ? 'off' : 'on'}`}>
                                    <button type="button" onClick={() => toggleStage(stage)} className="flex flex-col items-center gap-1 shrink-0" style={{ width: 78 }}>
                                        <span
                                            className="flex items-center justify-center rounded-full text-white transition-all"
                                            style={{ width: 38, height: 38, fontSize: 17, background: on ? COLORS.primary : '#CBD5E1' }}
                                        >
                                            <Icon />
                                        </span>
                                        <span className="text-[11px] text-center leading-tight" style={{ color: on ? COLORS.primary : COLORS.textMuted, textDecoration: on ? 'none' : 'line-through' }}>{stage}</span>
                                    </button>
                                </Tooltip>
                                {i < stages.length - 1 && <span className="flex-1 mt-[19px] min-w-[8px]" style={{ borderTop: `1.5px solid ${COLORS.primary}`, opacity: 0.6 }} />}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </Box>
    );
};

export default ClaimJourney;
