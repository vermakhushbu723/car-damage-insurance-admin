import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import RequireAuth from '../auth/RequireAuth';
import AppLayout from '../components/layout/AppLayout';
import LoginPage from '../pages/auth/LoginPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import ActiveUsersPage from '../pages/dashboard/ActiveUsersPage';
import CreateUserPage from '../pages/users/CreateUserPage';
import RolesPermissionsPage from '../pages/users/RolesPermissionsPage';
import PasswordResetPage from '../pages/users/PasswordResetPage';
import UserActivationPage from '../pages/users/UserActivationPage';
import BranchesPage from '../pages/service/BranchesPage';
import DocumentTemplatesPage from '../pages/service/DocumentTemplatesPage';
import CommunicationSetupPage from '../pages/service/CommunicationSetupPage';
import ClaimFlowPage from '../pages/claims/ClaimFlowPage';
import ApprovalLogicPage from '../pages/claims/ApprovalLogicPage';
import RecommendationEnginePage from '../pages/claims/RecommendationEnginePage';
import AllocationLoadPage from '../pages/claims/AllocationLoadPage';
import FraudRoutingPage from '../pages/fraud/FraudRoutingPage';
import FraudTriggerRulesPage from '../pages/fraud/FraudTriggerRulesPage';
import TriggerHistoryPage from '../pages/fraud/TriggerHistoryPage';
import ClaimReportPage from '../pages/reports/ClaimReportPage';
import UserReportPage from '../pages/reports/UserReportPage';
import SaasUsagePage from '../pages/reports/SaasUsagePage';
import DataDownloadPage from '../pages/reports/DataDownloadPage';
import AuditLogsPage from '../pages/system/AuditLogsPage';
import SystemSettingsPage from '../pages/system/SystemSettingsPage';

// One page per sidebar item (constants/navigation.js).
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
    [ROUTES.CLAIM_FLOW]: ClaimFlowPage,
    [ROUTES.APPROVAL_LOGIC]: ApprovalLogicPage,
    [ROUTES.RECOMMENDATION_ENGINE]: RecommendationEnginePage,
    [ROUTES.ALLOCATION_LOAD]: AllocationLoadPage,
    [ROUTES.FRAUD_ROUTING]: FraudRoutingPage,
    [ROUTES.FRAUD_TRIGGER_RULES]: FraudTriggerRulesPage,
    [ROUTES.TRIGGER_HISTORY]: TriggerHistoryPage,
    [ROUTES.CLAIM_REPORT]: ClaimReportPage,
    [ROUTES.USER_REPORT]: UserReportPage,
    [ROUTES.SAAS_USAGE]: SaasUsagePage,
    [ROUTES.DATA_DOWNLOAD]: DataDownloadPage,
    [ROUTES.AUDIT_LOGS]: AuditLogsPage,
    [ROUTES.SYSTEM_SETTINGS]: SystemSettingsPage,
};

const AppRoutes = () => (
    <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            {Object.entries(PAGES).map(([path, Page]) => <Route key={path} path={path} element={<Page />} />)}
        </Route>
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
);

export default AppRoutes;
