import { useState, useEffect } from 'react';
import { FREE_SHIPPING_THRESHOLD } from '@/domain/cart/cart.js';
import { formatMoney } from '@/domain/shared/money.js';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';

const ANNOUNCEMENTS = [
    {
        id: 'shipping',
        text: (
            <>
                Envío <span className="font-bold text-gold">GRATIS</span> a partir de{' '}
                <span className="font-semibold text-white">{formatMoney(FREE_SHIPPING_THRESHOLD)}</span> a todo el país
            </>
        ),
    },
    {
        id: 'rating',
        text: (
            <>
                ⭐ <span className="text-gold font-bold">4.9 / 5</span> en valoraciones de clientes verificados
            </>
        ),
    },
    {
        id: 'originals',
        text: (
            <>
                💎 Perfumes Árabes <span className="text-gold font-bold">100% Originales</span> garantizados
            </>
        ),
    },
];

export default function AnnouncementBar() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
        }, 4500);
        return () => clearInterval(timer);
    }, []);

    const prev = () => setIndex((i) => (i - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length);
    const next = () => setIndex((i) => (i + 1) % ANNOUNCEMENTS.length);

    return (
        <aside className="relative bg-ink py-2 text-cream/90 border-b border-cream/5" aria-label="Avisos y beneficios">
            <div className="container-luxe flex items-center justify-between px-4 text-[10px] uppercase tracking-[0.2em]">
                <button
                    onClick={prev}
                    aria-label="Anuncio anterior"
                    className="p-1 text-cream/40 hover:text-gold transition"
                >
                    <HiOutlineChevronLeft className="h-3 w-3" />
                </button>

                <div className="flex-1 text-center font-medium transition-opacity duration-500">
                    {ANNOUNCEMENTS[index].text}
                </div>

                <button
                    onClick={next}
                    aria-label="Siguiente anuncio"
                    className="p-1 text-cream/40 hover:text-gold transition"
                >
                    <HiOutlineChevronRight className="h-3 w-3" />
                </button>
            </div>
        </aside>
    );
}
