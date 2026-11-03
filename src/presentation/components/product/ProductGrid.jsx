import ProductCard from './ProductCard.jsx';

export default function ProductGrid({ products, columns = 'lg:grid-cols-4' }) {
    return (
        <div className={`grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 ${columns}`}>
            {products.map((p) => (
                <ProductCard key={p.id} product={p} />
            ))}
        </div>
    );
}

export function ProductGridSkeleton({ count = 4 }) {
    return (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="aspect-[4/5] bg-cream rounded-sm border border-ink/10" />
                    <div className="mt-4 h-3 w-1/3 bg-cream" />
                    <div className="mt-2 h-4 w-2/3 bg-cream" />
                </div>
            ))}
        </div>
    );
}
