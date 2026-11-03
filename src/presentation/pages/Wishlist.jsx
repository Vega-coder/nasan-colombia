import { Link } from 'react-router-dom';
import { HiOutlineHeart, HiOutlineTrash, HiOutlineShare } from 'react-icons/hi2';
import { useWishlist } from '@/presentation/context/WishlistContext.jsx';
import ProductGrid from '@/presentation/components/product/ProductGrid.jsx';
import { toast } from '@/presentation/utils/swal.js';

export default function Wishlist() {
    const { items, count, clearWishlist } = useWishlist();

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(url);
                toast('Enlace de tu lista de deseos copiado al portapapeles', 'success');
            } catch {
                toast('No se pudo copiar el enlace', 'info');
            }
        }
    };

    return (
        <div className="container-luxe py-12">
            <header className="mb-10 border-b border-taupe/15 pb-8 text-center">
                <p className="eyebrow text-gold-dark">Tu Colección Personal</p>
                <h1 className="mt-3 font-display text-4xl sm:text-5xl">Lista de Deseos</h1>
                <p className="mt-2 text-sm text-taupe">
                    {count === 0
                        ? 'Guarda las fragancias que más te apasionan para comprarlas cuando desees.'
                        : `Tienes ${count} ${count === 1 ? 'fragancia guardada' : 'fragancias guardadas'} en tu lista.`}
                </p>
            </header>

            {count === 0 ? (
                <div className="mx-auto flex max-w-md flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cream ring-1 ring-taupe/20">
                        <HiOutlineHeart className="h-10 w-10 text-taupe" />
                    </div>
                    <h2 className="mt-6 font-display text-2xl">Aún no has guardado favoritos</h2>
                    <p className="mt-2 text-sm text-taupe leading-relaxed">
                        Explora nuestra selección de perfumes árabes originales y haz clic en el corazón para agregarlos aquí.
                    </p>
                    <Link to="/tienda" className="btn-dark mt-8 px-8 py-3.5">
                        Explorar Catálogo
                    </Link>
                </div>
            ) : (
                <>
                    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-taupe/10 pb-4">
                        <p className="text-xs uppercase tracking-wider text-taupe">
                            Mostrando <strong className="text-ink">{count}</strong> {count === 1 ? 'producto' : 'productos'}
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-1.5 text-xs text-taupe hover:text-gold-dark transition"
                                title="Copiar enlace"
                            >
                                <HiOutlineShare className="h-4 w-4" />
                                <span>Compartir lista</span>
                            </button>
                            <span className="text-taupe/40">|</span>
                            <button
                                onClick={clearWishlist}
                                className="flex items-center gap-1.5 text-xs text-taupe hover:text-red-700 transition"
                            >
                                <HiOutlineTrash className="h-4 w-4" />
                                <span>Vaciar lista</span>
                            </button>
                        </div>
                    </div>

                    <ProductGrid products={items} columns="lg:grid-cols-4" />

                    <div className="mt-16 text-center border-t border-taupe/15 pt-10">
                        <Link to="/tienda" className="btn-outline px-8 py-3.5">
                            Continuar explorando perfumes
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}
