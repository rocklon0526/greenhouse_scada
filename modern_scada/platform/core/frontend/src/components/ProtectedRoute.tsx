import React, { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    console.log("ProtectedRoute checking token:", token ? "Found" : "Missing", "Path:", window.location.pathname);

    useEffect(() => {
        if (!token) {
            navigate('/login', { replace: true });
        }
    }, [token, navigate]);

    if (!token) {
        return null;
    }

    return <Outlet />;
};

export default ProtectedRoute;
