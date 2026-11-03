import { Link } from 'react-router-dom';
import Monogram from '@/presentation/components/brand/Monogram.jsx';

export default function NotFound() {
    return (
        <div className="container-luxe flex flex-col items-center py-32 text-center">
            <Monogram className="h-20 w-auto" />
            <p className="eyebrow mt-8 text-taupe">Error 404</p>
            <h1 className="mt-3 text-4xl sm:text-5xl">Esta esencia no existe</h1>
            <p className="mt-4 text-taupe">La página que buscas no está disponible.</p>
            <Link to="/" className="btn-dark mt-10">Volver al inicio</Link>
        </div>
    );
}
