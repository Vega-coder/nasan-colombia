// Muestra la foto real del equipo / herramienta de NASAN Colombia.
export default function ProductImage({ product, className = '', artClassName = 'h-4/5 w-auto' }) {
    // Si hay varias imágenes, la primera suele ser el póster oficial o la foto principal
    const image = product.images?.[0] ?? product.image;
    return (
        <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200/80 ${className}`}>
            {image ? (
                <img
                    src={image}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                />
            ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-teal-800">
                    <span className="font-display font-bold text-xl">{product.name}</span>
                    <span className="text-xs text-slate-500 uppercase mt-1">NASAN Colombia</span>
                </div>
            )}
        </div>
    );
}
