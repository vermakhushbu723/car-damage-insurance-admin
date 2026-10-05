import React from 'react';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { COLORS, TONES } from '../../constants/theme';

/**
 * KPI tile: tinted icon square + colored label, big value, optional
 * "↑ 12% VS Last Month" trend line. `onClick` makes the whole tile a
 * filter shortcut (list pages use it to filter the table by that status).
 */
const StatCard = ({ label, value, icon, tone = 'blue', trend, trendLabel = 'VS Last Month', trendDown = false, onClick, active = false }) => {
    const t = TONES[tone] ?? TONES.blue;
    const Tag = onClick ? 'button' : 'div';
    return (
        <Tag
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            className="text-left rounded-lg px-3 py-2.5 flex flex-col gap-1.5 min-w-0 w-full transition-shadow"
            style={{
                background: COLORS.bgCard,
                border: `1px solid ${active ? t.color : COLORS.border}`,
                boxShadow: active ? `0 0 0 1px ${t.color}` : 'none',
                cursor: onClick ? 'pointer' : 'default',
            }}
        >
            <div className="flex items-center gap-2 min-w-0">
                {icon && (
                    <span className="flex items-center justify-center rounded-md shrink-0" style={{ width: 22, height: 22, background: t.bg, color: t.color, fontSize: 12 }}>
                        {icon}
                    </span>
                )}
                <span className="text-[12px] font-semibold truncate" style={{ color: t.color }}>{label}</span>
            </div>
            <span className="text-[18px] font-bold leading-none pl-0.5" style={{ color: COLORS.textPrimary }}>{value}</span>
            {trend && (
                <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: COLORS.textPrimary }}>
                    <span style={{ color: trendDown ? COLORS.danger : COLORS.success }}>
                        {trendDown ? <ArrowDownOutlined /> : <ArrowUpOutlined />} {trend}
                    </span>
                    {trendLabel}
                </span>
            )}
        </Tag>
    );
};

export default StatCard;
