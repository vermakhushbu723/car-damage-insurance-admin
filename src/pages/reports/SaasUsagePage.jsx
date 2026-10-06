import React, { useMemo, useState } from 'react';
import { Modal } from 'antd';
import {
    BankOutlined, TeamOutlined, LineChartOutlined, ApiOutlined, HddOutlined, BarChartOutlined, ArrowUpOutlined, ArrowDownOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PageTitle from '../../components/ui/PageTitle';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import ChartCard from '../../components/ui/ChartCard';
import { COLORS } from '../../constants/theme';
import { SAAS_USAGE, REGIONS } from '../../data/modules';
import { useCollection } from '../../store/AdminStore';
import { formatNumber } from '../../utils/format';

const CARD_META = {
    orgs: { icon: <BankOutlined />, tone: 'blue' },
    users: { icon: <TeamOutlined />, tone: 'purple' },
    sessions: { icon: <LineChartOutlined />, tone: 'orange' },
    api: { icon: <ApiOutlined />, tone: 'teal' },
    storage: { icon: <HddOutlined />, tone: 'green' },
    adoption: { icon: <BarChartOutlined />, tone: 'red' },
};

const TREND = {
    up: <ArrowUpOutlined style={{ color: COLORS.success }} />,
    'up-neutral': <ArrowUpOutlined style={{ color: COLORS.textPrimary }} />,
    flat: <ArrowRightOutlined style={{ color: COLORS.textMuted }} />,
    down: <ArrowDownOutlined style={{ color: COLORS.danger }} />,
};

const Bars = ({ rows, max }) => rows.map(([label, value]) => (
    <div key={label} className="grid items-center gap-2 py-1 text-[12px]" style={{ gridTemplateColumns: '130px 1fr 36px' }}>
        <span className="truncate">{label}</span>
        <div className="h-[9px]" style={{ background: '#D9D9D9' }}><div className="h-full" style={{ width: `${(value / max) * 100}%`, background: COLORS.primary }} /></div>
        <span className="text-right">{formatNumber(value)}</span>
    </div>
));

/**
 * SaaS Report Usage -- platform usage analytics (read-only figures) with
 * the live active-user count, and a region-wise claim breakdown from the
 * stored claims.
 */
const SaasUsagePage = () => {
    const { items: users } = useCollection('users');
    const { items: claims } = useCollection('claims');
    const [regionOpen, setRegionOpen] = useState(false);

    const cards = SAAS_USAGE.cards.map((c) => (c.key === 'users' ? { ...c, value: formatNumber(users.filter((u) => u.status === 'Active').length) } : c));
    const byRegion = useMemo(() => REGIONS.map((r) => [r, claims.filter((c) => c.region === r).length]), [claims]);
    const moduleMax = Math.max(...SAAS_USAGE.byModule.map(([, v]) => v)) * 1.05;
    const regionMax = Math.max(1, ...byRegion.map(([, v]) => v)) * 1.1;

    const columns = [
        { title: 'Module', dataIndex: 'module' },
        { title: 'Users', dataIndex: 'users', render: formatNumber },
        { title: 'Sessions', dataIndex: 'sessions', render: formatNumber, align: 'center' },
        { title: 'Usage %', dataIndex: 'usage', render: (v) => `${v}%`, align: 'center' },
        { title: 'Trend', dataIndex: 'trend', render: (t) => TREND[t], align: 'center' },
    ];

    return (
        <>
            <PageTitle title="SaaS Report Usage" />

            <div className="grid gap-2 grid-cols-2 md:grid-cols-3 xl:grid-cols-6 mb-3">
                {cards.map((c) => <StatCard key={c.key} label={c.label} value={c.value} icon={CARD_META[c.key].icon} tone={CARD_META[c.key].tone} trend={c.trend} trendLabel="Vs Last 30 Days" />)}
            </div>

            <div className="grid gap-2 grid-cols-1 lg:grid-cols-2 mb-3 max-w-[1100px]">
                <ChartCard title="DAU vs MAU Trend" onViewAll={() => setRegionOpen('trend')}>
                    <div style={{ height: 190 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={SAAS_USAGE.dauMau} margin={{ left: -18, right: 8, top: 6 }}>
                                <defs><linearGradient id="su-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4F7FD9" stopOpacity={0.45} /><stop offset="1" stopColor="#4F7FD9" stopOpacity={0.05} /></linearGradient></defs>
                                <CartesianGrid vertical={false} stroke="#EEE" />
                                <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                                <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${v / 1000}K`} />
                                <Tooltip />
                                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                                <Area isAnimationActive={false} type="linear" dataKey="mau" name="MAU" stroke="#C7D2FE" fill="none" strokeDasharray="4 3" />
                                <Area isAnimationActive={false} type="linear" dataKey="dau" name="DAU" stroke="#9AB3E6" fill="url(#su-area)" dot={{ r: 2.5, fill: COLORS.primary }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
                <ChartCard title="Claims By Region">
                    <Bars rows={SAAS_USAGE.byModule} max={moduleMax} />
                    <button type="button" onClick={() => setRegionOpen('region')} className="mt-1.5 text-left text-[12px] font-medium" style={{ color: COLORS.primary }}>View Regionwise Report</button>
                </ChartCard>
            </div>

            <DataTable title="Module Usage Table" columns={columns} dataSource={SAAS_USAGE.moduleTable} pageSize={6} scrollX={700} />

            <Modal open={regionOpen === 'region'} title="Regionwise Claims Report" onCancel={() => setRegionOpen(false)} footer={null}>
                <p className="text-[12px] mt-0" style={{ color: COLORS.textSecondary }}>Claims registered per region ({claims.length} total).</p>
                <Bars rows={byRegion} max={regionMax} />
            </Modal>
            <Modal open={regionOpen === 'trend'} title="DAU vs MAU — daily figures" onCancel={() => setRegionOpen(false)} footer={null}>
                <DataTable
                    rowKey="day"
                    columns={[{ title: 'Day', dataIndex: 'day' }, { title: 'DAU', dataIndex: 'dau', render: formatNumber }, { title: 'MAU', dataIndex: 'mau', render: formatNumber }, { title: 'DAU/MAU', render: (_, r) => `${Math.round((r.dau / r.mau) * 100)}%` }]}
                    dataSource={SAAS_USAGE.dauMau}
                    pagination={false}
                    scrollX={400}
                />
            </Modal>
        </>
    );
};

export default SaasUsagePage;
