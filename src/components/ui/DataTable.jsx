import React from 'react';
import { Table } from 'antd';
import { COLORS } from '../../constants/theme';

/**
 * antd Table preset shared by every list screen: compact rows, horizontal
 * scroll on small screens, and the design's boxed pagination (styled in
 * index.css under .app-table). `title` renders the "Audit Logs Details"-
 * style heading row above the column header.
 */
const DataTable = ({ title, extra, pageSize = 8, pagination, scrollX = 900, className = '', ...tableProps }) => (
    <div className={`app-table rounded-lg overflow-hidden min-w-0 ${className}`} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}` }}>
        {(title || extra) && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                {title && <h3 className="text-[14px] font-semibold m-0" style={{ color: COLORS.textPrimary }}>{title}</h3>}
                {extra}
            </div>
        )}
        <Table
            rowKey="id"
            size="small"
            scroll={{ x: scrollX }}
            pagination={pagination === false ? false : {
                pageSize,
                showSizeChanger: false,
                placement: ['bottomEnd'],
                showTotal: (total, range) => <span className="text-xs text-slate-500">{range[0]}-{range[1]} of {total}</span>,
                ...pagination,
            }}
            {...tableProps}
        />
    </div>
);

export default DataTable;
