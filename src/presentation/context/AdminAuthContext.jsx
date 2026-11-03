import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { adminUseCases } from '@/infrastructure/container.js';

// Sesión del administrador. Solo envuelve las rutas /admin.

const AdminAuthContext = createContext(null);

export const useAdminAuth = () => {
    const ctx = useContext(AdminAuthContext);
    if (!ctx) throw new Error('useAdminAuth debe usarse dentro de <AdminAuthProvider>');
    return ctx;
};

export const AdminAuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        adminUseCases.getCurrentAdmin()
            .then((user) => active && setAdmin(user))
            .catch(() => active && setAdmin(null))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, []);

    const signIn = useCallback(async (email, password) => {
        const user = await adminUseCases.signIn(email, password);
        setAdmin(user);
        return user;
    }, []);

    const signOut = useCallback(async () => {
        await adminUseCases.signOut();
        setAdmin(null);
    }, []);

    const value = useMemo(() => ({ admin, loading, signIn, signOut }), [admin, loading, signIn, signOut]);

    return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};
