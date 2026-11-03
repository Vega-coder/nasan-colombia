import { useId } from 'react';

// Comprime el texto a un ancho fijo cuando es demasiado largo para la etiqueta.
const fitText = (text, maxChars, width) =>
    text.length > maxChars ? { textLength: width, lengthAdjust: 'spacingAndGlyphs' } : {};

// Ilustración SVG del producto generada a partir de su paleta.
// Evita depender de fotos externas mientras el cliente carga las imágenes reales.
export default function BottleArt({ product, className = 'h-full w-auto' }) {
    const uid = useId().replace(/:/g, '');
    const { from, to, liquid } = product.palette;

    if (product.type === 'set') return <GiftBox uid={uid} from={from} to={to} brand={product.brand} className={className} />;
    if (product.type === 'accesorio') return <Atomizer uid={uid} from={from} to={to} liquid={liquid} className={className} />;

    return (
        <svg viewBox="0 0 160 220" className={className} aria-hidden="true">
            <defs>
                <linearGradient id={`glass${uid}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={from} stopOpacity="0.95" />
                    <stop offset="100%" stopColor={to} />
                </linearGradient>
                <linearGradient id={`liquid${uid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={liquid} stopOpacity="0.55" />
                    <stop offset="100%" stopColor={liquid} />
                </linearGradient>
                <linearGradient id={`cap${uid}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0B0B0B" />
                    <stop offset="50%" stopColor="#2A2622" />
                    <stop offset="100%" stopColor="#0B0B0B" />
                </linearGradient>
                <linearGradient id={`gold${uid}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#9C7A3C" />
                    <stop offset="50%" stopColor="#E6CF9A" />
                    <stop offset="100%" stopColor="#9C7A3C" />
                </linearGradient>
            </defs>
            {/* Sombra */}
            <ellipse cx="80" cy="212" rx="56" ry="6" fill="#0B0B0B" opacity="0.18" />
            {/* Tapa */}
            <rect x="56" y="8" width="48" height="44" rx="3" fill={`url(#cap${uid})`} />
            <rect x="56" y="48" width="48" height="5" fill={`url(#gold${uid})`} />
            <rect x="68" y="53" width="24" height="12" fill={`url(#gold${uid})`} opacity="0.85" />
            {/* Frasco */}
            <rect x="22" y="65" width="116" height="145" rx="10" fill={`url(#glass${uid})`} />
            <rect x="30" y="92" width="100" height="110" rx="6" fill={`url(#liquid${uid})`} opacity="0.85" />
            {/* Brillo */}
            <rect x="32" y="72" width="10" height="128" rx="5" fill="#FFFFFF" opacity="0.22" />
            {/* Etiqueta */}
            <rect x="42" y="118" width="76" height="44" fill="#F8F4EE" opacity="0.92" />
            <text
                x="80" y="137" textAnchor="middle" fontFamily="'Playfair Display', Georgia, serif" fontSize="11" fill="#0B0B0B"
                {...fitText(product.name, 10, 66)}
            >
                {product.name}
            </text>
            <text
                x="80" y="151" textAnchor="middle" fontFamily="Montserrat, sans-serif" fontSize="5" letterSpacing="1" fill="#8C7A70"
                {...fitText(product.brand, 16, 66)}
            >
                {product.brand.toUpperCase()}
            </text>
        </svg>
    );
}

function GiftBox({ uid, from, to, brand, className }) {
    return (
        <svg viewBox="0 0 180 200" className={className} aria-hidden="true">
            <defs>
                <linearGradient id={`box${uid}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={from} />
                    <stop offset="100%" stopColor={to} />
                </linearGradient>
            </defs>
            <ellipse cx="90" cy="192" rx="70" ry="6" fill="#0B0B0B" opacity="0.18" />
            <rect x="20" y="70" width="140" height="118" rx="4" fill={`url(#box${uid})`} />
            <rect x="14" y="56" width="152" height="24" rx="3" fill={from} />
            <rect x="82" y="56" width="16" height="132" fill="#C6A15B" />
            <path d="M90 56c-20-30-48-22-40-6 6 10 28 8 40 6zM90 56c20-30 48-22 40-6-6 10-28 8-40 6z" fill="#C6A15B" />
            <text x="90" y="140" textAnchor="middle" fontFamily="Montserrat, sans-serif" fontSize="7" letterSpacing="2" fill="#F8F4EE" opacity="0.9">
                {brand.toUpperCase()}
            </text>
        </svg>
    );
}

function Atomizer({ uid, from, to, liquid, className }) {
    return (
        <svg viewBox="0 0 100 220" className={className} aria-hidden="true">
            <defs>
                <linearGradient id={`atom${uid}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={to} />
                    <stop offset="50%" stopColor={from} />
                    <stop offset="100%" stopColor={to} />
                </linearGradient>
            </defs>
            <ellipse cx="50" cy="212" rx="34" ry="5" fill="#0B0B0B" opacity="0.18" />
            <rect x="40" y="10" width="20" height="26" rx="4" fill="#0B0B0B" />
            <rect x="32" y="36" width="36" height="174" rx="16" fill={`url(#atom${uid})`} />
            <rect x="40" y="60" width="20" height="120" rx="10" fill={liquid} opacity="0.35" />
            <rect x="36" y="44" width="5" height="150" rx="2.5" fill="#FFFFFF" opacity="0.25" />
        </svg>
    );
}
