import { useState, useRef, useEffect, useMemo } from 'react';
import {
    HiMagnifyingGlassPlus,
    HiMagnifyingGlassMinus,
    HiXMark,
    HiArrowPath,
} from 'react-icons/hi2';
import BottleArt from './BottleArt.jsx';

export default function ProductGallery({ product }) {
    // Normalizar imágenes del producto
    const images = useMemo(() => {
        const raw = Array.isArray(product.images) && product.images.length > 0
            ? product.images.filter(Boolean)
            : [product.image].filter(Boolean);

        if (raw.length === 0) return [];

        // Si el producto tiene múltiples fotos en su catálogo, usarlas todas
        if (raw.length > 1) {
            return raw.map((src, index) => ({
                id: `img-${index}`,
                src,
                label: `Vista ${index + 1}`,
                cropZoom: 1,
            }));
        }

        // Si tiene solo 1 imagen cargada, creamos opciones de perspectiva/detalle
        // para que siempre existan miniaturas interactivas a la izquierda:
        return [
            { id: 'view-front', src: raw[0], label: 'Frasco', cropZoom: 1 },
            { id: 'view-detail', src: raw[0], label: 'Detalle', cropZoom: 1.45 },
            { id: 'view-close', src: raw[0], label: 'Primer plano', cropZoom: 1.9 },
        ];
    }, [product.images, product.image]);

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isHoverZooming, setIsHoverZooming] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalZoom, setModalZoom] = useState(1.5);
    const [modalPan, setModalPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
    const imageContainerRef = useRef(null);

    const activeItem = images[selectedIndex] || images[0];

    // Control de zoom interactivo al mover el cursor sobre la imagen principal
    const handleMouseMove = (e) => {
        if (!imageContainerRef.current) return;
        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
        setZoomPosition({ x, y });
    };

    // Bloquear scroll del body al abrir el modal de lupa
    useEffect(() => {
        if (!isModalOpen) return undefined;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setIsModalOpen(false);
        };
        window.addEventListener('keydown', onKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = '';
        };
    }, [isModalOpen]);

    // Arrastre táctil / mouse en el modal de lupa
    const handleModalMouseDown = (e) => {
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            panX: modalPan.x,
            panY: modalPan.y,
        };
    };

    const handleModalMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setModalPan({
            x: dragStartRef.current.panX + dx,
            y: dragStartRef.current.panY + dy,
        });
    };

    const handleModalMouseUp = () => setIsDragging(false);

    // Resetear al cerrar modal
    const openModal = () => {
        setModalZoom(1.8);
        setModalPan({ x: 0, y: 0 });
        setIsModalOpen(true);
    };

    return (
        <>
            {/* Galería con miniaturas estrictamente a la izquierda */}
            <div className="flex flex-row items-start gap-3 sm:gap-4 lg:gap-5">
                {/* 1. Columna de Miniaturas a la Izquierda */}
                {images.length > 0 && (
                    <div
                        className="flex w-16 sm:w-20 shrink-0 flex-col gap-2.5 max-h-[460px] overflow-y-auto no-scrollbar py-0.5"
                        role="tablist"
                        aria-label="Vistas del perfume"
                    >
                        {images.map((item, idx) => {
                            const isSelected = idx === selectedIndex;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setSelectedIndex(idx)}
                                    role="tab"
                                    aria-selected={isSelected}
                                    aria-label={`Ver ${item.label}`}
                                    className={`group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border-2 bg-white p-1 transition-all duration-200 ${
                                        isSelected
                                            ? 'border-gold shadow-sm ring-2 ring-gold/40 scale-102'
                                            : 'border-taupe/20 opacity-70 hover:opacity-100 hover:border-taupe/40'
                                    }`}
                                >
                                    <div
                                        className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-cream-light/40"
                                        style={item.cropZoom > 1 ? { transform: `scale(${item.cropZoom})` } : {}}
                                    >
                                        <img
                                            src={item.src}
                                            alt=""
                                            className="h-full w-full object-contain"
                                        />
                                    </div>

                                    {/* Etiqueta sutil */}
                                    <span className="absolute bottom-0.5 inset-x-0 bg-ink/75 py-0.5 text-center text-[8px] font-semibold uppercase text-gold-light opacity-0 transition-opacity group-hover:opacity-100">
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* 2. Contenedor de la Imagen Principal con Lupa de Acercamiento */}
                <div className="relative flex-1">
                    <div
                        ref={imageContainerRef}
                        onMouseEnter={() => setIsHoverZooming(true)}
                        onMouseLeave={() => setIsHoverZooming(false)}
                        onMouseMove={handleMouseMove}
                        onClick={openModal}
                        className="group relative flex aspect-square w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-2xl border border-taupe/15 bg-white p-6 shadow-xs transition-shadow duration-300 hover:shadow-lg"
                        title="Toca o haz clic para acercar con la lupa"
                    >
                        {/* Botón flotante indicador de lupa de acercamiento */}
                        <div className="pointer-events-none absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-taupe/20 bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-md backdrop-blur-sm transition-transform group-hover:scale-105 group-hover:border-gold">
                            <HiMagnifyingGlassPlus className="h-4 w-4 text-gold-dark" />
                            <span className="text-[11px] uppercase tracking-wider font-bold">Acercar</span>
                        </div>

                        {/* Imagen con zoom interactivo en cursor */}
                        {activeItem?.src ? (
                            <div
                                className="relative flex h-full w-full items-center justify-center transition-transform duration-150 ease-out"
                                style={{
                                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                                    transform: isHoverZooming
                                        ? `scale(${Math.max(2.2, (activeItem.cropZoom || 1) * 2)})`
                                        : activeItem.cropZoom > 1
                                        ? `scale(${activeItem.cropZoom})`
                                        : 'scale(1)',
                                }}
                            >
                                <img
                                    src={activeItem.src}
                                    alt={product.name}
                                    className="max-h-full max-w-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.25)] select-none"
                                />
                            </div>
                        ) : (
                            <BottleArt product={product} className="h-4/5 w-auto drop-shadow-xl" />
                        )}

                        {/* Pista táctil para móviles en la parte inferior */}
                        <div className="pointer-events-none absolute bottom-3 inset-x-0 flex justify-center opacity-80 transition group-hover:opacity-100 sm:hidden">
                            <span className="rounded-full bg-ink/75 px-3 py-1 text-[10px] font-medium text-cream-light backdrop-blur-sm">
                                🔍 Toca para ampliar con la lupa
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Modal de Lupa Interactiva en Pantalla Completa */}
            {isModalOpen && activeItem?.src && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 backdrop-blur-md"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Acercamiento de ${product.name}`}
                    onClick={() => setIsModalOpen(false)}
                >
                    {/* Barra de Controles de la Lupa */}
                    <div
                        className="absolute top-5 z-20 flex items-center gap-2 rounded-full border border-gold/30 bg-ink/90 px-4 py-2 shadow-2xl backdrop-blur-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="text-xs font-semibold text-gold-light pr-2 border-r border-taupe/30">
                            🔍 Lupa de aumento
                        </span>

                        <button
                            type="button"
                            onClick={() => setModalZoom((prev) => Math.min(3.5, prev + 0.4))}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-cream hover:bg-white/10 hover:text-gold transition active:scale-90"
                            aria-label="Acercar más"
                            title="Acercar"
                        >
                            <HiMagnifyingGlassPlus className="h-5 w-5" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setModalZoom((prev) => Math.max(1, prev - 0.4))}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-cream hover:bg-white/10 hover:text-gold transition active:scale-90"
                            aria-label="Alejar"
                            title="Alejar"
                        >
                            <HiMagnifyingGlassMinus className="h-5 w-5" />
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setModalZoom(1);
                                setModalPan({ x: 0, y: 0 });
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-cream hover:bg-white/10 hover:text-gold transition active:scale-90"
                            aria-label="Restablecer tamaño"
                            title="100%"
                        >
                            <HiArrowPath className="h-4 w-4" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-cream hover:bg-gold hover:text-ink transition active:scale-90"
                            aria-label="Cerrar lupa"
                            title="Cerrar (Esc)"
                        >
                            <HiXMark className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Área de la imagen ampliada con arrastre libre */}
                    <div
                        className="relative flex h-[85vh] w-[90vw] max-w-4xl cursor-grab items-center justify-center active:cursor-grabbing"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={handleModalMouseDown}
                        onMouseMove={handleModalMouseMove}
                        onMouseUp={handleModalMouseUp}
                    >
                        <img
                            src={activeItem.src}
                            alt={product.name}
                            draggable={false}
                            className="max-h-full max-w-full select-none object-contain drop-shadow-2xl transition-transform duration-100 ease-out"
                            style={{
                                transform: `translate(${modalPan.x}px, ${modalPan.y}px) scale(${modalZoom})`,
                            }}
                        />
                    </div>

                    {/* Miniaturas dentro del modal para alternar ángulos rápidamente */}
                    {images.length > 1 && (
                        <div
                            className="absolute bottom-6 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-ink/80 p-1.5 backdrop-blur-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {images.map((img, idx) => (
                                <button
                                    key={img.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedIndex(idx);
                                        setModalPan({ x: 0, y: 0 });
                                    }}
                                    className={`relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 transition ${
                                        idx === selectedIndex ? 'border-gold ring-1 ring-gold scale-105' : 'border-white/20 opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    <img src={img.src} alt="" className="h-full w-full object-contain p-1" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
