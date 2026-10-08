import React, { useMemo, useState } from 'react';
import { Button, DatePicker, Select, Modal, Descriptions, App } from 'antd';
import { DatabaseOutlined, FileAddOutlined, LoadingOutlined, AuditOutlined, CheckSquareOutlined, CloseOutlined } from '@ant-design/icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import dayjs from 'dayjs';
import PageTitle from '../../components/ui/PageTitle';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusTag from '../../components/ui/StatusTag';
import ChartCard, { LegendRow } from '../../components/ui/ChartCard';
import { COLORS } from '../../constants/theme';
import { REGIONS, CLAIM_TYPES, CLAIM_STAGES } from '../../data/modules';
import { organizationName } from '../../auth/session';
import { useCollection } from '../../store/AdminStore';
import { downloadCsv, formatDate, formatNumber, periodTrend } from '../../utils/format';

const ASSESSMENT = ['AI ILA', 'ILA', 'FLA'];
const ORG_COLORS = ['#1463FF', '#2EB24B', '#EF4444', '#D4D4D8'];
const allOpt = (label, arr) => [{ value: 'all', label }, ...arr.map((v) => (typeof v === 'string' ? { value: v, label: v } : v))];

const EMPTY = { range: [dayjs().subtract(34, 'day'), dayjs()], branch: 'all', region: 'all', type: 'all', status: 'all', handler: 'all' };

/**
 * Claim Report -- filters apply on "Refresh Report"; stats, charts and the
 * claim table all come from the filtered claims. Export downloads the
 * filtered claims as CSV / Excel.
 */
