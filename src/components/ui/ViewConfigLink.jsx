import React from 'react';
import { ArrowUpOutlined } from '@ant-design/icons';
import { COLORS } from '../../constants/theme';

/** "↑ View/Configuration" footer link on stat cards (Fraud Routing, Allocation, Recommendation). */
const ViewConfigLink = ({ onClick, arrow = true }) => (
    <button type="button" onClick={onClick} className="flex items-center gap-1 text-[11.5px] font-medium text-left" style={{ color: COLORS.primary }}>
        {arrow && <ArrowUpOutlined style={{ color: COLORS.success }} />} View/Configuration
    </button>
);

export default ViewConfigLink;
