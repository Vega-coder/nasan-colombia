import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/presentation/context/AuthContext.jsx';
import { alertError, toastSuccess } from '@/presentation/utils/swal.js';
import Logo from '@/presentation/components/brand/Logo.jsx';
import { STORE_WHATSAPP } from '@/infrastructure/container.js';

export default function ForgotPassword() {
    const { resetPassword } = useAuth();
    const [searchParams] = useSearchParams();
    const initialEmail = searchParams.get('email') || '';

    const [email, setEmail] = useState(initialEmail);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        const cleanEmail = email.trim();
        if (!cleanEmail || !cleanEmail.includes('@')) {
            setErrorMsg('Ingresa un correo electrónico válido');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(cleanEmail);
            setSubmitted(true);
            toastSuccess('Enlace de recuperación enviado');
        } catch (err) {
            const msg = err.message || 'No se pudo procesar la solicitud de recuperación';
            setErrorMsg(msg);
            alertError('Error al recuperar contraseña', msg);
        } finally {
            setLoading(false);
        }
    };

    const whatsappHelpUrl = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(
        `Hola Aroma Premium ✨, necesito ayuda para recuperar el acceso a mi cuenta (${email.trim() || 'cliente'}).`
    )}`;

    return (
        <div className="container-luxe flex min-h-[75vh] items-center justify-center py-16">
            <div className="w-full max-w-md border border-taupe/20 bg-white/80 p-8 shadow-luxe backdrop-blur sm:p-10">
                <div className="text-center">
                    <Logo compact className="inline-block" />
                    <p className="eyebrow mt-4 text-taupe">Seguridad y acceso</p>
                    <h1 className="mt-2 text-3xl font-normal text-ink sm:text-4xl">Recuperar contraseña</h1>
                </div>

                {submitted ? (
                    <div className="mt-8 space-y-6 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold">
                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>

                        <div className="space-y-2">
                            <h2 className="font-display text-lg text-ink">¡Revisa tu correo electrónico!</h2>
                            <p className="text-xs leading-relaxed text-taupe">
                                Hemos enviado un enlace de recuperación a:
                            </p>
                            <p className="text-sm font-medium text-ink bg-cream/60 py-1.5 px-3 rounded inline-block">
                                {email}
                            </p>
                            <p className="text-[11px] text-taupe/80 pt-2">
                                Si no lo ves en unos minutos, revisa tu carpeta de <strong>correo no deseado o spam</strong>.
                            </p>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-taupe/15">
                            <button
                                type="button"
                                onClick={() => setSubmitted(false)}
                                className="text-xs text-ink underline hover:text-gold transition block w-full text-center"
                            >
                                Enviar a otro correo electrónico
                            </button>

                            <Link
                                to="/login"
                                className="btn-dark block w-full py-3.5 text-center text-xs"
                            >
                                Volver al inicio de sesión
                            </Link>

                            <a
                                href={whatsappHelpUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 text-xs text-taupe transition hover:text-[#25D366] pt-2"
                            >
                                <span>¿Problemas para acceder? Escríbenos por WhatsApp</span>
                            </a>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="mt-4 text-center text-xs leading-relaxed text-taupe">
                            Ingresa tu correo electrónico registrado y te enviaremos las instrucciones para restablecer tu contraseña.
                        </p>

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

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-dark w-full py-4 text-xs uppercase tracking-wider"
                            >
                                {loading ? 'Enviando instrucciones…' : 'Enviar enlace de recuperación'}
                            </button>
                        </form>

                        <div className="mt-8 space-y-4 border-t border-taupe/15 pt-6 text-center text-xs text-taupe">
                            <p>
                                ¿Recordaste tu contraseña?{' '}
                                <Link
                                    to="/login"
                                    className="font-medium text-ink underline transition hover:text-gold"
                                >
                                    Iniciar sesión
                                </Link>
                            </p>

                            <p>
                                <a
                                    href={whatsappHelpUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-taupe underline hover:text-[#25D366] transition inline-flex items-center gap-1.5"
                                >
                                    ¿Necesitas ayuda inmediata? WhatsApp
                                </a>
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
