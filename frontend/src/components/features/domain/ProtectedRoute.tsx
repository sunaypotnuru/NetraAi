import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router';
import { useAuth } from '@/app/contexts/AuthContext';

import { ECGLoadingScreen } from '@/components/shared/ECGLoadingScreen';

interface ProtectedRouteProps {
    children?: React.ReactNode;
    allowedRoles?: ('patient' | 'doctor' | 'admin')[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <ECGLoadingScreen />;
    }

    if (!user) {
        // Redirect to login but save the current location to redirect back after login
        // Determine which login page based on the path
        let loginPath = '/login';
        if (location.pathname.startsWith('/patient')) loginPath = '/login/patient';
        if (location.pathname.startsWith('/doctor')) loginPath = '/login/doctor';
        if (location.pathname.startsWith('/admin')) loginPath = '/login/admin';

        return <Navigate to={loginPath} state={{ from: location }} replace />;
    }

    if (allowedRoles && user.role && !allowedRoles.includes(user.role as "patient" | "doctor" | "admin")) {
        // If user is logged in but doesn't have the right role, redirect to their own dashboard
        const dashboardMap = {
            patient: '/patient/dashboard',
            doctor: '/doctor/dashboard',
            admin: '/admin/dashboard',
        };
        return <Navigate to={dashboardMap[user.role as keyof typeof dashboardMap] || '/'} replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
