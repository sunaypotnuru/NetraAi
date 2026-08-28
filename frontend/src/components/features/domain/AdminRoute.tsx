import React from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '@/app/contexts/AuthContext';

import { ECGLoadingScreen } from '@/components/shared/ECGLoadingScreen';

const AdminRoute = ({ children }: { children: ReactNode }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <ECGLoadingScreen />;
    }

    if (!user || user.role !== 'admin') {
        return <Navigate to="/login/admin" replace />;
    }

    return <>{children}</>;
};

export default AdminRoute;
