import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import { useAuth } from '@/presentation/context/AuthContext.jsx';
import { alertError, toastSuccess } from '@/presentation/utils/swal.js';
import Logo from '@/presentation/components/brand/Logo.jsx';

export default function ResetPassword() {
    const { updatePassword, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [success, setSuccess] = useState(false);
    const [hasTokenOrSession, setHasTokenOrSession] = useState(true);

    useEffect(() => {
        // Verifica si hay token de recuperación en la URL o si ya hay sesión activa
        if (typeof window !== 'undefined') {
            const hash = window.location.hash || '';
            const search = window.location.search || '';
            const isRecovery =
                hash.includes('type=recovery') ||
                hash.includes('access_token') ||
                search.includes('code=') ||
                isAuthenticated;

            // Damos un breve margen para que el SDK de Supabase procese el hash de la URL
            const timer = setTimeout(() => {
                if (!isRecovery && !isAuthenticated && !authLoading) {
                    setHasTokenOrSession(false);
                } else {
                    setHasTokenOrSession(true);
                }
            }, 1200);

            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, authLoading]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!password || password.length < 6) {
            setErrorMsg('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        try {
            await updatePassword(password);
            setSuccess(true);
            toastSuccess('¡Contraseña actualizada con éxito!');
        } catch (err) {
            const msg = err.message || 'No se pudo actualizar la contraseña';
            setErrorMsg(msg);
            alertError('Error al actualizar contraseña', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-luxe flex min-h-[75vh] items-center justify-center py-16">
            <div className="w-full max-w-md border border-taupe/20 bg-white/80 p-8 shadow-luxe backdrop-blur sm:p-10">
                <div className="text-center">
                    <Logo compact className="inline-block" />
                    <p className="eyebrow mt-4 text-taupe">Seguridad y acceso</p>
                    <h1 className="mt-2 text-3xl font-normal text-ink sm:text-4xl">Nueva contraseña</h1>
                </div>

                {success ? (
                    <div className="mt-8 space-y-6 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold">
                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <div className="space-y-2">
                            <h2 className="font-display text-lg text-ink">¡Contraseña actualizada!</h2>
                            <p className="text-xs leading-relaxed text-taupe">
                                Tu nueva contraseña ha sido guardada con éxito. Ya puedes iniciar sesión o acceder a tu perfil.
                            </p>
                        </div>

                        <div className="pt-4 space-y-3">
                            <button
                                type="button"
                                onClick={() => navigate('/cuenta', { replace: true })}
                                className="btn-dark w-full py-4 text-xs uppercase tracking-wider"
                            >
                                Ir a mi cuenta
                            </button>
                            <Link
                                to="/tienda"
                                className="block text-center text-xs text-taupe underline hover:text-ink transition"
                            >
                                Ir al catálogo de fragancias
                            </Link>
                        </div>
                    </div>
                ) : !hasTokenOrSession && !authLoading ? (
                    <div className="mt-8 space-y-6 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <div className="space-y-2">
                            <h2 className="font-display text-lg text-ink">Enlace no válido o expirado</h2>
                            <p className="text-xs leading-relaxed text-taupe">
                                Por seguridad, los enlaces para restablecer contraseña expiran después de cierto tiempo o solo pueden usarse una vez.
                            </p>
                        </div>

                        <div className="pt-4">
                            <Link
                                to="/recuperar-contrasena"
                                className="btn-dark block w-full py-3.5 text-center text-xs"
                            >
                                Solicitar un nuevo enlace
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="mt-4 text-center text-xs leading-relaxed text-taupe">
                            Elige una contraseña segura de al menos 6 caracteres para proteger tu cuenta.
                        </p>

                        {errorMsg && (
                            <div className="mt-6 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                            <div>
                                <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.15em] text-ink/70">
                                    Nueva contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Al menos 6 caracteres"
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

                            <div>
                                <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.15em] text-ink/70">
                                    Confirmar nueva contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repite la contraseña"
                                        className="input pr-11"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-taupe transition hover:text-ink focus:outline-none"
                                        aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                        title={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                    >
                                        {showConfirmPassword ? (
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
                                className="btn-dark w-full py-4 text-xs uppercase tracking-wider"
                            >
                                {loading ? 'Actualizando contraseña…' : 'Guardar nueva contraseña'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
