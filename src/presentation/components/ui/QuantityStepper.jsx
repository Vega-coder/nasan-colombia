import { HiMinus, HiPlus } from 'react-icons/hi2';

export default function QuantityStepper({ value, onChange, max = 10, size = 'md' }) {
    const box = size === 'sm' ? 'h-8 w-8' : 'h-11 w-11';
    return (
        <div className="inline-flex items-center border border-taupe/30">
            <button
                type="button"
                className={`${box} flex items-center justify-center transition-all duration-150 hover:bg-cream hover:text-gold-dark active:scale-90`}
                onClick={() => onChange(value - 1)}
                aria-label="Disminuir cantidad"
            >
                <HiMinus className="h-3 w-3" />
            </button>
            <span className={`${box} flex items-center justify-center text-sm font-semibold select-none`} aria-live="polite">{value}</span>
            <button
                type="button"
                className={`${box} flex items-center justify-center transition-all duration-150 hover:bg-cream hover:text-gold-dark active:scale-90 disabled:opacity-30 disabled:pointer-events-none`}
                onClick={() => onChange(value + 1)}
                disabled={value >= max}
                aria-label="Aumentar cantidad"
            >
                <HiPlus className="h-3 w-3" />
            </button>
        </div>
    );
}
