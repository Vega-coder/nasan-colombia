import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    HiOutlineMagnifyingGlass,
    HiOutlineShoppingBag,
    HiOutlineBars3,
    HiOutlineXMark,
    HiOutlineUser,
    HiOutlineHeart,
} from 'react-icons/hi2';
import Logo from '@/presentation/components/brand/Logo.jsx';
import { useCart } from '@/presentation/context/CartContext.jsx';
import { useAuth } from '@/presentation/context/AuthContext.jsx';
import { useWishlist } from '@/presentation/context/WishlistContext.jsx';
import { formatMoney } from '@/domain/shared/money.js';

const NAV_LINKS = [
    { to: '/', label: 'Inicio', end: true },
    { to: '/tienda', label: 'Catálogo' },
    { to: '/tienda/maquinaria', label: 'Maquinaria' },
    { to: '/tienda/herramientas', label: 'Herramientas' },
    { to: '/tienda/insumos', label: 'Insumos' },
    { to: '/tienda/baterias', label: 'Baterías' },
    { to: '/tienda/novedades', label: 'Novedades' },
    { to: '/tienda/ofertas', label: 'Ofertas' },
];

const linkClass = ({ isActive }) =>
    `relative py-1 text-[11px] font-medium uppercase tracking-[0.18em] transition hover:text-gold-dark ${
        isActive ? 'text-ink after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:bg-gold' : 'text-ink/70'
    }`;

function SearchForm({ onDone, className = '' }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');

    const submit = (e) => {
        e.preventDefault();
        const q = query.trim();
        navigate(q ? `/tienda?q=${encodeURIComponent(q)}` : '/tienda');
        onDone?.();
    };

    return (
        <form onSubmit={submit} className={`relative ${className}`} role="search">
            <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar maquinaria, planchas 360, insumos…"
                className="input py-2.5 pr-10 text-xs w-full"
                aria-label="Buscar productos"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-taupe hover:text-ink" aria-label="Buscar">
                <HiOutlineMagnifyingGlass className="h-4 w-4" />
            </button>
        </form>
    );
}

