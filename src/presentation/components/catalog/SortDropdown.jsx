import { useState, useRef, useEffect } from 'react';
import { HiChevronDown, HiCheck, HiArrowsUpDown } from 'react-icons/hi2';
import { SORT_OPTIONS } from '@/domain/catalog/filters.js';

export default function SortDropdown({ value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const currentOption = SORT_OPTIONS.find((o) => o.id === value) || SORT_OPTIONS[0];

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (id) => {
        onChange(id);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className="relative inline-block text-left">
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={`btn-outline flex items-center gap-2 px-3.5 py-2 text-[11px] font-semibold tracking-wider transition-all duration-200 ${
                    isOpen ? 'border-gold bg-cream-light text-ink ring-1 ring-gold/40' : ''
                }`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <HiArrowsUpDown className="h-3.5 w-3.5 text-gold-dark shrink-0" />
                <span className="text-taupe font-normal hidden sm:inline">Ordenar:</span>
                <span className="font-semibold text-ink truncate max-w-[130px] sm:max-w-none">
                    {currentOption.label}
                </span>
                <HiChevronDown
                    className={`h-3.5 w-3.5 text-taupe transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-gold-dark' : ''
                    }`}
                />
            </button>

            {/* Menú desplegable flotante de lujo */}
            {isOpen && (
                <div
                    className="absolute right-0 top-full mt-2 z-40 w-60 rounded-xl border border-taupe/20 bg-white py-1.5 shadow-2xl ring-1 ring-black/5 animate-fade-up"
                    role="listbox"
                >
                    <div className="px-3.5 py-1.5 border-b border-taupe/10 text-[9px] font-bold uppercase tracking-wider text-taupe">
                        Ordenar productos por
                    </div>
                    {SORT_OPTIONS.map((option) => {
                        const isSelected = option.id === (value || 'featured');
                        return (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => handleSelect(option.id)}
                                role="option"
                                aria-selected={isSelected}
                                className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors ${
                                    isSelected
                                        ? 'bg-cream-light font-bold text-gold-dark'
                                        : 'text-ink/80 hover:bg-cream-light/60 hover:text-ink'
                                }`}
                            >
                                <span>{option.label}</span>
                                {isSelected && <HiCheck className="h-4 w-4 text-gold-dark shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
