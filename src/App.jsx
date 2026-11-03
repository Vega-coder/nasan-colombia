import { lazy, Suspense, Component } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from '@/presentation/context/AuthContext.jsx';
import { CartProvider } from '@/presentation/context/CartContext.jsx';
import { WishlistProvider } from '@/presentation/context/WishlistContext.jsx';
import { AdminAuthProvider } from '@/presentation/context/AdminAuthContext.jsx';
import Layout from '@/presentation/components/layout/Layout.jsx';
import Home from '@/presentation/pages/Home.jsx';
import Brands from '@/presentation/pages/Brands.jsx';
import BrandDetail from '@/presentation/pages/BrandDetail.jsx';
import Catalog from '@/presentation/pages/Catalog.jsx';

// Páginas secundarias descargadas bajo demanda con reintento automático
const ProductDetail = lazy(() => import('@/presentation/pages/ProductDetail.jsx'));
const Wishlist = lazy(() => import('@/presentation/pages/Wishlist.jsx'));
const Cart = lazy(() => import('@/presentation/pages/Cart.jsx'));
const Checkout = lazy(() => import('@/presentation/pages/Checkout.jsx'));
const OrderConfirmation = lazy(() => import('@/presentation/pages/OrderConfirmation.jsx'));
const NotFound = lazy(() => import('@/presentation/pages/NotFound.jsx'));

// Páginas de clientes: login, registro y cuenta/pedidos
const CustomerLogin = lazy(() => import('@/presentation/pages/customer/Login.jsx'));
const CustomerRegister = lazy(() => import('@/presentation/pages/customer/Register.jsx'));
const CustomerAccount = lazy(() => import('@/presentation/pages/customer/Account.jsx'));
const CustomerForgotPassword = lazy(() => import('@/presentation/pages/customer/ForgotPassword.jsx'));
const CustomerResetPassword = lazy(() => import('@/presentation/pages/customer/ResetPassword.jsx'));
const TermsConditions = lazy(() => import('@/presentation/pages/TermsConditions.jsx'));
const AffiliateLanding = lazy(() => import('@/presentation/pages/affiliates/AffiliateLanding.jsx'));
const AffiliateDashboard = lazy(() => import('@/presentation/pages/affiliates/AffiliateDashboard.jsx'));

// Panel de administración: bundle separado, la tienda nunca lo descarga
const RequireAdmin = lazy(() => import('@/presentation/components/admin/RequireAdmin.jsx'));
const AdminLayout = lazy(() => import('@/presentation/components/admin/AdminLayout.jsx'));
const AdminLogin = lazy(() => import('@/presentation/pages/admin/AdminLogin.jsx'));
const AdminDashboard = lazy(() => import('@/presentation/pages/admin/AdminDashboard.jsx'));
const AdminProducts = lazy(() => import('@/presentation/pages/admin/AdminProducts.jsx'));
const AdminProductEdit = lazy(() => import('@/presentation/pages/admin/AdminProductEdit.jsx'));
const AdminOrders = lazy(() => import('@/presentation/pages/admin/AdminOrders.jsx'));
const AdminAffiliates = lazy(() => import('@/presentation/pages/admin/AdminAffiliates.jsx'));

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error('[Aroma Premium ErrorBoundary]:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
                    <h2 className="font-display text-2xl text-ink">Algo no salió como esperábamos</h2>
                    <p className="mt-2 text-sm text-taupe">Hemos detectado una actualización o error temporal de conexión.</p>
                    <button
                        type="button"
                        onClick={() => {
                            this.setState({ hasError: false });
                            window.location.reload();
                        }}
                        className="btn-dark mt-6 text-xs uppercase tracking-wider"
                    >
                        Recargar página
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

const AdminRoot = () => (
    <AdminAuthProvider>
        <Outlet />
    </AdminAuthProvider>
);

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <WishlistProvider>
                    <CartProvider>
                        <ErrorBoundary>
                            <Routes>
                                <Route element={<Layout />}>
                                    <Route index element={<Home />} />
                                    <Route path="tienda" element={<Catalog />} />
                                    <Route path="tienda/:category" element={<Catalog />} />
                                    <Route path="marcas" element={<Brands />} />
                                    <Route path="marcas/:brandSlug" element={<BrandDetail />} />
                                    <Route path="marca/:brandSlug" element={<BrandDetail />} />
                                    <Route path="producto/:slug" element={<ProductDetail />} />
                                    <Route path="favoritos" element={<Wishlist />} />
                                    <Route path="carrito" element={<Cart />} />
                                    <Route path="checkout" element={<Checkout />} />
                                    <Route path="pedido/:code" element={<OrderConfirmation />} />
                                    <Route path="login" element={<CustomerLogin />} />
                                    <Route path="registro" element={<CustomerRegister />} />
                                    <Route path="cuenta" element={<CustomerAccount />} />
                                    <Route path="recuperar-contrasena" element={<CustomerForgotPassword />} />
                                    <Route path="restablecer-contrasena" element={<CustomerResetPassword />} />
                                    <Route path="terminos" element={<TermsConditions />} />
                                    <Route path="terminos-y-condiciones" element={<TermsConditions />} />
                                    <Route path="politicas" element={<TermsConditions />} />
                                    <Route path="partners" element={<AffiliateLanding />} />
                                    <Route path="partners/portal" element={<AffiliateDashboard />} />
                                    <Route path="trabaja-con-nosotros" element={<AffiliateLanding />} />
                                    <Route path="*" element={<NotFound />} />
                                </Route>

                                <Route path="admin" element={<AdminRoot />}>
                                    <Route path="login" element={<AdminLogin />} />
                                    <Route element={<RequireAdmin><Suspense fallback={<div className="min-h-screen" />}><AdminLayout /></Suspense></RequireAdmin>}>
                                        <Route index element={<AdminDashboard />} />
                                        <Route path="productos" element={<AdminProducts />} />
                                        <Route path="productos/nuevo" element={<AdminProductEdit />} />
                                        <Route path="productos/:id" element={<AdminProductEdit />} />
                                        <Route path="pedidos" element={<AdminOrders />} />
                                        <Route path="afiliados" element={<AdminAffiliates />} />
                                    </Route>
                                </Route>
                            </Routes>
                        </ErrorBoundary>
                    </CartProvider>
                </WishlistProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