const ClaimReportPage = () => {
    const { message } = App.useApp();
    const { items: claims } = useCollection('claims');
    const { items: branches } = useCollection('branches');
    const { items: users } = useCollection('users');
    const [draft, setDraft] = useState(EMPTY);
    const [filters, setFilters] = useState(EMPTY);
    const [viewing, setViewing] = useState(null);

    const handlers = users.filter((u) => u.roleKey === 'claim-handler');
    const rows = useMemo(() => claims.filter((c) => {
        const d = dayjs(c.intimatedAt);
        const [from, to] = filters.range ?? [];
        return (!from || !d.isBefore(from.startOf('day'))) && (!to || !d.isAfter(to.endOf('day')))
            && (filters.branch === 'all' || c.branchId === filters.branch)
            && (filters.region === 'all' || c.region === filters.region)
            && (filters.type === 'all' || c.type === filters.type)
            && (filters.status === 'all' || c.stage === filters.status)
            && (filters.handler === 'all' || c.handlerId === filters.handler);
    }), [claims, filters]);

    const stats = {
        total: rows.length,
        fresh: rows.filter((c) => dayjs(c.intimatedAt).isAfter(dayjs().subtract(7, 'day'))).length,
        survey: rows.filter((c) => c.stage === 'Survey').length,
        assessment: rows.filter((c) => ASSESSMENT.includes(c.stage)).length,
        settled: rows.filter((c) => c.stage === 'Settled').length,
        rejected: rows.filter((c) => c.stage === 'Rejected').length,
    };

    // Claim inflow for the filtered period in 4-day buckets.
    const trend = useMemo(() => {
        const [from, to] = filters.range ?? [dayjs().subtract(34, 'day'), dayjs()];
        const buckets = [];
        for (let d = from.startOf('day'); !d.isAfter(to); d = d.add(4, 'day')) {
            const end = d.add(4, 'day');
            buckets.push({ day: d.format('MMM DD'), claims: rows.filter((c) => !dayjs(c.intimatedAt).isBefore(d) && dayjs(c.intimatedAt).isBefore(end)).length });
        }
        return buckets;
    }, [rows, filters.range]);

    const orgs = useMemo(() => {
        // Branches of this insurer = SaaS; branches of partner organizations = Service Provider.
        const vendor = (b) => b.organization !== organizationName();
        return [
            { label: 'SaaS', count: branches.filter((b) => b.status === 'Active' && !vendor(b)).length },
            { label: 'Service Provider', count: branches.filter((b) => b.status !== 'Suspended' && vendor(b)).length },
            { label: 'Suspended', count: branches.filter((b) => b.status === 'Suspended').length },
            { label: 'Pending', count: branches.filter((b) => b.status === 'Pending' && !vendor(b)).length },
        ];
    }, [branches]);

    const byRegion = REGIONS.map((r) => ({ region: r, settled: rows.filter((c) => c.region === r && c.stage === 'Settled').length, total: rows.filter((c) => c.region === r).length }));

    const exportRows = (format) => {
        const ext = format === 'excel' ? 'xls' : 'csv';
        downloadCsv(`claim-report-${dayjs().format('YYYY-MM-DD')}.${ext}`, rows, [
            { title: 'Claim ID', value: (c) => c.id }, { title: 'Customer Name', value: (c) => c.customer }, { title: 'Claim Type', value: (c) => c.type },
            { title: 'Handler', value: (c) => c.handler }, { title: 'Amount', value: (c) => c.amount }, { title: 'SLA', value: (c) => `${c.slaDays} Days` },
            { title: 'Status', value: (c) => c.stage }, { title: 'Branch', value: (c) => c.branch }, { title: 'Region', value: (c) => c.region },
            { title: 'Intimation Date', value: (c) => formatDate(c.intimatedAt) },
        ]);
        message.success(`Exported ${rows.length} claim(s)`);
    };

    const set = (k) => (v) => setDraft((d) => ({ ...d, [k]: v }));
    const filterCol = (label, el) => <label className="flex flex-col gap-1 min-w-0"><span className="text-[13px] font-semibold">{label}</span>{el}</label>;

    const columns = [
        { title: 'Claim ID', dataIndex: 'id' },
        { title: 'Customer Name', dataIndex: 'customer' },
        { title: 'Claim Type', dataIndex: 'type' },
        { title: 'Handler', dataIndex: 'handler' },
        { title: 'Ammount', dataIndex: 'amount', render: formatNumber, align: 'right' },
        { title: 'SLA', dataIndex: 'slaDays', render: (d) => `${d} Days`, align: 'center' },
        { title: 'Staus', dataIndex: 'stage', render: (s) => <StatusTag status={s} minWidth={70} />, align: 'center' },
        { title: 'Intimation Date', dataIndex: 'intimatedAt', render: formatDate },
        { title: 'Action', render: (_, c) => <Button type="link" size="small" onClick={() => setViewing(c)}>View</Button>, align: 'center' },
    ];

    return (
        <>
            <PageTitle title="Claim Report" className="mb-2" />

            <div className="filter-bar grid gap-2 mb-3 items-end overflow-x-auto pb-1" style={{ gridTemplateColumns: '205px repeat(6, minmax(100px, 1fr)) auto' }}>
                {filterCol('Date Range', <DatePicker.RangePicker value={draft.range} onChange={set('range')} format="DD MMM YY" allowClear={false} />)}
                {filterCol('Branch', <Select value={draft.branch} onChange={set('branch')} options={allOpt('All Branches', branches.map((b) => ({ value: b.id, label: b.name })))} />)}
                {filterCol('Region', <Select value={draft.region} onChange={set('region')} options={allOpt('All Regions', REGIONS)} />)}
                {filterCol('Claim Type', <Select value={draft.type} onChange={set('type')} options={allOpt('All Types', CLAIM_TYPES)} />)}
                {filterCol('Status', <Select value={draft.status} onChange={set('status')} options={allOpt('All Status', CLAIM_STAGES)} />)}
                {filterCol('Handler', <Select value={draft.handler} onChange={set('handler')} options={allOpt('All', handlers.map((h) => ({ value: h.id, label: h.name })))} showSearch={{ optionFilterProp: 'label' }} />)}
                {filterCol('Export', <Select value={null} placeholder="Export Excel" onChange={exportRows} options={[{ value: 'excel', label: 'Export Excel' }, { value: 'csv', label: 'Export CSV' }]} />)}
                <Button type="primary" onClick={() => { setFilters(draft); message.success('Report refreshed'); }}>Refresh Report</Button>
            </div>

            <div className="grid gap-2 grid-cols-2 md:grid-cols-3 xl:grid-cols-6 mb-3">
                <StatCard label="Total Claims" value={formatNumber(stats.total)} icon={<DatabaseOutlined />} tone="blue" {...periodTrend(rows, (c) => c.intimatedAt)} />
                <StatCard label="New Claims" value={stats.fresh} icon={<FileAddOutlined />} tone="purple" {...periodTrend(rows, (c) => c.intimatedAt)} />
                <StatCard label="Pending Survey" value={stats.survey} icon={<LoadingOutlined />} tone="orange" {...periodTrend(rows, (c) => c.intimatedAt, (c) => c.stage === 'Survey')} />
                <StatCard label="Under Assessment" value={stats.assessment} icon={<AuditOutlined />} tone="teal" {...periodTrend(rows, (c) => c.intimatedAt, (c) => ASSESSMENT.includes(c.stage))} />
                <StatCard label="Settlement" value={stats.settled} icon={<CheckSquareOutlined />} tone="green" {...periodTrend(rows, (c) => c.intimatedAt, (c) => c.stage === 'Settled')} />
                <StatCard label="Rejected" value={stats.rejected} icon={<CloseOutlined />} tone="red" {...periodTrend(rows, (c) => c.intimatedAt, (c) => c.stage === 'Rejected')} />
            </div>

            <div className="grid gap-2 grid-cols-1 lg:grid-cols-3 mb-3">
                <ChartCard title="System Alerts" onViewAll={() => setFilters(EMPTY)}>
                    <div style={{ height: 190 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trend} margin={{ left: -24, right: 8, top: 6 }}>
                                <defs><linearGradient id="cr-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4F7FD9" stopOpacity={0.45} /><stop offset="1" stopColor="#4F7FD9" stopOpacity={0.05} /></linearGradient></defs>
                                <CartesianGrid vertical={false} stroke="#EEE" />
                                <XAxis dataKey="day" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                                <Tooltip />
                                <Area isAnimationActive={false} type="linear" dataKey="claims" stroke="#9AB3E6" fill="url(#cr-area)" dot={{ r: 2.5, fill: COLORS.primary }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
                <ChartCard title="Organization Overview">
                    <div className="flex items-center gap-2 flex-1">
                        <div className="relative shrink-0" style={{ width: 150, height: 150 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart><Pie isAnimationActive={false} data={orgs} dataKey="count" innerRadius={42} outerRadius={70} stroke="none">{orgs.map((o, i) => <Cell key={o.label} fill={ORG_COLORS[i]} />)}</Pie><Tooltip /></PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[20px] font-bold leading-none">{branches.length}</span><span className="text-[11px]">Total</span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">{orgs.map((o, i) => <LegendRow key={o.label} color={ORG_COLORS[i]} label={o.label} count={o.count} total={branches.length} />)}</div>
                    </div>
                </ChartCard>
                <ChartCard title="Settlement Performance By Region">
                    <div style={{ height: 190 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={byRegion} margin={{ left: -24, right: 8, top: 6 }}>
                                <CartesianGrid vertical={false} stroke="#EEE" />
                                <XAxis dataKey="region" tick={{ fontSize: 9 }} />
                                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                                <Tooltip />
                                <Bar isAnimationActive={false} dataKey="settled" name="Settled claims" fill={COLORS.primary} barSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            </div>

            <DataTable title="Claim Details" columns={columns} dataSource={rows} pageSize={8} scrollX={1000} locale={{ emptyText: 'No claims match these filters' }} />

            <Modal open={!!viewing} title={viewing?.id} onCancel={() => setViewing(null)} footer={null} width={620}>
                {viewing && (
                    <Descriptions column={2} size="small" bordered>
                        <Descriptions.Item label="Customer">{viewing.customer}</Descriptions.Item>
                        <Descriptions.Item label="Vehicle">{viewing.vehicleNo}</Descriptions.Item>
                        <Descriptions.Item label="Claim Type">{viewing.type}</Descriptions.Item>
                        <Descriptions.Item label="Amount">₹ {formatNumber(viewing.amount)}</Descriptions.Item>
                        <Descriptions.Item label="Handler">{viewing.handler}</Descriptions.Item>
                        <Descriptions.Item label="SLA">{viewing.slaDays} Days</Descriptions.Item>
                        <Descriptions.Item label="Branch">{viewing.branch}</Descriptions.Item>
                        <Descriptions.Item label="Region">{viewing.region}</Descriptions.Item>
                        <Descriptions.Item label="Status"><StatusTag status={viewing.stage} /></Descriptions.Item>
                        <Descriptions.Item label="Intimated">{formatDate(viewing.intimatedAt)}</Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </>
    );
};

export default ClaimReportPage;
