import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Drawer } from 'antd';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const SIDEBAR_WIDTH = 216;
const SIDEBAR_WIDTH_COLLAPSED = 60;
const COLLAPSE_STORAGE_KEY = 'ibima_admin_sidebar_collapsed';

const readStoredCollapsed = () => {
    try {
        return localStorage.getItem(COLLAPSE_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
};

/**
 * Shell for every signed-in page: sidebar (collapsible icon rail on
 * desktop, Drawer below `lg`) + topbar + scrollable content via <Outlet />.
 */
const AppLayout = () => {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(readStoredCollapsed);
    const scrollRef = useRef(null);
    const { pathname } = useLocation();

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
    }, [pathname]);

    const toggleCollapsed = () => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
            } catch {
                /* ignore */
            }
            return next;
        });
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-white">
            <div className="hidden lg:block shrink-0" style={{ width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH, transition: 'width 0.2s ease' }}>
                <Sidebar collapsed={collapsed} />
            </div>

            <Drawer
                placement="left"
                open={mobileNavOpen}
                onClose={() => setMobileNavOpen(false)}
                closable={false}
                size={SIDEBAR_WIDTH}
                styles={{ body: { padding: 0 } }}
            >
                <Sidebar onNavigateItem={() => setMobileNavOpen(false)} />
            </Drawer>

            <div className="flex-1 flex flex-col min-w-0">
                <Topbar onMenuClick={() => setMobileNavOpen(true)} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
                <main ref={scrollRef} className="flex-1 overflow-y-auto" style={{ background: '#FAFBFD' }}>
                    <div className="p-3 md:p-4 max-w-[1500px]">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
