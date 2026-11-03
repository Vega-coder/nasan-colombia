import { describe, it, expect } from 'vitest';
import { makeGetBrandsCatalog, makeGetBrandDetail } from '@/application/catalog/catalogUseCases.js';
import { createInMemoryProductRepository } from '@/infrastructure/repositories/inMemoryProductRepository.js';
import { SEED_PRODUCTS } from '@/infrastructure/data/seedProducts.js';

describe('Marcas Use Cases', () => {
    const productRepository = createInMemoryProductRepository(SEED_PRODUCTS);
    const getBrandsCatalog = makeGetBrandsCatalog({ productRepository });
    const getBrandDetail = makeGetBrandDetail({ productRepository });

    it('returns brands catalog without errors', async () => {
        const result = await getBrandsCatalog();
        expect(result.brands.length).toBeGreaterThan(0);
    });

    it('returns brand detail without errors', async () => {
        const result = await getBrandDetail('nasan');
        expect(result.brand).not.toBeNull();
    });
});
