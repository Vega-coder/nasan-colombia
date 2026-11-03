import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlineEye, HiOutlineEyeSlash, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import { adminUseCases } from '@/infrastructure/container.js';
import { formatMoney } from '@/domain/shared/money.js';
import { getFinalPrice, LOW_STOCK_THRESHOLD } from '@/domain/catalog/product.js';
import { matchesQuery } from '@/domain/catalog/filters.js';
import { useAsync } from '@/presentation/hooks/useAsync.js';
import Swal, { toast, alertError } from '@/presentation/utils/swal.js';
import ProductImage from '@/presentation/components/product/ProductImage.jsx';
import { PageHeader } from '@/presentation/components/admin/AdminUi.jsx';

export default function AdminProducts() {
    const [version, setVersion] = useState(0);
    const [query, setQuery] = useState('');
    const { data: products, loading, error } = useAsync(() => adminUseCases.listProducts(), [version]);
    const reload = () => setVersion((v) => v + 1);

    const handleToggle = async (product) => {
        try {
            await adminUseCases.toggleProductActive(product.id);
            toast(product.isActive ? 'Producto oculto de la tienda' : 'Producto visible en la tienda');
            reload();
        } catch (err) {
            alertError('No se pudo actualizar', err.message);
        }
    };

    const handleDelete = async (product) => {
        const { isConfirmed } = await Swal.fire({
            icon: 'warning',
            title: `¿Eliminar ${product.name}?`,
            text: 'Esta acción no se puede deshacer. Si el producto tiene pedidos, solo se ocultará de la tienda.',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            iconColor: '#C6A15B',
        });
        if (!isConfirmed) return;
        try {
            const { archived } = await adminUseCases.deleteProduct(product.id);
            toast(archived ? 'Tenía pedidos: se ocultó de la tienda' : 'Producto eliminado');
            reload();
        } catch (err) {
            alertError('No se pudo eliminar', err.message);
        }
    };

    const visible = (products ?? []).filter((p) => matchesQuery(p, query));

    return (
        <>
            <PageHeader title="Productos" subtitle={products ? `${products.length} en el catálogo` : ''}>
                <Link to="/admin/productos/nuevo" className="btn-dark">Nuevo producto</Link>
            </PageHeader>

            <div className="relative mb-6 max-w-sm">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, marca o nota…" className="input pr-10" aria-label="Buscar productos" />
                <HiOutlineMagnifyingGlass className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-taupe" />
            </div>

            {loading && <p className="text-taupe">Cargando productos…</p>}
            {error && <p className="text-red-800">No se pudieron cargar los productos: {error.message}</p>}

            {!loading && !error && (
                <div className="overflow-x-auto bg-white ring-1 ring-taupe/10">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="border-b border-taupe/15 text-[10px] uppercase tracking-[0.15em] text-taupe">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Producto</th>
                                <th className="px-4 py-3 font-semibold">Precio</th>
                                <th className="px-4 py-3 font-semibold">Envío</th>
                                <th className="px-4 py-3 font-semibold">Stock</th>
                                <th className="px-4 py-3 font-semibold">Estado</th>
                                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-taupe/10">
                            {visible.map((p) => (
                                <tr key={p.id} className={p.isActive ? '' : 'opacity-60'}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <ProductImage product={p} className="h-14 w-12 shrink-0" />
                                            <div>
                                                <p className="text-[10px] uppercase tracking-[0.15em] text-taupe">{p.brand}</p>
                                                <Link to={`/admin/productos/${p.id}`} className="font-display text-base hover:text-gold-dark">{p.name}</Link>
                                                {p.volumeMl && <span className="ml-2 text-xs text-taupe">{p.volumeMl} ml</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {formatMoney(getFinalPrice(p))}
                                        {p.discountPercent > 0 && <span className="ml-2 text-xs text-gold-dark">-{p.discountPercent}%</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        {p.hasFreeShipping || !p.shippingCost || p.shippingCost === 0 ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                                                🚚 Gratis
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-ink">
                                                📦 {formatMoney(p.shippingCost)}
                                            </span>
                                        )}
                                    </td>
                                    <td className={`px-4 py-3 ${p.stock === 0 ? 'font-semibold text-red-800' : p.stock <= LOW_STOCK_THRESHOLD ? 'text-gold-dark' : ''}`}>
                                        {p.stock}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs ${p.isActive ? 'text-emerald-700' : 'text-taupe'}`}>{p.isActive ? 'Visible' : 'Oculto'}</span>
                                        {p.isFeatured && <span className="ml-2 text-xs text-gold-dark">★ Destacado</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => handleToggle(p)} className="p-2 text-taupe hover:text-ink" title={p.isActive ? 'Ocultar de la tienda' : 'Mostrar en la tienda'} aria-label={p.isActive ? `Ocultar ${p.name}` : `Mostrar ${p.name}`}>
                                                {p.isActive ? <HiOutlineEye className="h-5 w-5" /> : <HiOutlineEyeSlash className="h-5 w-5" />}
                                            </button>
                                            <Link to={`/admin/productos/${p.id}`} className="p-2 text-taupe hover:text-ink" title="Editar" aria-label={`Editar ${p.name}`}>
                                                <HiOutlinePencilSquare className="h-5 w-5" />
                                            </Link>
                                            <button onClick={() => handleDelete(p)} className="p-2 text-taupe hover:text-red-800" title="Eliminar" aria-label={`Eliminar ${p.name}`}>
                                                <HiOutlineTrash className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {visible.length === 0 && <p className="p-6 text-center text-sm text-taupe">No hay productos que coincidan.</p>}
                </div>
            )}
        </>
    );
}
