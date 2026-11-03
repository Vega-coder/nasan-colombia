import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/presentation/context/AdminAuthContext.jsx';

export default function RequireAdmin({ children }) {
    const { admin, loading } = useAdminAuth();
    const location = useLocation();

    if (loading) return <div className="flex min-h-screen items-center justify-center bg-ink text-cream/60">Cargando…</div>;
    if (!admin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
    return children;
}
