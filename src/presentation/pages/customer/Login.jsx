import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import { useAuth } from '@/presentation/context/AuthContext.jsx';
import { alertError, toastSuccess } from '@/presentation/utils/swal.js';
import Logo from '@/presentation/components/brand/Logo.jsx';

export default function Login() {
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectUrl = searchParams.get('redirect') || '/cuenta';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        if (!email.trim() || !password) {
            setErrorMsg('Ingresa tu correo y contraseña');
            return;
        }

        setLoading(true);
        try {
            await signIn(email, password);
            toastSuccess('¡Bienvenido de nuevo!');
            navigate(redirectUrl, { replace: true });
        } catch (err) {
            const msg = err.message || 'No se pudo iniciar sesión';
            setErrorMsg(msg);
            alertError('Error al iniciar sesión', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-luxe flex min-h-[75vh] items-center justify-center py-16">
            <div className="w-full max-w-md border border-taupe/20 bg-white/80 p-8 shadow-luxe backdrop-blur sm:p-10">
                <div className="text-center">
                    <Logo compact className="inline-block" />
                    <p className="eyebrow mt-4 text-taupe">Bienvenido a Aroma Premium</p>
                    <h1 className="mt-2 text-3xl font-normal text-ink sm:text-4xl">Iniciar sesión</h1>
                    {redirectUrl.includes('checkout') && (
                        <p className="mt-3 rounded bg-gold/15 p-2.5 text-xs text-ink">
                            Inicia sesión para usar tus datos guardados, o{' '}
                            <Link to="/checkout" className="font-semibold underline">continúa como invitado</Link>.
                        </p>
                    )}
                </div>

                {errorMsg && (
                    <div className="mt-6 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    <div>
                        <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.15em] text-ink/70">
                            Correo electrónico
                        </label>
                        <input
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@correo.com"
                            className="input"
                        />
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <label className="block text-[11px] font-medium uppercase tracking-[0.15em] text-ink/70">
                                Contraseña
                            </label>
                            <Link
                                to={`/recuperar-contrasena${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''}`}
                                className="text-xs text-taupe transition hover:text-ink hover:underline"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="input pr-11"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-taupe transition hover:text-ink focus:outline-none"
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                            >
                                {showPassword ? (
                                    <HiOutlineEyeSlash className="h-5 w-5" />
                                ) : (
                                    <HiOutlineEye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-dark w-full py-4 text-xs"
                    >
                        {loading ? 'Iniciando sesión…' : 'Ingresar'}
                    </button>
                </form>

                <div className="mt-8 space-y-4 border-t border-taupe/15 pt-6 text-center text-xs text-taupe">
                    <p>
                        ¿No tienes una cuenta aún?{' '}
                        <Link
                            to={`/registro${redirectUrl !== '/cuenta' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
                            className="font-medium text-ink underline transition hover:text-gold"
                        >
                            Crear cuenta gratis
                        </Link>
                    </p>

                    <p>
                        <Link to="/tienda" className="text-ink/60 underline hover:text-ink">
                            Volver a la tienda
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
