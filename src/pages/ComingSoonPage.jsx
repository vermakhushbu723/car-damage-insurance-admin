import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import PageTitle from '../components/ui/PageTitle';
import { COLORS } from '../constants/theme';
import { ROUTES } from '../constants/routes';
import { cleanLabel } from '../constants/navigation';

/** Placeholder for sidebar pages whose design hasn't been shared yet. */
const ComingSoonPage = ({ item }) => {
    const navigate = useNavigate();
    const Icon = item.icon;
    return (
        <>
            <PageTitle title={cleanLabel(item.label)} />
            <div className="rounded-lg flex flex-col items-center justify-center text-center py-10 px-4" style={{ background: '#fff', border: `1px dashed ${COLORS.primarySoft}` }}>
                <span className="flex items-center justify-center rounded-full mb-4" style={{ width: 48, height: 48, background: COLORS.bgSoftBlue, color: COLORS.primary, fontSize: 20 }}>
                    <Icon />
                </span>
                <h2 className="text-[15px] font-semibold m-0" style={{ color: COLORS.textPrimary }}>This screen is coming soon</h2>
                <p className="text-[12px] mt-1 mb-4 max-w-md" style={{ color: COLORS.textSecondary }}>
                    {cleanLabel(item.label)} will be added in the next set of screens.
                </p>
                <Button type="primary" onClick={() => navigate(ROUTES.DASHBOARD)}>Back to Dashboard</Button>
            </div>
        </>
    );
};

export default ComingSoonPage;
