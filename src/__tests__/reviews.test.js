import { describe, it, expect, vi } from 'vitest';
import { makeSubmitProductReview } from '@/application/reviews/reviewUseCases.js';
import { createSupabaseReviewRepository } from '@/infrastructure/repositories/supabaseReviewRepository.js';

describe('Restricción de reseñas: solo usuarios registrados', () => {
    const mockReviewRepo = {
        create: vi.fn(async (data) => ({ id: 'rev-1', ...data })),
    };

    it('bloquea la creación de reseña o puntuación si el usuario es invitado o no está autenticado', async () => {
        const guestAuthGateway = {
            getCurrentUser: vi.fn(async () => null),
        };

        const submitReview = makeSubmitProductReview({
            reviewRepository: mockReviewRepo,
            authGateway: guestAuthGateway,
        });

        await expect(
            submitReview({
                productId: 'lattafa-asad-100',
                rating: 5,
                comment: 'Excelente aroma',
            })
        ).rejects.toThrow('Debes iniciar sesión o registrarte para comentar y calificar productos.');

        expect(mockReviewRepo.create).not.toHaveBeenCalled();
    });

    it('valida que el comentario y la calificación sean válidos antes de guardar', async () => {
        const userAuthGateway = {
            getCurrentUser: vi.fn(async () => ({
                id: 'usr-123',
                fullName: 'Andrés Gómez',
                email: 'andres@correo.com',
            })),
        };

        const submitReview = makeSubmitProductReview({
            reviewRepository: mockReviewRepo,
            authGateway: userAuthGateway,
        });

        // Comentario vacío
        await expect(
            submitReview({
                productId: 'lattafa-asad-100',
                rating: 5,
                comment: '   ',
            })
        ).rejects.toThrow('El comentario no puede estar vacío');

        // Rating inválido
        await expect(
            submitReview({
                productId: 'lattafa-asad-100',
                rating: 6,
                comment: 'Buen perfume',
            })
        ).rejects.toThrow('La calificación debe estar entre 1 y 5 estrellas');

        await expect(
            submitReview({
                productId: 'lattafa-asad-100',
                rating: 0,
                comment: 'Buen perfume',
            })
        ).rejects.toThrow('La calificación debe estar entre 1 y 5 estrellas');
    });

    it('permite guardar la reseña y puntuación cuando el usuario está registrado y autenticado', async () => {
        const userAuthGateway = {
            getCurrentUser: vi.fn(async () => ({
                id: 'usr-999',
                fullName: 'Valentina Restrepo',
                email: 'vale@correo.com',
            })),
        };

        const submitReview = makeSubmitProductReview({
            reviewRepository: mockReviewRepo,
            authGateway: userAuthGateway,
        });

        const result = await submitReview({
            productId: 'lattafa-yara-100',
            rating: 5,
            title: 'Huele increíble',
            comment: 'Fijación de más de 10 horas en mi piel, 100% original.',
        });

        expect(result).toMatchObject({
            productId: 'lattafa-yara-100',
            userId: 'usr-999',
            author: 'Valentina Restrepo',
            rating: 5,
            title: 'Huele increíble',
            comment: 'Fijación de más de 10 horas en mi piel, 100% original.',
        });
        expect(mockReviewRepo.create).toHaveBeenCalledTimes(1);
    });

    it('permite personalizar el nombre de autor si el usuario autenticado lo provee', async () => {
        const userAuthGateway = {
            getCurrentUser: vi.fn(async () => ({
                id: 'usr-999',
                fullName: 'Valentina Restrepo',
                email: 'vale@correo.com',
            })),
        };

        const submitReview = makeSubmitProductReview({
            reviewRepository: mockReviewRepo,
            authGateway: userAuthGateway,
        });

        const result = await submitReview({
            productId: 'lattafa-yara-100',
            author: 'Valen R.',
            rating: 4,
            comment: 'Gran perfume para regalar.',
        });

        expect(result.author).toBe('Valen R.');
        expect(result.userId).toBe('usr-999');
    });
});

describe('supabaseReviewRepository', () => {
    it('guarda en almacenamiento local en ausencia de Supabase', async () => {
        const store = new Map();
        const fakeStorage = {
            getItem: (k) => store.get(k) ?? null,
            setItem: (k, v) => store.set(k, String(v)),
        };

        const repo = createSupabaseReviewRepository(null, fakeStorage);
        const review = await repo.create({
            productId: 'test-product',
            author: 'Cliente Registrado',
            rating: 5,
            title: 'Excelente',
            comment: 'Muy buena fijación',
            userId: 'usr-123',
        });

        expect(review.author).toBe('Cliente Registrado');
        expect(review.rating).toBe(5);

        const list = await repo.findByProductId('test-product');
        expect(list.length).toBeGreaterThan(0);
        expect(list[0].comment).toBe('Muy buena fijación');
    });
});
