import { Link } from 'react-router-dom';
import { FaInstagram, FaTiktok, FaWhatsapp, FaFacebookF } from 'react-icons/fa6';
import Monogram from '@/presentation/components/brand/Monogram.jsx';
import { CATEGORIES } from '@/domain/catalog/categories.js';
import { STORE_WHATSAPP } from '@/infrastructure/container.js';

export default function Footer() {
    return (
        <footer className="bg-slate-950 text-slate-400 border-t border-slate-800">
            <div className="container-luxe grid gap-12 py-16 md:grid-cols-4">
                <div className="md:col-span-2">
                    <div className="flex items-center gap-4">
                        <Monogram className="h-14 w-auto sm:h-16" />
                        <div>
                            <p className="font-display text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">
                                NASAN COLOMBIA
                            </p>
                            <p className="font-serif italic text-sm text-teal-400 font-semibold">
                                By: Jordan Duran · @nasancolombia
                            </p>
                        </div>
                    </div>
                    <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
                        Distribuidor oficial de maquinaria, insumos y herramientas especializadas para laboratorios de remanufactura y reparación de pantallas celulares en Colombia.
                    </p>
                    <div className="mt-6 flex gap-4 text-slate-300">
                        <a href="https://instagram.com/nasancolombia" target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-teal-400 transition text-lg"><FaInstagram /></a>
                        <a href="https://tiktok.com/@nasancolombia" target="_blank" rel="noreferrer" aria-label="TikTok" className="hover:text-teal-400 transition text-lg"><FaTiktok /></a>
                        <a href="https://facebook.com/nasancolombia" target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-teal-400 transition text-lg"><FaFacebookF /></a>
                        <a href={`https://wa.me/${STORE_WHATSAPP}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="hover:text-teal-400 transition text-lg"><FaWhatsapp /></a>
                    </div>
                </div>

                <div>
                    <p className="font-display text-xs font-bold uppercase tracking-wider text-white">Catálogo</p>
                    <ul className="mt-5 space-y-3 text-sm">
                        <li><Link to="/tienda" className="hover:text-teal-400 text-teal-400 font-medium">Todos los Equipos</Link></li>
                        {CATEGORIES.map((c) => (
                            <li key={c.slug}><Link to={`/tienda/${c.slug}`} className="hover:text-teal-400">{c.label}</Link></li>
                        ))}
                    </ul>
                </div>

                <div>
                    <p className="font-display text-xs font-bold uppercase tracking-wider text-white">Respaldo & Soporte</p>
                    <ul className="mt-5 space-y-3 text-sm">
                        <li className="text-slate-300">Garantía directa de fábrica 1 año</li>
                        <li className="text-slate-300">Soporte técnico y repuestos originales</li>
                        <li className="text-slate-300">Envíos asegurados a toda Colombia</li>
                        <li><Link to="/favoritos" className="hover:text-teal-400">Mis Favoritos</Link></li>
                        <li><Link to="/terminos" className="hover:text-teal-400">Términos y Políticas de Garantía</Link></li>
                        <li>
                            <a
                                href={`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent('Hola NASAN Colombia, quiero asesoría técnica especializada ⚡')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 font-medium text-teal-400 hover:text-cyan-300 transition"
                            >
                                <FaWhatsapp className="h-4 w-4 shrink-0" />
                                <span>WhatsApp: Soporte Técnico</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-slate-900 py-6 text-center text-xs text-slate-400">
                <p>© {new Date().getFullYear()} NASAN Colombia By: Jordan Duran (@nasancolombia). Todos los derechos reservados.</p>
            </div>
        </footer>
    );
}
