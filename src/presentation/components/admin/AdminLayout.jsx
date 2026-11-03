import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
    HiOutlineSquares2X2, HiOutlineCube, HiOutlineClipboardDocumentList, HiOutlineUsers, HiOutlineArrowTopRightOnSquare,
    HiOutlineArrowRightOnRectangle, HiOutlineBars3, HiOutlineXMark,
} from 'react-icons/hi2';
import Monogram from '@/presentation/components/brand/Monogram.jsx';
import { useAdminAuth } from '@/presentation/context/AdminAuthContext.jsx';
import { isDemoMode } from '@/infrastructure/container.js';

const LINKS = [
    { to: '/admin', label: 'Resumen', icon: HiOutlineSquares2X2, end: true },
    { to: '/admin/productos', label: 'Productos', icon: HiOutlineCube },
    { to: '/admin/pedidos', label: 'Pedidos', icon: HiOutlineClipboardDocumentList },
    { to: '/admin/afiliados', label: 'Partners / Afiliados', icon: HiOutlineUsers },
];

const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 text-sm transition ${isActive ? 'bg-gold/15 text-gold' : 'text-cream/70 hover:bg-cream/5 hover:text-cream-light'}`;

function Sidebar({ onNavigate }) {
    const { admin, signOut } = useAdminAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/admin/login', { replace: true });
    };

    return (
        <div className="flex h-full flex-col bg-ink text-cream-light">
            <Link to="/admin" onClick={onNavigate} className="flex items-center gap-3 border-b border-cream/10 px-6 py-6">
                <Monogram className="h-10 w-auto" variant="light" />
                <span>
                    <span className="block font-display tracking-[0.12em]">AROMA PREMIUM</span>
                    <span className="eyebrow text-[8px] text-gold">Panel de administración</span>
                </span>
            </Link>
            <nav className="flex-1 space-y-1 py-6" aria-label="Administración">
                {LINKS.map(({ to, label, icon: Icon, end }) => (
                    <NavLink key={to} to={to} end={end} onClick={onNavigate} className={linkClass}>
                        <Icon className="h-5 w-5" /> {label}
                    </NavLink>
                ))}
                <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 text-sm text-cream/70 hover:text-cream-light">
                    <HiOutlineArrowTopRightOnSquare className="h-5 w-5" /> Ver tienda
                </a>
            </nav>
            <div className="border-t border-cream/10 p-4">
                <p className="truncate px-2 text-xs text-cream/50">{admin?.email}</p>
                <button onClick={handleSignOut} className="mt-2 flex w-full items-center gap-3 px-2 py-2 text-sm text-cream/70 hover:text-gold">
                    <HiOutlineArrowRightOnRectangle className="h-5 w-5" /> Cerrar sesión
                </button>
            </div>
        </div>
    );
}

export default function AdminLayout() {
    const { pathname } = useLocation();
    // Se cierra solo al navegar (se guarda la ruta en la que se abrió).
    const [menuPath, setMenuPath] = useState(null);
    const menuOpen = menuPath === pathname;

    return (
        <div className="min-h-screen bg-cream-light lg:grid lg:grid-cols-[260px_1fr]">
            <aside className="sticky top-0 hidden h-screen lg:block"><Sidebar /></aside>

            <header className="sticky top-0 z-30 flex items-center justify-between bg-ink px-4 py-3 text-cream-light lg:hidden">
                <button onClick={() => setMenuPath(pathname)} aria-label="Abrir menú"><HiOutlineBars3 className="h-6 w-6" /></button>
                <span className="font-display tracking-[0.12em]">Panel Aroma Premium</span>
                <span className="w-6" />
            </header>
            {menuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-ink/60" onClick={() => setMenuPath(null)} />
                    <div className="absolute inset-y-0 left-0 w-72">
                        <button className="absolute right-3 top-3 z-10 text-cream-light" onClick={() => setMenuPath(null)} aria-label="Cerrar menú">
                            <HiOutlineXMark className="h-6 w-6" />
                        </button>
                        <Sidebar onNavigate={() => setMenuPath(null)} />
                    </div>
                </div>
            )}

            <main className="min-w-0">
                {isDemoMode && (
                    <div className="bg-gold/15 px-6 py-2 text-xs text-gold-dark">
                        Modo demo: los cambios se guardan solo en este navegador. Conecta Supabase para usarlo en producción.
                    </div>
                )}
                <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
