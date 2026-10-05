import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { ALL_NAV_ITEMS } from '../constants/navigation';
import RequireAuth from '../auth/RequireAuth';
import AppLayout from '../components/layout/AppLayout';
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import ActiveUsersPage from '../pages/dashboard/ActiveUsersPage';
import CreateUserPage from '../pages/users/CreateUserPage';
import RolesPermissionsPage from '../pages/users/RolesPermissionsPage';
import PasswordResetPage from '../pages/users/PasswordResetPage';
import UserActivationPage from '../pages/users/UserActivationPage';
import BranchesPage from '../pages/service/BranchesPage';
import DocumentTemplatesPage from '../pages/service/DocumentTemplatesPage';
import CommunicationSetupPage from '../pages/service/CommunicationSetupPage';
import ComingSoonPage from '../pages/ComingSoonPage';

// Screens built from the designs so far; every other sidebar item routes
// to a "coming soon" page until its design arrives.
const PAGES = {
    [ROUTES.DASHBOARD]: DashboardPage,
    [ROUTES.ACTIVE_USERS]: ActiveUsersPage,
    [ROUTES.CREATE_USERS]: CreateUserPage,
    [ROUTES.ROLES]: RolesPermissionsPage,
    [ROUTES.PASSWORD_RESET]: PasswordResetPage,
    [ROUTES.USER_ACTIVATION]: UserActivationPage,
    [ROUTES.BRANCHES]: BranchesPage,
    [ROUTES.DOCUMENT_TEMPLATES]: DocumentTemplatesPage,
    [ROUTES.COMMUNICATION]: CommunicationSetupPage,
};

const AppRoutes = () => (
    <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            {ALL_NAV_ITEMS.map((item) => {
                const Page = PAGES[item.path];
                return <Route key={item.key} path={item.path} element={Page ? <Page /> : <ComingSoonPage item={item} />} />;
            })}
        </Route>
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
);

export default AppRoutes;
