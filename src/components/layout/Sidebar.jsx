import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tooltip, Dropdown, Avatar } from 'antd';
import { DownOutlined, LogoutOutlined, PlusOutlined } from '@ant-design/icons';
import ibimaLogo from '../../assets/images/ibimaLogo.svg';
import { SIDEBAR_GROUPS, isNavItemActive } from '../../constants/navigation';
import { COLORS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { getSession, logout } from '../../auth/session';
import { useClearData } from '../../store/AdminStore';

const NavItem = ({ item, isActive, collapsed, onNavigate }) => {
    const Icon = item.icon;
    const button = (
        <button
            type="button"
            onClick={() => onNavigate(item.path)}
            className="relative flex items-center w-full transition-colors hover:bg-white/10"
            style={{
                gap: collapsed ? 0 : 10,
                padding: collapsed ? '7px 0' : '5px 12px 5px 18px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: '#fff',
                background: isActive ? COLORS.sidebarItemActiveBg : undefined,
                borderRadius: isActive ? '0 6px 6px 0' : 0,
                fontWeight: 500,
                fontSize: 12,
            }}
        >
            {isActive && <span className="absolute left-0 top-0 bottom-0" style={{ width: 4, background: '#fff', borderRadius: '0 3px 3px 0' }} />}
            <Icon style={{ fontSize: 14, flexShrink: 0 }} />
            {!collapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
        </button>
    );
    return collapsed ? <Tooltip title={item.label} placement="right">{button}</Tooltip> : button;
};

/**
 * Left navigation shown on every page -- logo + "+ Add More" (new user),
 * the grouped menu from constants/navigation.js, and the profile card
 * (logout) pinned at the bottom.
 */
const Sidebar = ({ collapsed = false, onNavigateItem }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const clearData = useClearData();
    const session = getSession();

    const go = (path) => {
        navigate(path);
        onNavigateItem?.();
    };

    const profileMenu = {
        items: [
            { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
        ],
        onClick: ({ key }) => {
            if (key === 'logout') {
                logout();
                clearData();
                navigate(ROUTES.LOGIN, { replace: true });
            }
        },
    };

    return (
        <div className="h-full flex flex-col overflow-hidden" style={{ background: COLORS.sidebarBg }}>
            <div className={`flex items-center shrink-0 ${collapsed ? 'flex-col gap-2 py-3' : 'justify-between px-3 pt-2 pb-1'}`}>
                <button type="button" onClick={() => go(ROUTES.DASHBOARD)} aria-label="Dashboard" className="bg-white/95 rounded-md p-0.5">
                    <img src={ibimaLogo} alt="IBima Assist" style={{ height: collapsed ? 26 : 34, display: 'block' }} />
                </button>
                <Tooltip title={collapsed ? 'Add More' : ''} placement="right">
                    <button
                        type="button"
                        onClick={() => go(ROUTES.CREATE_USERS)}
                        className="rounded-md text-white text-[10.5px] font-medium hover:bg-white/10"
                        style={{ border: '1px solid rgba(255,255,255,0.85)', padding: collapsed ? '3px 7px' : '3px 10px' }}
                    >
                        {collapsed ? <PlusOutlined /> : '+ Add More'}
                    </button>
                </Tooltip>
            </div>

            <nav className="flex-1 overflow-y-auto overflow-x-hidden pb-2">
                {SIDEBAR_GROUPS.map((group) => (
                    <div key={group.title} className="mt-1">
                        {!collapsed && <div className="px-3 pt-1 pb-0.5 text-[9.5px] font-semibold tracking-wide text-white/90 whitespace-nowrap">{group.title}</div>}
                        {collapsed && <div className="mx-4 my-1.5 border-t border-white/20" />}
                        <div className="flex flex-col gap-0.5 pr-2">
                            {group.items.map((item) => (
                                <NavItem key={item.key} item={item} isActive={isNavItemActive(item, location.pathname)} collapsed={collapsed} onNavigate={go} />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="shrink-0 p-2">
                <Dropdown menu={profileMenu} trigger={['click']} placement="topLeft">
                    <button
                        type="button"
                        className="w-full flex items-center gap-2 rounded-md text-left text-white"
                        style={{ border: '1px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.12)', padding: collapsed ? 4 : '4px 8px', justifyContent: collapsed ? 'center' : 'flex-start' }}
                    >
                        <Avatar size={26} style={{ background: '#fff', color: COLORS.primary, fontWeight: 700, fontSize: 11, flexShrink: 0 }}>AD</Avatar>
                        {!collapsed && (
                            <>
                                <span className="flex-1 min-w-0">
                                    <span className="block text-[12px] font-medium leading-tight truncate">{session?.name ?? 'Admin'}</span>
                                    <span className="block text-[9.5px] truncate opacity-90">{session?.email ?? ''}</span>
                                </span>
                                <DownOutlined style={{ fontSize: 11 }} />
                            </>
                        )}
                    </button>
                </Dropdown>
            </div>
        </div>
    );
};

export default Sidebar;
