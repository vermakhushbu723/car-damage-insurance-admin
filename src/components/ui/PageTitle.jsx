import React from 'react';
import { COLORS } from '../../constants/theme';

/** Page heading row -- blue title (+ optional subtitle) on the left, actions on the right. */
const PageTitle = ({ title, subtitle, extra, className = 'mb-3' }) => (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
        <div className="min-w-0">
            <h1 className="text-[20px] font-bold m-0 leading-tight" style={{ color: COLORS.headingBlue }}>{title}</h1>
            {subtitle && <p className="text-[12px] font-medium mt-0.5 mb-0" style={{ color: COLORS.textPrimary }}>{subtitle}</p>}
        </div>
        {extra && <div className="flex flex-wrap items-center gap-2">{extra}</div>}
    </div>
);

export default PageTitle;
