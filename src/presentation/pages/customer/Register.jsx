import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import { useAuth } from '@/presentation/context/AuthContext.jsx';
import { alertError, toastSuccess } from '@/presentation/utils/swal.js';
import Logo from '@/presentation/components/brand/Logo.jsx';

export default function Register() {
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectUrl = searchParams.get('redirect') || '/cuenta';

    const [form, setForm] = useState({
        fullName: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errorMsg) setErrorMsg('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!form.fullName.trim()) {
            setErrorMsg('Por favor ingresa tu nombre completo');
            return;
        }
        if (!form.email.trim() || !form.email.includes('@')) {
            setErrorMsg('Ingresa un correo electrónico válido');
            return;
        }
        if (form.password.length < 6) {
            setErrorMsg('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        if (form.password !== form.confirmPassword) {
            setErrorMsg('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        try {
            await signUp({
                fullName: form.fullName.trim(),
                phone: form.phone.trim(),
                email: form.email.trim(),
                password: form.password,
            });
            toastSuccess('¡Cuenta creada con éxito! Bienvenido.');
            navigate(redirectUrl, { replace: true });
        } catch (err) {
            const msg = err.message || 'No pudimos crear tu cuenta';
            setErrorMsg(msg);
            alertError('Error al registrarse', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-luxe flex min-h-[80vh] items-center justify-center py-16">
            <div className="w-full max-w-md border border-taupe/20 bg-white/80 p-8 shadow-luxe backdrop-blur sm:p-10">
                <div className="text-center">
                    <Logo compact className="inline-block" />
                    <p className="eyebrow mt-4 text-taupe">Crea tu cuenta</p>
                    <h1 className="mt-2 text-3xl font-normal text-ink sm:text-4xl">Registrarse</h1>
                    <p className="mt-2 text-xs text-taupe">
                        Guarda tus direcciones y rastrea tus pedidos en cualquier momento.
                    </p>
                </div>

                {errorMsg && (
                    <div className="mt-6 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                    <div>
                        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.15em] text-ink/70">
                            Nombre completo *
                        </label>
                        <input
                            name="fullName"
                            type="text"
                            required
                            autoComplete="name"
                            value={form.fullName}
                            onChange={handleChange}
                            placeholder="Ej. Juan Pérez"
                            className="input"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.15em] text-ink/70">
                            Celular / WhatsApp (opcional)
                        </label>
                        <input
                            name="phone"
                            type="tel"
                            autoComplete="tel"
                            inputMode="numeric"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="300 123 4567"
                            className="input"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.15em] text-ink/70">
                            Correo electrónico *
                        </label>
                        <input
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="tu@correo.com"
                            className="input"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.15em] text-ink/70">
                            Contraseña * (mínimo 6 caracteres)
                        </label>
                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                autoComplete="new-password"
                                value={form.password}
                                onChange={handleChange}
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

                    <div>
                        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.15em] text-ink/70">
                            Confirmar contraseña *
                        </label>
                        <div className="relative">
                            <input
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                required
                                autoComplete="new-password"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
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
                        className="btn-dark mt-2 w-full py-4 text-xs"
                    >
                        {loading ? 'Creando cuenta…' : 'Crear mi cuenta'}
                    </button>
                </form>

                <div className="mt-8 border-t border-taupe/15 pt-6 text-center text-xs text-taupe">
                    <p>
                        ¿Ya tienes una cuenta?{' '}
                        <Link
                            to={`/login${redirectUrl !== '/cuenta' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
                            className="font-medium text-ink underline transition hover:text-gold"
                        >
                            Inicia sesión aquí
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
