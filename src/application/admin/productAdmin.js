// Casos de uso de administración del catálogo.
import { createProduct, slugify, validateProductInput } from '@/domain/catalog/product.js';

const toNumberOrNull = (value) => (value === '' || value == null ? null : Number(value));

const toList = (value) =>
    Array.isArray(value) ? value.filter(Boolean) : String(value ?? '').split(',').map((s) => s.trim()).filter(Boolean);

/** @param {{ productRepository: import('../ports.js').ProductRepository }} deps */
export const makeListProductsForAdmin = ({ productRepository }) => async () => {
    const products = await productRepository.findAllForAdmin();
    return [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

/** @param {{ productRepository: import('../ports.js').ProductRepository }} deps */
export const makeGetProductForAdmin = ({ productRepository }) => (id) => productRepository.findById(id);

/**
 * Crea o actualiza un producto desde el formulario de admin.
 * Lanza un error con `fields` si la validación falla, o si el slug ya existe en otro producto.
 * @param {{ productRepository: import('../ports.js').ProductRepository, clock?: () => Date }} deps
 */
export const makeSaveProduct = ({ productRepository, clock = () => new Date() }) => async (input) => {
    const errors = validateProductInput(input);
    if (Object.keys(errors).length) {
        const error = new Error('Revisa los campos marcados');
        error.fields = errors;
        throw error;
    }

    const existing = input.id ? await productRepository.findById(input.id) : null;
    const slug = slugify(`${input.brand} ${input.name}${input.volumeMl ? ` ${input.volumeMl}` : ''}`);
    const all = await productRepository.findAllForAdmin();
    const clash = all.find((p) => p.slug === slug && p.id !== existing?.id);
    if (clash) {
        const error = new Error('Ya existe un producto con esa marca, nombre y tamaño');
        error.fields = { name: 'Producto duplicado' };
        throw error;
    }

    const product = createProduct({
        ...input,
        id: existing?.id ?? slug,
        // Conservamos el slug original para no romper enlaces ya compartidos.
        slug: existing?.slug ?? slug,
        price: Number(input.price),
        discountPercent: Number(input.discountPercent || 0),
        stock: Number(input.stock),
        volumeMl: toNumberOrNull(input.volumeMl),
        concentration: input.concentration || null,
        hasFreeShipping: Boolean(input.hasFreeShipping),
        shippingCost: Boolean(input.hasFreeShipping) ? 0 : (input.shippingCost === '' || input.shippingCost == null ? 0 : Math.max(0, Number(input.shippingCost) || 0)),
        notes: toList(input.notes),
        topNotes: toList(input.topNotes),
        heartNotes: toList(input.heartNotes),
        baseNotes: toList(input.baseNotes),
        aromas: Array.isArray(input.aromas) ? input.aromas : toList(input.aromas),
        images: toList(input.images),
        createdAt: existing?.createdAt ?? clock().toISOString(),
    });

    return productRepository.save(product);
};

/** @param {{ productRepository: import('../ports.js').ProductRepository }} deps */
export const makeDeleteProduct = ({ productRepository }) => (id) => productRepository.remove(id);

/** Activa o desactiva un producto en la tienda sin borrarlo. */
export const makeToggleProductActive = ({ productRepository }) => async (id) => {
    const product = await productRepository.findById(id);
    if (!product) throw new Error('Producto no encontrado');
    return productRepository.save({ ...product, isActive: !product.isActive });
};
