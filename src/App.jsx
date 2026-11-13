import React, { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { cleanLabel, navItemFor } from './constants/navigation';
import { ROUTES } from './constants/routes';
import { BASENAME } from './portal';

const APP_NAME = 'IBima Assist Admin';

/** Keeps the browser tab title in sync with the current page, e.g. "User Activation | IBima Assist Admin". */
const DocumentTitle = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        const item = navItemFor(pathname);
        const name = pathname === ROUTES.LOGIN ? 'Login' : pathname === ROUTES.RESET_PASSWORD ? 'Reset Password' : item && cleanLabel(item.label);
        document.title = name ? `${name} | ${APP_NAME}` : APP_NAME;
    }, [pathname]);
    return null;
};

const App = () => (
    <BrowserRouter basename={BASENAME}>
        <DocumentTitle />
        <AppRoutes />
    </BrowserRouter>
);

export default App;
