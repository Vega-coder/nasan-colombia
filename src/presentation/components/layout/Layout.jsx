import { useEffect, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import CartDrawer from '@/presentation/components/cart/CartDrawer.jsx';
import Chatbot from '@/presentation/components/chat/Chatbot.jsx';
import { useReferralTracking } from '@/presentation/hooks/useReferralTracking.js';

const PageSpinner = () => (
    <div className="container-luxe flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-gold border-t-transparent shadow-sm" />
        <p className="mt-4 font-display text-xs font-semibold uppercase tracking-[0.25em] text-taupe">
            Cargando…
        </p>
    </div>
);

export default function Layout() {
    const { pathname } = useLocation();
    useReferralTracking();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [pathname]);

    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
                <Suspense fallback={<PageSpinner />}>
                    <Outlet />
                </Suspense>
            </main>
            <Footer />
            <CartDrawer />
            <Chatbot />
        </div>
    );
}
