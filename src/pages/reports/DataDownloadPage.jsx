import React, { useState } from 'react';
import { Button, Select, DatePicker, App } from 'antd';
import { FileTextOutlined, TeamOutlined, FileDoneOutlined, CreditCardOutlined, AuditOutlined, ArrowDownOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import PageTitle from '../../components/ui/PageTitle';
import DataTable from '../../components/ui/DataTable';
import StatusTag from '../../components/ui/StatusTag';
import { COLORS } from '../../constants/theme';
import { DATA_TYPES, FORMATS, REGIONS } from '../../data/modules';
import { useCollection, useLogChange, newId } from '../../store/AdminStore';
import { getSession } from '../../auth/session';
import { downloadFile, formatDate, formatDateTime, formatSize, toDelimited } from '../../utils/format';

const TYPE_ICONS = { Claims: <FileTextOutlined />, Users: <TeamOutlined />, Survey: <FileDoneOutlined />, Payments: <CreditCardOutlined />, 'Audit Logs': <AuditOutlined /> };
const EXT = { CSV: 'csv', Excel: 'xls', JSON: 'json' };
const MIME = { CSV: 'text/csv;charset=utf-8', Excel: 'application/vnd.ms-excel', JSON: 'application/json' };

/**
 * Data Download -- pick data sets, date range and region, choose a format,
 * "Generate Download" builds the file from the stored data, downloads it
 * and adds it to the history (re-downloadable until it expires).
 */
const DataDownloadPage = () => {
    const { message } = App.useApp();
    const downloads = useCollection('downloads');
    const { items: claims } = useCollection('claims');
    const { items: users } = useCollection('users');
    const { items: auditEvents } = useCollection('auditEvents');
    const { items: changes } = useCollection('changes');
    const logChange = useLogChange();

    const [format, setFormat] = useState(undefined);
    const [types, setTypes] = useState(['Claims']);
    const [from, setFrom] = useState(dayjs().subtract(30, 'day'));
    const [to, setTo] = useState(dayjs());
    const [region, setRegion] = useState(undefined);

    /** Rows + columns for one data set within the spec's range / region. */
    const dataset = (type, spec) => {
        const inRange = (iso) => { const d = dayjs(iso); return !d.isBefore(dayjs(spec.from).startOf('day')) && !d.isAfter(dayjs(spec.to).endOf('day')); };
        const inRegion = (c) => !spec.region || c.region === spec.region;
        const claimCols = [
            { title: 'Claim ID', value: (c) => c.id }, { title: 'Customer', value: (c) => c.customer }, { title: 'Type', value: (c) => c.type },
            { title: 'Handler', value: (c) => c.handler }, { title: 'Amount', value: (c) => c.amount }, { title: 'Status', value: (c) => c.stage },
            { title: 'Branch', value: (c) => c.branch }, { title: 'Region', value: (c) => c.region }, { title: 'Intimated', value: (c) => formatDate(c.intimatedAt) },
        ];
        switch (type) {
            case 'Users':
                return {
                    rows: users.filter((u) => inRange(u.createdAt)),
                    cols: [{ title: 'User ID', value: (u) => u.userId }, { title: 'Name', value: (u) => u.name }, { title: 'Email', value: (u) => u.email }, { title: 'Organization', value: (u) => u.organization }, { title: 'Status', value: (u) => u.status }, { title: 'Created On', value: (u) => formatDateTime(u.createdAt) }],
                };
            case 'Survey':
                return { rows: claims.filter((c) => ['Survey', 'FLA'].includes(c.stage) && inRange(c.intimatedAt) && inRegion(c)), cols: claimCols };
            case 'Payments':
                return {
                    rows: claims.filter((c) => c.stage === 'Settled' && inRange(c.intimatedAt) && inRegion(c)),
                    cols: [{ title: 'Claim ID', value: (c) => c.id }, { title: 'Payee', value: (c) => c.customer }, { title: 'Amount', value: (c) => c.amount }, { title: 'Branch', value: (c) => c.branch }, { title: 'Region', value: (c) => c.region }],
                };
            case 'Audit Logs': {
                const events = [
                    ...auditEvents.map((e) => ({ at: e.at, user: e.user, module: e.module, update: e.update, status: e.status })),
                    ...changes.map((c) => ({ at: c.changedOn, user: c.changedBy, module: c.module, update: `${c.change}: ${c.oldValue} → ${c.newValue}`, status: 'Success' })),
                ].filter((e) => inRange(e.at));
                return { rows: events, cols: [{ title: 'Date & Time', value: (e) => formatDateTime(e.at) }, { title: 'User', value: (e) => e.user }, { title: 'Module', value: (e) => e.module }, { title: 'Update', value: (e) => e.update }, { title: 'Status', value: (e) => e.status }] };
            }
            default:
                return { rows: claims.filter((c) => inRange(c.intimatedAt) && inRegion(c)), cols: claimCols };
        }
    };

    /** Builds + downloads one file; returns its size in KB. */
    const buildFile = (fileName, type, spec) => {
        const { rows, cols } = dataset(type, spec);
        const content = spec.format === 'JSON'
            ? JSON.stringify(rows.map((r) => Object.fromEntries(cols.map((c) => [c.title, c.value(r)]))), null, 2)
            : toDelimited(rows, cols, spec.format === 'Excel' ? '\t' : ',');
        return { kb: downloadFile(fileName, content, MIME[spec.format]) / 1024, count: rows.length };
    };

    const generate = () => {
        if (!format) return message.warning('Select a format first.');
        if (!types.length) return message.warning('Select at least one data set.');
        if (!from || !to) return message.warning('Select the date range.');
        const spec = { format, from: from.toISOString(), to: to.toISOString(), region };
        types.forEach((type) => {
            const fileName = `${type.replace(' ', '_')}_${from.format('MMM_DD')}_to_${to.format('MMM_DD')}.${EXT[format]}`;
            const { kb, count } = buildFile(fileName, type, spec);
            downloads.add({ id: newId('DL'), fileName, dataType: type, by: getSession()?.name ?? 'Super Admin', at: new Date().toISOString(), sizeKb: kb, status: 'Ready', spec, rows: count });
            logChange('Data Download', `${type} export`, '—', `${fileName} (${count} rows)`);
        });
        message.success(`${types.length} file(s) generated`);
    };

    const redownload = (d) => {
        if (d.status !== 'Ready') return message.warning('This file has expired — generate it again.');
        const ext = d.fileName.split('.').pop();
        const fmt = ext === 'json' ? 'JSON' : ext === 'csv' ? 'CSV' : 'Excel';
        const spec = d.spec ?? { format: fmt, from: dayjs(d.at).subtract(30, 'day').toISOString(), to: d.at };
        buildFile(d.fileName.replace(/\.(zip|xlsx)$/, `.${EXT[spec.format]}`), d.dataType, spec);
        return message.success(`Downloading ${d.fileName}`);
    };

    const toggleType = (t) => setTypes((list) => (list.includes(t) ? list.filter((x) => x !== t) : [...list, t]));

    const columns = [
        { title: 'File Name', dataIndex: 'fileName' },
        { title: 'Data Type', dataIndex: 'dataType' },
        { title: 'Generated By', dataIndex: 'by' },
        { title: 'Generated On', dataIndex: 'at', render: formatDateTime },
        { title: 'File Size', dataIndex: 'sizeKb', render: formatSize },
        { title: 'Status', dataIndex: 'status', render: (s) => <StatusTag status={s} minWidth={70} />, align: 'center' },
        { title: 'Action', align: 'center', render: (_, d) => <Button type="text" size="small" aria-label={`Download ${d.fileName}`} icon={<ArrowDownOutlined style={{ color: d.status === 'Ready' ? COLORS.success : COLORS.textMuted }} />} onClick={() => redownload(d)} /> },
    ];

    const step = (n, title, children, last) => (
        <div className="flex-1 min-w-[220px] px-3" style={{ borderRight: last ? 'none' : `1px solid ${COLORS.border}` }}>
            <h3 className="text-[14px] font-semibold m-0 mb-2">{n}. {title}</h3>
            {children}
        </div>
    );

    return (
        <>
            <PageTitle
                title="Data Download"
                extra={(
                    <div className="flex items-end gap-2">
                        <label className="flex flex-col gap-0.5"><span className="text-[13px] font-semibold">Select Format</span>
                            <Select placeholder="Select Format" value={format} onChange={setFormat} options={FORMATS.map((f) => ({ value: f, label: f }))} style={{ width: 130 }} />
                        </label>
                        <Button type="primary" onClick={generate}>Generate Download</Button>
                    </div>
                )}
            />

            <div className="filter-bar flex flex-wrap gap-y-3 rounded-md py-3 mb-3" style={{ background: '#fff', border: `1px solid ${COLORS.border}` }}>
                {step(1, 'Select Data', (
                    <div className="flex flex-wrap gap-2">
                        {DATA_TYPES.map((t) => {
                            const on = types.includes(t);
                            return (
                                <button key={t} type="button" onClick={() => toggleType(t)} aria-pressed={on} className="flex flex-col items-center justify-center gap-0.5 rounded text-[10px] font-medium" style={{ width: 56, height: 50, color: COLORS.primary, background: on ? COLORS.bgSoftBlue : '#F4F4F4', border: `1px solid ${on ? COLORS.primary : '#E2E2E2'}` }}>
                                    <span className="text-[15px]">{TYPE_ICONS[t]}</span>{t}
                                </button>
                            );
                        })}
                    </div>
                ))}
                {step(2, 'Select Date Range', (
                    <div className="flex items-center gap-1.5">
                        <DatePicker value={from} onChange={setFrom} format="DD MMMM YYYY" disabledDate={(d) => to && d.isAfter(to)} style={{ width: 150 }} />
                        <span>—</span>
                        <DatePicker value={to} onChange={setTo} format="DD MMMM YYYY" disabledDate={(d) => from && d.isBefore(from)} style={{ width: 150 }} />
                    </div>
                ))}
                {step(3, 'Select', (
                    <Select allowClear placeholder="Select" value={region} onChange={setRegion} suffixIcon={<FilterOutlined />} options={REGIONS.map((r) => ({ value: r, label: `${r} Region` }))} style={{ width: 170 }} />
                ), true)}
            </div>

            <DataTable title="Download History" columns={columns} dataSource={downloads.items} pageSize={6} scrollX={900} />
        </>
    );
};

export default DataDownloadPage;
