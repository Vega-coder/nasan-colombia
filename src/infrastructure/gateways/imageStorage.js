// Implementaciones de ImageStorage.

const MAX_BYTES = 5 * 1024 * 1024;

const assertImage = (file) => {
    if (!file?.type?.startsWith('image/')) throw new Error('El archivo debe ser una imagen');
    if (file.size > MAX_BYTES) throw new Error('La imagen no puede pesar más de 5 MB');
};

/** Sube a Supabase Storage (bucket `product-images`, ver supabase/schema.sql). */
export const createSupabaseImageStorage = (supabase, bucket = 'product-images') => ({
    upload: async (file) => {
        assertImage(file);
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '31536000', contentType: file.type });
        if (error) throw error;
        return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    },
});

/**
 * Modo demo: reduce la imagen y la guarda como data URL dentro del producto (localStorage).
 * Se redimensiona a 800px para no agotar la cuota del navegador.
 */
export const createDataUrlImageStorage = (maxSize = 800) => ({
    upload: async (file) => {
        assertImage(file);
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.82);
    },
});
