// Monograma e imagotipo oficial de NASAN Colombia.
export default function Monogram({ className = 'h-10 w-auto', variant = 'gold', title = 'NASAN Colombia' }) {
    return (
        <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
            <img
                src="/brand/logo-full.png"
                alt={title}
                className="max-h-full max-w-full object-contain drop-shadow-sm select-none"
                draggable="false"
                loading="eager"
            />
        </div>
    );
}
