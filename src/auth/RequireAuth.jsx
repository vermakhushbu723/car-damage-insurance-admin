import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getSession } from './session';
import { ROUTES } from '../constants/routes';

/** Sends signed-out visitors to the login page. */
const RequireAuth = ({ children }) => {
    const location = useLocation();
    if (!getSession()) return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />;
    return children;
};

export default RequireAuth;
