import React from 'react';
import { Avatar } from 'antd';
import { initials } from '../../utils/format';

const AVATAR_COLORS = ['#B45309', '#0B4CD0', '#7C3AED', '#0E8AA8', '#BE185D', '#15803D'];
const colorFor = (name = '') => AVATAR_COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

/** Avatar (initials) + name, used in every people table. */
const UserCell = ({ name, sub }) => (
    <div className="flex items-center gap-2 min-w-0">
        <Avatar size={24} style={{ background: colorFor(name), fontSize: 10, flexShrink: 0 }}>{initials(name)}</Avatar>
        <div className="min-w-0">
            <div className="truncate font-medium">{name}</div>
            {sub && <div className="truncate text-[10.5px] text-slate-500">{sub}</div>}
        </div>
    </div>
);

export default UserCell;
