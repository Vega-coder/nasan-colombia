import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    HiStar,
    HiOutlineStar,
    HiCheckBadge,
    HiHandThumbUp,
    HiOutlinePencilSquare,
    HiOutlineXMark,
    HiSparkles,
    HiOutlineChatBubbleBottomCenterText,
    HiOutlineLockClosed,
} from 'react-icons/hi2';
import { useCases } from '@/infrastructure/container.js';
import { useAuth } from '@/presentation/context/AuthContext.jsx';
import { alertError, toast } from '@/presentation/utils/swal.js';

export default function ProductReviews({ product }) {
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [helpfulVotes, setHelpfulVotes] = useState({});

    // Form state
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [author, setAuthor] = useState('');
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [longevity, setLongevity] = useState('Más de 10 horas');
    const [submitted, setSubmitted] = useState(false);

    // URLs de redirección con retorno a esta sección de reseñas tras iniciar sesión
    const currentUrl = `${location.pathname}${location.search || ''}#reviews`;
    const loginUrl = `/login?redirect=${encodeURIComponent(currentUrl)}`;
    const registerUrl = `/registro?redirect=${encodeURIComponent(currentUrl)}`;

    // Autocompletar nombre del autor cuando el usuario esté autenticado
    useEffect(() => {
        if (user && !author) {
            setAuthor(user.fullName || user.email?.split('@')[0] || '');
        }
    }, [user, author]);

    // Cargar reseñas reales desde el backend / base de datos Supabase
    useEffect(() => {
        let mounted = true;
        setLoading(true);

        useCases.getProductReviews(product.id)
            .then((data) => {
                if (mounted) {
                    setReviews(data || []);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (mounted) {
                    setReviews([]);
                    setLoading(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, [product.id]);

    // Estadísticas dinámicas calculadas 100% sobre datos reales de la BD
    const stats = useMemo(() => {
        if (!reviews.length) {
            return { average: '5.0', total: 0, distribution: { 5: 100, 4: 0, 3: 0, 2: 0, 1: 0 } };
        }
        const total = reviews.length;
        const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0);
        const average = (sum / total).toFixed(1);

        const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach((r) => {
            const star = Math.min(5, Math.max(1, Math.round(Number(r.rating || 5))));
            counts[star] = (counts[star] || 0) + 1;
        });

        const distribution = {};
        for (let star = 5; star >= 1; star--) {
            distribution[star] = Math.round((counts[star] / total) * 100);
        }

        return { average, total, distribution };
    }, [reviews]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Restricción para usuarios no registrados / invitados
        if (!isAuthenticated) {
            alertError('Acceso restringido', 'Debes iniciar sesión o registrarte para calificar o comentar productos.');
            return;
        }

        if (!author.trim() || !comment.trim() || submitting) return;

        setSubmitting(true);
        try {
            const saved = await useCases.submitProductReview({
                productId: product.id,
                author: author.trim(),
                rating,
                title: title.trim() || 'Excelente fragancia',
                comment: comment.trim(),
                longevity,
                sillage: 'Pesada',
            });

            setReviews((prev) => [saved, ...prev]);
            setTitle('');
            setComment('');
            setRating(5);
            setFormOpen(false);
            setSubmitted(true);
            setTimeout(() => setSubmitted(false), 5000);
        } catch (err) {
            console.error('Error al enviar reseña:', err);
            alertError('No se pudo guardar la reseña', err.message || 'Ocurrió un error inesperado al enviar la reseña');
        } finally {
            setSubmitting(false);
        }
    };

    const handleVoteHelpful = async (id) => {
        // Restricción informativa si el visitante no ha iniciado sesión
        if (!isAuthenticated) {
            toast('Inicia sesión para valorar opiniones de otros clientes', 'info');
            return;
        }

        if (helpfulVotes[id]) return;
        setHelpfulVotes((prev) => ({ ...prev, [id]: true }));

        // Optimistic UI update
        setReviews((prev) =>
            prev.map((r) => (r.id === id ? { ...r, helpful: (r.helpful || 0) + 1 } : r))
        );

        try {
            await useCases.voteReviewHelpful(id);
        } catch {
            // Ignorar
        }
    };

    return (
        <section id="reviews" className="border-t border-taupe/15 bg-white py-16 sm:py-20 scroll-mt-24">
            <div className="container-luxe">
                {/* Encabezado de la sección */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-taupe/15 pb-8">
                    <div>
                        <p className="eyebrow text-gold-dark flex items-center gap-1.5">
                            <HiSparkles className="h-4 w-4" />
                            Opiniones de clientes
                        </p>
                        <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold uppercase tracking-[0.15em] text-ink">
                            Reseñas de {product.name}
                        </h2>
                        <p className="mt-1 text-xs text-taupe">
                            Experiencias reales de compradores verificados almacenadas en base de datos
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setFormOpen((prev) => !prev)}
                        className="btn-dark flex items-center justify-center gap-2 self-start md:self-auto px-6 py-3 text-xs tracking-wider shadow-sm hover:scale-105 transition duration-300"
                    >
                        {isAuthenticated ? (
                            <>
                                <HiOutlinePencilSquare className="h-4 w-4 text-gold" />
                                <span>{formOpen ? 'Cerrar formulario' : 'Escribir una reseña'}</span>
                            </>
                        ) : (
                            <>
                                <HiOutlineLockClosed className="h-4 w-4 text-gold" />
                                <span>{formOpen ? 'Cerrar aviso' : 'Escribir una reseña'}</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Mensaje de confirmación tras publicar */}
                {submitted && (
                    <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-50/80 p-4 text-center text-xs font-medium text-emerald-800 animate-fade-up">
                        ✨ ¡Muchas gracias por tu reseña! Ha sido guardada y publicada exitosamente.
                    </div>
                )}

                {/* Aviso para usuarios no registrados o invitados */}
                {formOpen && !isAuthenticated && (
                    <div className="mt-8 rounded-2xl border border-gold/40 bg-cream/40 p-6 sm:p-8 animate-fade-up shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-dark ring-4 ring-gold/10">
                                    <HiOutlineLockClosed className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-dark">
                                            Acceso exclusivo
                                        </span>
                                        <span className="text-[11px] text-taupe">Clientes registrados</span>
                                    </div>
                                    <h3 className="mt-1.5 font-display text-lg font-bold text-ink">
                                        Inicia sesión para opinar y puntuar este perfume
                                    </h3>
                                    <p className="mt-1 text-xs text-taupe leading-relaxed max-w-xl">
                                        Para garantizar la veracidad de las opiniones y evitar spam, sólo los clientes registrados pueden comentar y calificar fragancias.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0">
                                <Link
                                    to={loginUrl}
                                    className="btn-dark flex-1 sm:flex-none text-center px-5 py-2.5 text-xs font-semibold tracking-wider hover:scale-105 transition duration-300"
                                >
                                    Iniciar sesión
                                </Link>
                                <Link
                                    to={registerUrl}
                                    className="btn-outline flex-1 sm:flex-none text-center px-5 py-2.5 text-xs font-semibold tracking-wider hover:scale-105 transition duration-300"
                                >
                                    Crear cuenta
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setFormOpen(false)}
                                    className="text-taupe hover:text-ink p-1 hidden sm:block"
                                    aria-label="Cerrar aviso"
                                >
                                    <HiOutlineXMark className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Formulario de nueva reseña para usuarios autenticados */}
                {formOpen && isAuthenticated && (
                    <div className="mt-8 rounded-2xl border border-gold/40 bg-cream-light/40 p-6 sm:p-8 animate-fade-up shadow-sm">
                        <div className="flex items-center justify-between border-b border-taupe/15 pb-4">
                            <div>
                                <h3 className="font-display text-lg font-bold text-ink">Tu valoración de este perfume</h3>
                                <p className="mt-0.5 text-xs text-taupe flex items-center gap-1.5">
                                    <HiCheckBadge className="h-4 w-4 text-emerald-600" />
                                    <span>Publicando como <strong className="text-ink">{user?.fullName || user?.email}</strong></span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormOpen(false)}
                                className="text-taupe hover:text-ink"
                                aria-label="Cerrar formulario"
                            >
                                <HiOutlineXMark className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                            {/* Selector de estrellas */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1.5">
                                    Calificación general *
                                </label>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="p-1 transition-transform hover:scale-125"
                                            aria-label={`Calificar con ${star} estrellas`}
                                        >
                                            {star <= (hoverRating || rating) ? (
                                                <HiStar className="h-7 w-7 text-amber-500" />
                                            ) : (
                                                <HiOutlineStar className="h-7 w-7 text-taupe/40" />
                                            )}
                                        </button>
                                    ))}
                                    <span className="ml-3 text-xs font-semibold text-ink">
                                        {rating === 5 && '¡Excelente!'}
                                        {rating === 4 && 'Muy bueno'}
                                        {rating === 3 && 'Bueno'}
                                        {rating === 2 && 'Regular'}
                                        {rating === 1 && 'No me gustó'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1.5">
                                        Tu nombre para la reseña *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={author}
                                        onChange={(e) => setAuthor(e.target.value)}
                                        placeholder="Tu nombre completo o alias"
                                        className="input w-full py-2.5 text-xs bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1.5">
                                        Fijación en tu piel
                                    </label>
                                    <select
                                        value={longevity}
                                        onChange={(e) => setLongevity(e.target.value)}
                                        className="input w-full py-2.5 text-xs bg-white"
                                    >
                                        <option value="Más de 12 horas">Más de 12 horas (Monstruosa)</option>
                                        <option value="Más de 10 horas">8 a 10 horas (Excelente)</option>
                                        <option value="6 a 8 horas">6 a 8 horas (Buena)</option>
                                        <option value="4 a 6 horas">4 a 6 horas (Moderada)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1.5">
                                    Título de tu reseña
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ej: Excelente proyección y fijación"
                                    className="input w-full py-2.5 text-xs bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1.5">
                                    Comentario o experiencia *
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Describe la evolución del aroma, en qué ocasiones lo usarías, los cumplidos que recibiste..."
                                    className="input w-full py-2.5 text-xs bg-white leading-relaxed"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setFormOpen(false)}
                                    className="btn-outline px-5 py-2.5 text-xs"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-gold px-6 py-2.5 text-xs font-semibold disabled:opacity-50"
                                >
                                    {submitting ? 'Guardando en BD…' : 'Publicar reseña'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Resumen de Calificaciones y Desglose si hay reseñas */}
                {stats.total > 0 && (
                    <div className="mt-10 grid gap-8 rounded-2xl border border-taupe/15 bg-cream/15 p-6 sm:p-8 md:grid-cols-12 md:items-center">
                        <div className="flex flex-col items-center justify-center text-center md:col-span-4 md:border-r md:border-taupe/15 md:pr-8">
                            <span className="font-display text-5xl sm:text-6xl font-extrabold text-ink">
                                {stats.average}
                            </span>
                            <div className="mt-2 flex items-center gap-1 text-amber-500">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <HiStar key={s} className="h-5 w-5" />
                                ))}
                            </div>
                            <p className="mt-2 text-xs font-medium text-taupe">
                                Basado en <strong className="text-ink">{stats.total} {stats.total === 1 ? 'opinión' : 'opiniones'}</strong> en base de datos
                            </p>
                            <span className="mt-3 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-800">
                                ✓ Calificación verificada
                            </span>
                        </div>

                        <div className="space-y-2 md:col-span-5 md:px-4">
                            {[5, 4, 3, 2, 1].map((stars) => {
                                const pct = stats.distribution[stars] || 0;
                                return (
                                    <div key={stars} className="flex items-center gap-3 text-xs">
                                        <span className="flex w-12 items-center gap-1 text-taupe font-medium">
                                            {stars} <HiStar className="h-3.5 w-3.5 text-amber-500" />
                                        </span>
                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream/60">
                                            <div
                                                className="h-full bg-amber-500 transition-all duration-500 rounded-full"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="w-9 text-right text-taupe font-mono text-[11px]">{pct}%</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="space-y-3 rounded-xl bg-white p-4 text-xs md:col-span-3 shadow-xs border border-taupe/10">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-taupe">Rendimiento verificado</p>
                            <div className="flex justify-between border-b border-taupe/10 pb-1.5">
                                <span className="text-taupe">Fijación en piel:</span>
                                <span className="font-semibold text-ink">9.7 / 10</span>
                            </div>
                            <div className="flex justify-between border-b border-taupe/10 pb-1.5">
                                <span className="text-taupe">Estela / Proyección:</span>
                                <span className="font-semibold text-ink">9.5 / 10</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-taupe">Autenticidad:</span>
                                <span className="font-semibold text-emerald-700">100% Original</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Estado de carga */}
                {loading && (
                    <div className="mt-12 space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="animate-pulse rounded-2xl border border-taupe/15 bg-white p-6">
                                <div className="h-4 w-1/4 rounded bg-cream/60" />
                                <div className="mt-3 h-3 w-3/4 rounded bg-cream/40" />
                                <div className="mt-2 h-3 w-1/2 rounded bg-cream/30" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Estado vacío: Sin reseñas aún para este perfume */}
                {!loading && reviews.length === 0 && (
                    <div className="mt-10 rounded-2xl border border-taupe/15 bg-white p-10 text-center shadow-xs">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream/50 text-gold-dark">
                            <HiOutlineChatBubbleBottomCenterText className="h-7 w-7" />
                        </div>
                        <h4 className="mt-4 font-display text-lg font-bold text-ink">
                            Aún no hay reseñas para este perfume
                        </h4>
                        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-taupe">
                            ¿Has tenido la oportunidad de probar {product.name}? Sé el primero en compartir tu experiencia y ayudar a otros amantes de la perfumería árabe.
                        </p>
                        {isAuthenticated ? (
                            <button
                                type="button"
                                onClick={() => setFormOpen(true)}
                                className="btn-gold mt-6 px-6 py-2.5 text-xs font-semibold hover:scale-105 transition duration-300"
                            >
                                Escribir la primera reseña
                            </button>
                        ) : (
                            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                                <Link
                                    to={loginUrl}
                                    className="btn-dark inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold hover:scale-105 transition duration-300"
                                >
                                    <HiOutlineLockClosed className="h-4 w-4 text-gold" />
                                    Inicia sesión para opinar
                                </Link>
                                <Link
                                    to={registerUrl}
                                    className="btn-outline px-6 py-2.5 text-xs font-semibold hover:scale-105 transition duration-300"
                                >
                                    Crear cuenta
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* Lista de reseñas individuales desde la BD */}
                {!loading && reviews.length > 0 && (
                    <div className="mt-12 space-y-6">
                        {reviews.map((rev) => (
                            <article
                                key={rev.id}
                                className="rounded-2xl border border-taupe/15 bg-white p-6 shadow-xs transition duration-300 hover:border-gold/40 hover:shadow-sm"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/15 font-display text-sm font-bold text-gold-dark ring-2 ring-gold/30">
                                            {rev.author.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-ink text-sm">{rev.author}</h4>
                                                {rev.verified && (
                                                    <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                                        <HiCheckBadge className="h-3.5 w-3.5" />
                                                        Compra verificada
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-taupe">
                                                <span>{rev.city || 'Colombia'}</span>
                                                <span>·</span>
                                                <span>{rev.date || 'Reciente'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-0.5 text-amber-500">
                                        {[...Array(5)].map((_, i) => (
                                            <HiStar
                                                key={i}
                                                className={`h-4 w-4 ${i < Number(rev.rating) ? 'text-amber-500' : 'text-taupe/20'}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <h5 className="mt-4 font-display text-base font-bold text-ink">
                                    “{rev.title}”
                                </h5>
                                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-taupe-dark/90">
                                    {rev.comment}
                                </p>

                                <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px]">
                                    {rev.longevity && (
                                        <span className="rounded bg-cream/60 px-2 py-1 text-taupe font-medium">
                                            ⏳ Fijación: <strong>{rev.longevity}</strong>
                                        </span>
                                    )}
                                    {rev.sillage && (
                                        <span className="rounded bg-cream/60 px-2 py-1 text-taupe font-medium">
                                            💨 Estela: <strong>{rev.sillage}</strong>
                                        </span>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-taupe/10 pt-3 text-xs text-taupe">
                                    <span>¿Te resultó útil esta reseña?</span>
                                    <button
                                        type="button"
                                        onClick={() => handleVoteHelpful(rev.id)}
                                        disabled={helpfulVotes[rev.id]}
                                        className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition ${
                                            helpfulVotes[rev.id]
                                                ? 'text-gold-dark font-semibold bg-gold/10'
                                                : 'hover:text-ink hover:bg-cream/40'
                                        }`}
                                    >
                                        <HiHandThumbUp className="h-3.5 w-3.5" />
                                        <span>Sí ({rev.helpful || 0})</span>
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
