import React from 'react';
import { COLORS } from '../../constants/theme';

/** Bordered report card with a blue title and an optional "View All" link. */
const ChartCard = ({ title, onViewAll, children, className = '' }) => (
    <div className={`rounded-md p-3 min-w-0 flex flex-col ${className}`} style={{ background: '#fff', border: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="text-[14px] font-semibold m-0" style={{ color: COLORS.primary }}>{title}</h3>
            {onViewAll && <button type="button" onClick={onViewAll} className="text-[11px] font-medium" style={{ color: COLORS.primary }}>View All</button>}
        </div>
        {children}
    </div>
);

/** Donut legend row: color dot, label, "12(56%)". */
export const LegendRow = ({ color, label, count, total }) => (
    <div className="flex items-center gap-2 text-[11.5px] py-0.5">
        <span className="rounded-full shrink-0" style={{ width: 10, height: 10, background: color }} />
        <span className="flex-1 truncate">{label}</span>
        <span className="font-medium">{String(count).padStart(2, '0')}({total ? Math.round((count / total) * 100) : 0}%)</span>
    </div>
);

export default ChartCard;
