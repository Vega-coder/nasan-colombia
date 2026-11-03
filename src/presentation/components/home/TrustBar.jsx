import { HiOutlineShieldCheck, HiOutlineTruck, HiOutlineCreditCard, HiOutlineSparkles } from 'react-icons/hi2';

const ITEMS = [
    {
        icon: HiOutlineShieldCheck,
        title: '100% Originales',
        text: 'Importados directos con batch code y sello',
    },
    {
        icon: HiOutlineTruck,
        title: 'Envíos 24/48h',
        text: 'Despacho seguro y asegurado a todo el país',
    },
    {
        icon: HiOutlineSparkles,
        title: 'Asesoría Experta',
        text: 'Orientación olfativa personalizada por WhatsApp',
    },
    {
        icon: HiOutlineCreditCard,
        title: 'Pago 100% Seguro',
        text: 'Wompi, Tarjetas, PSE y Nequi',
    },
];

export default function TrustBar() {
    return (
        <section className="border-b border-taupe/15 bg-white">
            <ul className="container-luxe grid grid-cols-2 gap-3 py-6 sm:py-8 lg:grid-cols-4 lg:gap-6">
                {ITEMS.map(({ icon: Icon, title, text }) => (
                    <li
                        key={title}
                        className="group flex items-center gap-3.5 rounded-xl p-2.5 transition-all duration-300 hover:bg-cream-light/70 hover:-translate-y-1 hover:shadow-sm"
                    >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream/60 transition-all duration-300 group-hover:bg-gold/20 group-hover:scale-110 group-hover:rotate-6">
                            <Icon className="h-6 w-6 text-gold-dark transition-colors duration-300 group-hover:text-gold" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ink transition-colors duration-300 group-hover:text-gold-dark">
                                {title}
                            </p>
                            <p className="text-xs text-taupe">{text}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
