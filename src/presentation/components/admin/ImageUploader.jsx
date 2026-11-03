import { useRef, useState } from 'react';
import { HiOutlinePhoto, HiOutlineXMark, HiOutlineArrowUpTray } from 'react-icons/hi2';
import { adminUseCases } from '@/infrastructure/container.js';

// Lista de imágenes del producto: subir archivos, pegar una URL, quitar y elegir la principal.
export default function ImageUploader({ images, onChange }) {
    const fileRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');

    const handleFiles = async (files) => {
        setError('');
        setUploading(true);
        try {
            const uploaded = [];
            for (const file of files) uploaded.push(await adminUseCases.uploadImage(file));
            onChange([...images, ...uploaded]);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const addUrl = () => {
        const clean = url.trim();
        if (!/^https?:\/\//.test(clean)) {
            setError('La URL debe empezar por http:// o https://');
            return;
        }
        onChange([...images, clean]);
        setUrl('');
        setError('');
    };

    const makeMain = (index) => onChange([images[index], ...images.filter((_, i) => i !== index)]);

    return (
        <div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((src, i) => (
                    <div key={`${i}-${src.slice(-24)}`} className="group relative aspect-square overflow-hidden bg-cream ring-1 ring-taupe/15">
                        <img src={src} alt={`Imagen ${i + 1}`} className="h-full w-full object-cover" />
                        {i === 0 ? (
                            <span className="absolute bottom-1 left-1 bg-ink px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-gold">Principal</span>
                        ) : (
                            <button type="button" onClick={() => makeMain(i)} className="absolute bottom-1 left-1 bg-white/90 px-1.5 py-0.5 text-[9px] uppercase tracking-wider opacity-0 transition group-hover:opacity-100">
                                Hacer principal
                            </button>
                        )}
                        <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} className="absolute right-1 top-1 bg-white/90 p-1 hover:text-red-800" aria-label={`Quitar imagen ${i + 1}`}>
                            <HiOutlineXMark className="h-4 w-4" />
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex aspect-square flex-col items-center justify-center gap-2 border border-dashed border-taupe/40 text-xs text-taupe hover:border-gold hover:text-gold-dark disabled:opacity-50"
                >
                    {uploading ? 'Subiendo…' : <><HiOutlineArrowUpTray className="h-6 w-6" /> Subir fotos</>}
                </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles([...e.target.files])} />

            <div className="mt-3 flex gap-2">
                <div className="relative flex-1">
                    <HiOutlinePhoto className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-taupe" />
                    <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…o pega la URL de una imagen" className="input py-2 pl-9 text-xs" />
                </div>
                <button type="button" onClick={addUrl} className="btn-outline px-4 py-2">Agregar</button>
            </div>
            {error && <p className="mt-2 text-xs text-red-800">{error}</p>}
            {images.length === 0 && <p className="mt-2 text-xs text-taupe">Sin fotos, la tienda muestra la ilustración del frasco con los colores elegidos.</p>}
        </div>
    );
}
