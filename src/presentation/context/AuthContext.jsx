import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useCases } from '@/infrastructure/container.js';

const AuthContext = createContext(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
    return ctx;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        useCases.getCurrentUser()
            .then((current) => {
                if (active) setUser(current);
            })
            .catch(() => {
                if (active) setUser(null);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        const unsubscribe = useCases.onAuthStateChange?.((updatedUser) => {
            if (active) {
                setUser(updatedUser);
                setLoading(false);
            }
        });

        return () => {
            active = false;
            unsubscribe?.();
        };
    }, []);

    const signIn = useCallback(async (email, password) => {
        const loggedUser = await useCases.signInCustomer(email, password);
        setUser(loggedUser);
        return loggedUser;
    }, []);

    const signUp = useCallback(async (data) => {
        const newUser = await useCases.signUpCustomer(data);
        setUser(newUser);
        return newUser;
    }, []);

    const signOut = useCallback(async () => {
        await useCases.signOutCustomer();
        setUser(null);
    }, []);

    const resetPassword = useCallback(async (email) => {
        return useCases.resetPassword(email);
    }, []);

    const updatePassword = useCallback(async (newPassword) => {
        const updatedUser = await useCases.updatePassword(newPassword);
        if (updatedUser) setUser(updatedUser);
        return updatedUser;
    }, []);

    const value = useMemo(() => ({
        user,
        loading,
        isAuthenticated: Boolean(user),
        isAdmin: Boolean(user?.isAdmin),
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
    }), [user, loading, signIn, signUp, signOut, resetPassword, updatePassword]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
