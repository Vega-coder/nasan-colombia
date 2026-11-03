import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCases } from '@/infrastructure/container.js';
import { alertSuccess, alertError } from '@/presentation/utils/swal.js';
import { FaInstagram, FaTiktok, FaFacebookF, FaYoutube, FaCopy, FaCheck, FaCoins, FaLink, FaShieldHalved } from 'react-icons/fa6';
import { formatMoney } from '@/domain/shared/money.js';

export default function AffiliateLanding() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        platform: 'instagram',
        socialHandle: '',
        couponCode: '',
        bankName: 'Bancolombia',
        bankAccountType: 'Ahorros',
        bankAccountNumber: '',
        bankDocumentId: '',
        termsAccepted: false,
    });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [registeredSuccess, setRegisteredSuccess] = useState(false);

    // Calculadora interactiva
    const [calcSales, setCalcSales] = useState(15);
    const avgTicket = 220000;
    const calcVolume = calcSales * avgTicket;
    const calcCommission = Math.round(calcVolume * 0.05);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.termsAccepted) {
            alertError('Términos requeridos', 'Debes autorizar el tratamiento de datos y aceptar las condiciones del programa.');
            return;
        }

        setSubmitting(true);
        setErrors({});
        try {
            await useCases.registerAffiliate({
                ...formData,
                couponCode: formData.couponCode.toUpperCase().trim(),
            });

            setRegisteredSuccess(true);
            alertSuccess(
                '¡Solicitud enviada con éxito!',
                'Hemos recibido tu postulación a Aroma Premium Partners. El equipo revisará tu perfil en menos de 24 horas y te notificará por WhatsApp y correo electrónico.'
            );
        } catch (err) {
            if (err.fields) {
                setErrors(err.fields);
            }
            alertError('No pudimos procesar tu solicitud', err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-cream-light min-h-screen text-ink">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-ink py-20 text-cream sm:py-28">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="container-luxe relative text-center">
                    <span className="inline-block rounded-full border border-gold/40 bg-gold/10 px-4 py-1 font-display text-xs font-semibold uppercase tracking-[0.25em] text-gold">
                        Programa de Creadores & Influencers
                    </span>
                    <h1 className="mt-6 font-display text-4xl sm:text-6xl text-cream-light font-normal tracking-wide">
                        AROMA PREMIUM <span className="text-gold italic">PARTNERS</span>
                    </h1>
                    <p className="mt-4 text-lg text-cream/80 max-w-2xl mx-auto font-light">
                        Comparte tu esencia. Gana comisiones por cada venta que generes con tu código exclusivo y enlace personalizado.
                    </p>

                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <a href="#registro" className="btn-gold px-8 py-3.5 text-xs uppercase tracking-widest font-semibold shadow-lg">
                            Unirme al programa
                        </a>
                        <Link to="/partners/portal" className="border border-cream/30 px-8 py-3.5 text-xs uppercase tracking-widest font-medium text-cream hover:bg-cream/10 transition">
                            Ya soy partner (Ingresar)
                        </Link>
                    </div>
                </div>
            </section>

            {/* ¿Cómo funciona? */}
            <section className="py-16 sm:py-24 container-luxe">
                <div className="text-center max-w-xl mx-auto">
                    <p className="eyebrow text-gold-dark">Sencillo, transparente y automatizado</p>
                    <h2 className="mt-2 text-3xl sm:text-4xl">¿Cómo funciona Aroma Premium Partners?</h2>
                </div>

                <div className="mt-14 grid gap-8 md:grid-cols-3">
                    <div className="bg-white p-8 shadow-sm ring-1 ring-taupe/10 relative">
                        <span className="font-display text-4xl font-bold text-gold/30">01</span>
                        <h3 className="mt-3 font-display text-xl text-ink">Regístrate y obtén tu código</h3>
                        <p className="mt-3 text-sm text-taupe leading-relaxed">
                            Completa el formulario con tus redes sociales y elige tu código exclusivo (ej: <span className="font-semibold text-ink">LAURA10</span>). Lo aprobamos en pocas horas.
                        </p>
                    </div>

                    <div className="bg-white p-8 shadow-sm ring-1 ring-taupe/10 relative">
                        <span className="font-display text-4xl font-bold text-gold/30">02</span>
                        <h3 className="mt-3 font-display text-xl text-ink">Comparte en tus redes</h3>
                        <p className="mt-3 text-sm text-taupe leading-relaxed">
                            Tus seguidores obtienen un <span className="font-semibold text-ink">descuento especial</span> al comprar tus perfumes favoritos usando tu código o enlace directo.
                        </p>
                    </div>

                    <div className="bg-white p-8 shadow-sm ring-1 ring-taupe/10 relative">
                        <span className="font-display text-4xl font-bold text-gold/30">03</span>
                        <h3 className="mt-3 font-display text-xl text-ink">Gana comisiones en efectivo</h3>
                        <p className="mt-3 text-sm text-taupe leading-relaxed">
                            Monitorea tus ventas en vivo desde tu panel privado. Recibe transferencias mensuales directamente a tu cuenta bancaria o Nequi.
                        </p>
                    </div>
                </div>
            </section>

            {/* Calculadora de Ganancias */}
            <section className="bg-white py-16 border-y border-taupe/15">
                <div className="container-luxe max-w-4xl">
                    <div className="grid gap-10 md:grid-cols-2 items-center">
                        <div>
                            <span className="eyebrow text-gold-dark">Simulador de ingresos</span>
                            <h2 className="mt-2 text-3xl font-display">Calcula tu potencial de ganancias</h2>
                            <p className="mt-3 text-sm text-taupe">
                                Con un ticket promedio de $220.000 COP por perfume, mira cuánto puedes generar recomendando fragancias de nicho y diseñador:
                            </p>

                            <div className="mt-6">
                                <label className="text-xs uppercase tracking-wider text-taupe font-semibold">
                                    Ventas estimadas por mes: <span className="text-ink font-bold text-base">{calcSales} perfumes</span>
                                </label>
                                <input
                                    type="range"
                                    min="3"
                                    max="100"
                                    value={calcSales}
                                    onChange={(e) => setCalcSales(Number(e.target.value))}
                                    className="w-full mt-3 accent-gold cursor-pointer"
                                />
                                <div className="flex justify-between text-[11px] text-taupe mt-1">
                                    <span>3 ventas</span>
                                    <span>50 ventas</span>
                                    <span>100 ventas</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-ink text-cream p-8 rounded-lg shadow-xl text-center">
                            <p className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">Comisión estimada al mes</p>
                            <p className="mt-3 font-display text-4xl sm:text-5xl text-cream-light font-bold">
                                {formatMoney(calcCommission)}
                            </p>
                            <div className="mt-6 pt-6 border-t border-cream/15 grid grid-cols-2 gap-4 text-xs text-cream/70">
                                <div>
                                    <p className="text-taupe-light">Volumen generado</p>
                                    <p className="font-semibold text-cream text-sm mt-0.5">{formatMoney(calcVolume)}</p>
                                </div>
                                <div>
                                    <p className="text-taupe-light">Nivel inicial</p>
                                    <p className="font-semibold text-gold text-sm mt-0.5">5% Comisión</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Niveles de Comisiones */}
            <section className="py-16 container-luxe max-w-4xl">
                <div className="text-center mb-10">
                    <span className="eyebrow text-gold-dark">Crecimiento escalable</span>
                    <h2 className="text-3xl font-display mt-2">Niveles de creadores</h2>
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                    <div className="bg-white p-6 border border-taupe/20 text-center">
                        <span className="text-xs uppercase tracking-wider font-semibold text-taupe">Nivel Inicial</span>
                        <h3 className="font-display text-xl mt-1">Principiante</h3>
                        <p className="font-display text-3xl font-bold text-gold-dark mt-4">5%</p>
                        <p className="text-xs text-taupe mt-1">Comisión por venta</p>
                        <p className="text-xs font-semibold text-ink mt-3">3% descuento al seguidor</p>
                        <p className="text-[11px] text-taupe mt-3">0 a 14 ventas confirmadas</p>
                    </div>

                    <div className="bg-white p-6 border-2 border-gold text-center relative shadow-md">
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-ink text-[10px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full">
                            Popular
                        </span>
                        <span className="text-xs uppercase tracking-wider font-semibold text-taupe">Crecimiento</span>
                        <h3 className="font-display text-xl mt-1">Intermedio</h3>
                        <p className="font-display text-3xl font-bold text-gold-dark mt-4">7%</p>
                        <p className="text-xs text-taupe mt-1">Comisión por venta</p>
                        <p className="text-xs font-semibold text-ink mt-3">5% descuento al seguidor</p>
                        <p className="text-[11px] text-taupe mt-3">15 a 39 ventas confirmadas</p>
                    </div>

                    <div className="bg-white p-6 border border-taupe/20 text-center">
                        <span className="text-xs uppercase tracking-wider font-semibold text-taupe">Embajador VIP</span>
                        <h3 className="font-display text-xl mt-1">Alto Rendimiento</h3>
                        <p className="font-display text-3xl font-bold text-gold-dark mt-4">10%</p>
                        <p className="text-xs text-taupe mt-1">Comisión por venta</p>
                        <p className="text-xs font-semibold text-ink mt-3">5% descuento al seguidor</p>
                        <p className="text-[11px] text-taupe mt-3">40+ ventas confirmadas</p>
                    </div>
                </div>
            </section>

            {/* Formulario de Registro */}
            <section id="registro" className="py-20 bg-cream/40 border-t border-taupe/15">
                <div className="container-luxe max-w-2xl">
                    <div className="bg-white p-8 sm:p-12 shadow-sm ring-1 ring-taupe/15">
                        <div className="text-center">
                            <span className="eyebrow text-gold-dark">Únete hoy</span>
                            <h2 className="text-3xl font-display mt-2">Postúlate a Aroma Premium Partners</h2>
                            <p className="text-sm text-taupe mt-2">
                                Completa tus datos para crear tu cuenta de partner. Te contactaremos por WhatsApp con la confirmación.
                            </p>
                        </div>

                        {registeredSuccess ? (
                            <div className="mt-8 rounded border border-emerald-300 bg-emerald-50 p-6 text-center text-emerald-900">
                                <FaCheck className="mx-auto h-10 w-10 text-emerald-600 mb-3" />
                                <h3 className="font-display text-xl font-semibold">¡Solicitud recibida!</h3>
                                <p className="text-sm mt-2 text-emerald-800">
                                    Revisaremos tu usuario en redes sociales y activaremos tu código exclusivo a la brevedad.
                                </p>
                                <Link to="/" className="btn-dark mt-6 inline-block text-xs uppercase tracking-wider">
                                    Volver a la tienda
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-taupe">Nombre completo *</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="Laura Martínez"
                                        className="w-full mt-1 border border-taupe/30 p-2.5 text-sm focus:border-gold focus:outline-none"
                                        required
                                    />
                                    {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-taupe">Correo electrónico *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="laura@ejemplo.com"
                                            className="w-full mt-1 border border-taupe/30 p-2.5 text-sm focus:border-gold focus:outline-none"
                                            required
                                        />
                                        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-taupe">WhatsApp / Celular *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="3001234567"
                                            className="w-full mt-1 border border-taupe/30 p-2.5 text-sm focus:border-gold focus:outline-none"
                                            required
                                        />
                                        {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-taupe">Red social principal *</label>
                                        <select
                                            name="platform"
                                            value={formData.platform}
                                            onChange={handleChange}
                                            className="w-full mt-1 border border-taupe/30 p-2.5 text-sm focus:border-gold focus:outline-none bg-white"
                                        >
                                            <option value="instagram">Instagram</option>
                                            <option value="tiktok">TikTok</option>
                                            <option value="facebook">Facebook</option>
                                            <option value="youtube">YouTube</option>
                                            <option value="other">Otra</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-taupe">Tu usuario en redes *</label>
                                        <input
                                            type="text"
                                            name="socialHandle"
                                            value={formData.socialHandle}
                                            onChange={handleChange}
                                            placeholder="@laurastyle"
                                            className="w-full mt-1 border border-taupe/30 p-2.5 text-sm focus:border-gold focus:outline-none"
                                            required
                                        />
                                        {errors.socialHandle && <p className="text-xs text-red-600 mt-1">{errors.socialHandle}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-taupe">
                                        Código de descuento deseado * (sin espacios)
                                    </label>
                                    <input
                                        type="text"
                                        name="couponCode"
                                        value={formData.couponCode}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                                        placeholder="Ej: LAURA10"
                                        className="w-full mt-1 border border-taupe/30 p-2.5 text-sm uppercase tracking-wider focus:border-gold focus:outline-none"
                                        required
                                    />
                                    {errors.couponCode && <p className="text-xs text-red-600 mt-1">{errors.couponCode}</p>}
                                    <p className="text-[11px] text-taupe mt-1">Este será el código que compartirás con tus seguidores para que reciban su descuento.</p>
                                </div>

                                <div className="pt-4 border-t border-taupe/15">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-ink mb-3">
                                        Datos bancarios para liquidación (opcional ahora, requerido para cobrar)
                                    </p>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <input
                                                type="text"
                                                name="bankName"
                                                value={formData.bankName}
                                                onChange={handleChange}
                                                placeholder="Banco (Bancolombia, Nequi, Daviplata)"
                                                className="w-full border border-taupe/30 p-2 text-xs focus:border-gold focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                name="bankAccountNumber"
                                                value={formData.bankAccountNumber}
                                                onChange={handleChange}
                                                placeholder="Número de cuenta o celular"
                                                className="w-full border border-taupe/30 p-2 text-xs focus:border-gold focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <label className="flex items-start gap-2.5 text-xs text-taupe cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="termsAccepted"
                                            checked={formData.termsAccepted}
                                            onChange={handleChange}
                                            className="mt-0.5 accent-gold"
                                        />
                                        <span>
                                            Autorizo el tratamiento de mis datos personales según la Ley 1581 de 2012 y acepto las directrices de la SIC sobre publicidad comercial y transparencia para creadores de contenido.
                                        </span>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-dark w-full py-3.5 text-xs uppercase tracking-widest font-semibold disabled:opacity-50"
                                >
                                    {submitting ? 'Enviando postulación...' : 'Enviar solicitud de afiliado'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
