import React from 'react';
import { COLORS } from '../../constants/theme';

/** White bordered card with an optional title row (title left, `extra` right). */
const Panel = ({ title, titleColor = COLORS.headingBlue, extra, children, className = '', bodyClassName = '', style }) => (
    <div className={`rounded-lg min-w-0 ${className}`} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, ...style }}>
        {(title || extra) && (
            <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
                {title && <h3 className="text-[14px] font-semibold m-0" style={{ color: titleColor }}>{title}</h3>}
                {extra}
            </div>
        )}
        <div className={`p-3 ${bodyClassName}`}>{children}</div>
    </div>
);

export default Panel;