export default function Navbar() {
    const { count, totals, open } = useCart();
    const { user, isAuthenticated } = useAuth();
    const { count: wishlistCount } = useWishlist();
    const { pathname } = useLocation();
    // Guardamos la ruta en la que se abrió cada panel: al navegar se cierran solos.
    const [menuPath, setMenuPath] = useState(null);
    const [searchPath, setSearchPath] = useState(null);
    const menuOpen = menuPath === pathname;
    const searchOpen = searchPath === pathname;
    const closeMenu = useCallback(() => setMenuPath(null), []);
    const setMenuOpen = useCallback((open) => setMenuPath(open ? pathname : null), [pathname]);
    const setSearchOpen = (open) => setSearchPath(open ? pathname : null);

    useEffect(() => {
        if (!menuOpen) return undefined;
        const onKey = (e) => e.key === 'Escape' && closeMenu();
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [menuOpen, closeMenu]);

    const mobileDrawer = menuOpen && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label="Menú principal">
                {/* Backdrop oscuro sólido con blur */}
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                    onClick={closeMenu}
                />

                {/* Panel lateral con fondo oscuro 100% opaco */}
                <aside className="fixed inset-y-0 left-0 z-10 flex w-80 max-w-[85%] flex-col border-r border-taupe/20 bg-[#0B0B0B] p-6 text-cream-light shadow-2xl">
                    <div className="flex items-center justify-between border-b border-taupe/15 pb-5">
                        <Logo tone="light" compact />
                        <button
                            onClick={closeMenu}
                            aria-label="Cerrar menú"
                            className="p-1 text-cream-light transition hover:text-gold"
                        >
                            <HiOutlineXMark className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Acceso a cuenta / login en móvil */}
                    <div className="mt-6 border-b border-taupe/15 pb-5">
                        {isAuthenticated ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] text-taupe">Sesión iniciada</p>
                                    <p className="font-display text-sm font-semibold text-cream-light">
                                        {user.fullName || user.email.split('@')[0]}
                                    </p>
                                </div>
                                <Link
                                    to="/cuenta"
                                    onClick={closeMenu}
                                    className="rounded border border-gold/40 px-3 py-1.5 text-xs text-gold transition hover:bg-gold hover:text-ink"
                                >
                                    Mi cuenta
                                </Link>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Link
                                    to="/login"
                                    onClick={closeMenu}
                                    className="btn-outline-light flex-1 py-2 text-center text-[10px]"
                                >
                                    Iniciar sesión
                                </Link>
                                <Link
                                    to="/registro"
                                    onClick={closeMenu}
                                    className="btn-gold flex-1 py-2 text-center text-[10px]"
                                >
                                    Registrarse
                                </Link>
                            </div>
                        )}

                        {/* Enlace a favoritos en móvil */}
                        <Link
                            to="/favoritos"
                            onClick={closeMenu}
                            className="mt-4 flex items-center justify-between rounded-lg border border-taupe/20 bg-cream-light/5 px-3.5 py-2.5 text-xs text-cream-light transition hover:border-gold hover:text-gold"
                        >
                            <span className="flex items-center gap-2">
                                <HiOutlineHeart className="h-4 w-4 text-gold" />
                                <span>Lista de Deseos</span>
                            </span>
                            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold text-gold">
                                {wishlistCount}
                            </span>
                        </Link>
                    </div>

                    <ul className="mt-6 space-y-4">
                        {NAV_LINKS.map((l) => (
                            <li key={l.to}>
                                <NavLink
                                    to={l.to}
                                    end={l.end}
                                    onClick={closeMenu}
                                    className={({ isActive }) =>
                                        `block font-display text-2xl transition ${
                                            isActive ? 'text-gold' : 'text-cream-light/90 hover:text-gold'
                                        }`
                                    }
                                >
                                    {l.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-auto border-t border-taupe/15 pt-6">
                        <p className="eyebrow text-gold">Esencias que te definen</p>
                        <p className="mt-2 text-xs text-taupe-light">Perfumería árabe 100% original</p>
                    </div>
                </aside>
            </div>,
            document.body
        )
        : null;

    return (
        <>
            <header className="sticky top-0 z-40 border-b border-taupe/15 bg-cream-light/95 backdrop-blur">
                <div className="container-luxe flex h-20 items-center justify-between gap-3 sm:gap-6">
                    <button className="p-1 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
                        <HiOutlineBars3 className="h-6 w-6" />
                    </button>

                    <Logo compact />

                    <SearchForm className="hidden w-full max-w-sm lg:block" />

                    <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                        <button className="p-1 lg:hidden" onClick={() => setSearchOpen(!searchOpen)} aria-label="Buscar">
                            <HiOutlineMagnifyingGlass className="h-5 w-5" />
                        </button>

                        <Link
                            to={isAuthenticated ? '/cuenta' : '/login'}
                            className="flex items-center gap-2 p-1 text-ink transition hover:text-gold-dark"
                            aria-label={isAuthenticated ? 'Mi cuenta' : 'Iniciar sesión'}
                        >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-taupe/25 bg-cream/30 text-ink transition hover:border-gold">
                                <HiOutlineUser className="h-4 w-4" />
                            </span>
                            <span className="hidden flex-col items-start leading-tight xl:flex">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">
                                    {isAuthenticated ? (user.fullName ? user.fullName.split(' ')[0] : 'Mi Cuenta') : 'Acceder'}
                                </span>
                                <span className="text-[10px] text-taupe">
                                    {isAuthenticated ? 'Mis pedidos' : 'Entrar'}
                                </span>
                            </span>
                        </Link>

                        {/* Favoritos / Wishlist */}
                        <Link
                            to="/favoritos"
                            className="flex items-center gap-2 p-1 text-ink transition hover:text-gold-dark"
                            aria-label={`Lista de deseos (${wishlistCount})`}
                        >
                            <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-taupe/25 bg-cream/30 text-ink transition hover:border-gold">
                                <HiOutlineHeart className="h-4 w-4" />
                                {wishlistCount > 0 && (
                                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-ink">
                                        {wishlistCount}
                                    </span>
                                )}
                            </span>
                            <span className="hidden flex-col items-start leading-tight xl:flex">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">Deseos</span>
                                <span className="text-[10px] text-taupe">{wishlistCount} guardados</span>
                            </span>
                        </Link>

                        <button onClick={open} className="flex items-center gap-3 p-1" aria-label={`Abrir carrito (${count} productos)`}>
                            <span className="relative">
                                <HiOutlineShoppingBag className="h-6 w-6" />
                                {count > 0 && (
                                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-ink">
                                        {count}
                                    </span>
                                )}
                            </span>
                            <span className="hidden flex-col items-start leading-tight sm:flex">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">Carrito</span>
                                <span className="text-[11px] text-taupe">{formatMoney(totals.total)}</span>
                            </span>
                        </button>
                    </div>
                </div>

                {searchOpen && (
                    <div className="container-luxe pb-4 lg:hidden">
                        <SearchForm onDone={() => setSearchOpen(false)} />
                    </div>
                )}

                <nav className="hidden border-t border-taupe/10 lg:block" aria-label="Principal">
                    <ul className="container-luxe flex h-12 items-center justify-center gap-10">
                        {NAV_LINKS.map((l) => (
                            <li key={l.to}>
                                <NavLink to={l.to} end={l.end} className={linkClass}>{l.label}</NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
            </header>
            {mobileDrawer}
        </>
    );
}
