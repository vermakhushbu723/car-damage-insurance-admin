import React, { useMemo, useState } from 'react';
import { Button, DatePicker, Select, Dropdown, App } from 'antd';
import { DownloadOutlined, DownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import PageTitle from '../../components/ui/PageTitle';
import DataTable from '../../components/ui/DataTable';
import StatusTag from '../../components/ui/StatusTag';
import { COLORS } from '../../constants/theme';
import { TRIGGER_STATUSES } from '../../data/modules';
import { useCollection, useLogChange } from '../../store/AdminStore';
import { downloadCsv } from '../../utils/format';

const label = (text) => <span className="text-[11px] font-medium">{text} <span style={{ color: COLORS.danger }}>*</span></span>;

/**
 * Trigger History -- every fraud trigger raised on a claim. Filter by
 * date / status, change a trigger's status from its badge, export CSV.
 * Counts feed Fraud Routing and the Dashboard fraud summary.
 */
const TriggerHistoryPage = () => {
    const { message } = App.useApp();
    const triggers = useCollection('triggers');
    const logChange = useLogChange();
    const [from, setFrom] = useState(dayjs().subtract(30, 'day'));
    const [to, setTo] = useState(dayjs());
    const [status, setStatus] = useState('all');

    const rows = useMemo(() => triggers.items.filter((t) => {
        const d = dayjs(t.at);
        return (!from || !d.isBefore(from.startOf('day'))) && (!to || !d.isAfter(to.endOf('day'))) && (status === 'all' || t.status === status);
    }), [triggers.items, from, to, status]);

    const changeStatus = (t, next) => {
        if (next === t.status) return;
        triggers.update(t.id, { status: next });
        logChange('Fraud Triggers', `${t.claim} · ${t.trigger}`, t.status, next);
        message.success(`${t.claim} → ${next}`);
    };

    const exportCsv = () => {
        downloadCsv(`trigger-history-${dayjs().format('YYYY-MM-DD')}.csv`, rows, [
            { title: 'Date/Time', value: (t) => dayjs(t.at).format('DD MMM YYYY HH:mm') },
            { title: 'Claim', value: (t) => t.claim },
            { title: 'Trigger', value: (t) => t.trigger },
            { title: 'Score', value: (t) => t.score },
            { title: 'Route', value: (t) => t.route },
            { title: 'Reviewer', value: (t) => t.reviewer },
            { title: 'Status', value: (t) => t.status },
        ]);
        message.success(`Exported ${rows.length} trigger(s)`);
    };

    const columns = [
        { title: 'Date/Time', dataIndex: 'at', render: (d) => dayjs(d).format('DD MMM HH:mm') },
        { title: 'Claim', dataIndex: 'claim' },
        { title: 'Trigger', dataIndex: 'trigger' },
        { title: 'Score', dataIndex: 'score', align: 'center' },
        { title: 'Route', dataIndex: 'route' },
        { title: 'Reviewer', dataIndex: 'reviewer' },
        {
            title: 'Status',
            render: (_, t) => (
                <Dropdown trigger={['click']} menu={{ items: TRIGGER_STATUSES.map((s) => ({ key: s, label: s, disabled: s === t.status })), onClick: ({ key }) => changeStatus(t, key) }}>
                    <button type="button" className="inline-flex items-center gap-1" aria-label={`Change status of ${t.claim}`}>
                        <StatusTag status={t.status} minWidth={90} />

                        <DownOutlined style={{ fontSize: 9, color: COLORS.textMuted }} />
                    </button>
                </Dropdown>
            ),
        },
    ];

    return (
        <>
            <PageTitle title="Trigger History" extra={<Button type="primary" icon={<DownloadOutlined />} iconPlacement="end" onClick={exportCsv}>Export</Button>} />

            <div className="filter-bar grid grid-cols-1 md:grid-cols-3 gap-3 rounded-md p-3 mb-3 max-w-[1100px]" style={{ background: '#F4F4F4', border: '1px solid #E5E5E5' }}>
                <label className="flex flex-col gap-1">{label('From')}<DatePicker value={from} onChange={setFrom} format="DD-MM-YYYY" disabledDate={(d) => to && d.isAfter(to)} /></label>
                <label className="flex flex-col gap-1">{label('To')}<DatePicker value={to} onChange={setTo} format="DD-MM-YYYY" disabledDate={(d) => from && d.isBefore(from)} /></label>
                <label className="flex flex-col gap-1">{label('Status')}
                    <Select value={status} onChange={setStatus} options={[{ value: 'all', label: 'All/Open/Cleared' }, ...TRIGGER_STATUSES.map((s) => ({ value: s, label: s }))]} />
                </label>
            </div>

            <DataTable title={<span style={{ color: COLORS.primary }}>Trigger</span>} columns={columns} dataSource={rows} pageSize={10} scrollX={900} locale={{ emptyText: 'No triggers in this range' }} />
        </>
    );
};

export default TriggerHistoryPage;
