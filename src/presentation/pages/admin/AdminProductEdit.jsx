import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { HiArrowLongLeft } from 'react-icons/hi2';
import { adminUseCases } from '@/infrastructure/container.js';
import { getAvailableBrands, matchesAroma } from '@/domain/catalog/filters.js';
import { AROMAS } from '@/domain/catalog/aromas.js';
import { useAsync } from '@/presentation/hooks/useAsync.js';
import { toast, alertError } from '@/presentation/utils/swal.js';
import ProductForm from '@/presentation/components/admin/ProductForm.jsx';
import { PageHeader } from '@/presentation/components/admin/AdminUi.jsx';

const EMPTY = {
    name: '', brand: '', description: '', gender: 'unisex', type: 'fragancia', concentration: 'edp', volumeMl: '100',
    price: '', discountPercent: '0', stock: '0',
    hasFreeShipping: false, shippingCost: '',
    aromas: [],
    notes: '', topNotes: '', heartNotes: '', baseNotes: '', images: [],
    palette: { from: '#E9CF97', to: '#B98C45', liquid: '#D9A955' },
    isActive: true, isFeatured: false, isNew: true,
};

// Convierte la entidad al formato del formulario (números como texto, notas como lista separada por comas).
const toFormValues = (p) => {
    const rawAromas = Array.isArray(p.aromas) && p.aromas.length > 0
        ? p.aromas
        : AROMAS.filter((a) => matchesAroma(p, a.slug)).map((a) => a.slug);

    const cleanNotes = (p.notes || []).filter((n) => {
        if (typeof n !== 'string') return false;
        if (n.startsWith('aroma:')) return false;
        const isAromaName = AROMAS.some((a) => a.name.toLowerCase() === n.toLowerCase() || a.slug === n.toLowerCase());
        return !isAromaName;
    });

    return {
        ...EMPTY,
        ...p,
        volumeMl: p.volumeMl ?? '',
        price: String(p.price),
        discountPercent: String(p.discountPercent),
        stock: String(p.stock),
        hasFreeShipping: Boolean(p.hasFreeShipping),
        shippingCost: p.shippingCost != null && p.shippingCost !== 0 ? String(p.shippingCost) : '',
        notes: cleanNotes.join(', '),
        topNotes: (p.topNotes || []).join(', '),
        heartNotes: (p.heartNotes || []).join(', '),
        baseNotes: (p.baseNotes || []).join(', '),
        concentration: p.concentration ?? '',
        aromas: rawAromas,
    };
};

export default function AdminProductEdit() {
    const { id } = useParams();
    const isNew = !id;
    const { data, loading } = useAsync(
        async () => {
            const [product, all] = await Promise.all([isNew ? null : adminUseCases.getProduct(id), adminUseCases.listProducts()]);
            return { product, brands: getAvailableBrands(all) };
        },
        [id],
    );

    if (loading) return <p className="text-taupe">Cargando…</p>;
    if (!isNew && !data?.product) {
        return (
            <div>
                <p>Producto no encontrado.</p>
                <Link to="/admin/productos" className="btn-outline mt-4">Volver</Link>
            </div>
        );
    }

    // key reinicia el estado del formulario al cambiar de producto.
    return <Editor key={id ?? 'new'} initial={isNew ? EMPTY : toFormValues(data.product)} brands={data.brands} isNew={isNew} />;
}

function Editor({ initial, brands, isNew }) {
    const navigate = useNavigate();
    const [values, setValues] = useState(initial);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const handleChange = (patch) => {
        setValues((v) => ({ ...v, ...patch }));
        const touched = Object.keys(patch);
        if (touched.some((k) => errors[k])) setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !touched.includes(k))));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await adminUseCases.saveProduct(values);
            toast(isNew ? 'Producto creado' : 'Cambios guardados');
            navigate('/admin/productos');
        } catch (err) {
            if (err.fields) setErrors(err.fields);
            else alertError('No se pudo guardar', err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Link to="/admin/productos" className="mb-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-taupe hover:text-ink">
                <HiArrowLongLeft className="h-4 w-4" /> Productos
            </Link>
            <PageHeader title={isNew ? 'Nuevo producto' : `Editar ${initial.name}`} />
            {Object.keys(errors).length > 0 && (
                <p className="mb-4 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">Revisa los campos marcados en rojo.</p>
            )}
            <ProductForm
                values={values}
                errors={errors}
                brands={brands}
                onChange={handleChange}
                onSubmit={handleSubmit}
                saving={saving}
                onCancel={() => navigate('/admin/productos')}
            />
        </>
    );
}
