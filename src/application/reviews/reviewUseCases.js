// Casos de uso de reseñas y calificaciones de productos.
// Aplica la restricción de negocio: los usuarios invitados o no registrados no pueden comentar ni puntuar productos.

/**
 * @param {{ reviewRepository: any, authGateway: any }} deps
 */
export const makeSubmitProductReview = ({ reviewRepository, authGateway }) => async (reviewData) => {
    // 1. Validar que el usuario esté autenticado (no invitado ni anónimo)
    const currentUser = await authGateway.getCurrentUser();
    if (!currentUser) {
        throw new Error('Debes iniciar sesión o registrarte para comentar y calificar productos.');
    }

    const cleanAuthor = (reviewData?.author || currentUser.fullName || 'Cliente verificado').trim();
    const cleanComment = reviewData?.comment?.trim();
    const rating = Number(reviewData?.rating);

    if (!cleanComment) {
        throw new Error('El comentario no puede estar vacío');
    }

    if (!rating || rating < 1 || rating > 5) {
        throw new Error('La calificación debe estar entre 1 y 5 estrellas');
    }

    return reviewRepository.create({
        ...reviewData,
        userId: currentUser.id,
        author: cleanAuthor,
        rating,
        comment: cleanComment,
        city: reviewData?.city || 'Colombia',
        title: reviewData?.title?.trim() || 'Excelente fragancia',
        longevity: reviewData?.longevity || 'Más de 10 horas',
        sillage: reviewData?.sillage || 'Pesada',
    });
};
