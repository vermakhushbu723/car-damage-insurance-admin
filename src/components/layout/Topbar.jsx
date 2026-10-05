import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AutoComplete, Input, Badge, Dropdown, Tooltip } from 'antd';
import {
    SearchOutlined, BellOutlined, UserOutlined, MenuOutlined, MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined, HistoryOutlined,
} from '@ant-design/icons';
import { COLORS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { ALL_NAV_ITEMS, cleanLabel, navItemFor } from '../../constants/navigation';
import { getSession, logout } from '../../auth/session';
import { useCollection } from '../../store/AdminStore';
import { formatDateTime } from '../../utils/format';

const circleBtn = { width: 30, height: 30, background: 'rgba(255,255,255,0.75)' };
const SEEN_KEY = 'ibima_admin_seen_changes';

const readSeen = () => {
    try {
        return localStorage.getItem(SEEN_KEY);
    } catch {
        return null;
    }
};

/**
 * Top bar -- sidebar toggle, current page name, "Search Page" (jumps to
 * any sidebar page), notifications (latest configuration changes) and the
 * account menu.
 */
const Topbar = ({ onMenuClick, collapsed, onToggleCollapsed }) => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [query, setQuery] = useState('');
    const { items: changes } = useCollection('changes');
    const [seenId, setSeenId] = useState(readSeen);
    const session = getSession();

    const current = navItemFor(pathname);
    const searchOptions = ALL_NAV_ITEMS
        .filter((i) => !query || cleanLabel(i.label).toLowerCase().includes(query.toLowerCase()))
        .map((i) => ({ value: i.path, label: cleanLabel(i.label) }));

    const latest = changes.slice(0, 6);
    const seenIndex = changes.findIndex((c) => c.id === seenId);
    const unread = seenIndex === -1 ? Math.min(changes.length, 6) : seenIndex;

    const notificationsMenu = {
        items: [
            ...latest.map((c) => ({
                key: c.id,
                icon: <HistoryOutlined style={{ color: COLORS.primary }} />,
                label: (
                    <span className="text-[12px] block" style={{ maxWidth: 300 }}>
                        <b>{c.changedBy}</b> changed {c.module} · {c.change}: {c.oldValue} → {c.newValue}
                        <span className="block text-[11px] text-slate-500">{formatDateTime(c.changedOn)}</span>
                    </span>
                ),
            })),
            ...(latest.length ? [] : [{ key: 'none', label: 'No notifications', disabled: true }]),
        ],
        onClick: () => navigate(ROUTES.DASHBOARD),
    };

    const onNotificationsOpen = (open) => {
        if (open && changes[0]) {
            setSeenId(changes[0].id);
            try {
                localStorage.setItem(SEEN_KEY, changes[0].id);
            } catch {
                /* ignore */
            }
        }
    };

    const accountMenu = {
        items: [
            { key: 'profile', icon: <UserOutlined />, label: session ? `${session.name} (${session.email})` : 'Super Admin', disabled: true },
            { type: 'divider' },
            { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
        ],
        onClick: ({ key }) => {
            if (key === 'logout') {
                logout();
                navigate(ROUTES.LOGIN, { replace: true });
            }
        },
    };

    return (
        <div className="flex items-center gap-3 px-3 md:px-6" style={{ background: COLORS.topbarBg, height: 46, flexShrink: 0 }}>
            <button type="button" onClick={onMenuClick} className="lg:hidden flex items-center justify-center rounded-full" style={circleBtn} aria-label="Open menu">
                <MenuOutlined />
            </button>
            <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                <button type="button" onClick={onToggleCollapsed} className="hidden lg:flex items-center justify-center rounded-full" style={circleBtn} aria-label="Toggle sidebar">
                    {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                </button>
            </Tooltip>
            {current && <span className="hidden md:block text-white text-[15px] font-semibold truncate">{cleanLabel(current.label)}</span>}

            <div className="flex-1" />

            <AutoComplete
                className="hidden sm:block"
                style={{ width: 'min(280px, 32vw)' }}
                options={searchOptions}
                value={query}
                onChange={setQuery}
                onSelect={(path) => {
                    navigate(path);
                    setQuery('');
                }}
            >
                <Input placeholder="Search Page" suffix={<SearchOutlined style={{ color: COLORS.textMuted }} />} style={{ background: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.6)' }} />
            </AutoComplete>

            <Dropdown menu={notificationsMenu} trigger={['click']} placement="bottomRight" onOpenChange={onNotificationsOpen}>
                <Badge count={unread} size="small" offset={[-4, 4]}>
                    <button type="button" className="flex items-center justify-center rounded-full" style={circleBtn} aria-label="Notifications">
                        <BellOutlined style={{ fontSize: 14, color: COLORS.textPrimary }} />
                    </button>
                </Badge>
            </Dropdown>

            <Dropdown menu={accountMenu} trigger={['click']} placement="bottomRight">
                <button type="button" className="flex items-center justify-center rounded-full" style={circleBtn} aria-label="Account">
                    <UserOutlined style={{ fontSize: 14, color: COLORS.textPrimary }} />
                </button>
            </Dropdown>
        </div>
    );
};

export default Topbar;
