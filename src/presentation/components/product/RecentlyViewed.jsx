import { useState, useEffect } from 'react';
import SectionHeading from '@/presentation/components/ui/SectionHeading.jsx';
import ProductGrid from '@/presentation/components/product/ProductGrid.jsx';

const STORAGE_KEY = 'nasan_recently_viewed';
const MAX_STORED = 10;

export default function RecentlyViewed({ currentProduct }) {
    const [recentlyViewed, setRecentlyViewed] = useState([]);

    useEffect(() => {
        if (!currentProduct?.id) return;

        let items = [];
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                items = JSON.parse(raw);
            }
        } catch {
            items = [];
        }

        // Filtrar los que no sean el actual para mostrarlos en el historial
        const others = items.filter((p) => p.id !== currentProduct.id);
        setRecentlyViewed(others);

        // Guardar el actual al inicio de la lista
        const compactProduct = {
            id: currentProduct.id,
            slug: currentProduct.slug,
            name: currentProduct.name,
            brand: currentProduct.brand,
            gender: currentProduct.gender,
            concentration: currentProduct.concentration,
            volumeMl: currentProduct.volumeMl,
            price: currentProduct.price,
            discountPercent: currentProduct.discountPercent,
            stock: currentProduct.stock,
            images: currentProduct.images,
            palette: currentProduct.palette,
            notes: currentProduct.notes || [],
            isNew: currentProduct.isNew,
            isFeatured: currentProduct.isFeatured,
        };

        const updated = [compactProduct, ...items.filter((p) => p.id !== currentProduct.id)].slice(0, MAX_STORED);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
            // Ignorar
        }
    }, [currentProduct?.id]);

    if (!recentlyViewed.length) {
        return null;
    }

    return (
        <section className="border-t border-taupe/15 bg-cream/20 py-16 sm:py-20">
            <div className="container-luxe">
                <SectionHeading
                    eyebrow="Tu historial"
                    title="Vistos recientemente"
                />
                <ProductGrid products={recentlyViewed.slice(0, 4)} columns="lg:grid-cols-4" />
            </div>
        </section>
    );
}
