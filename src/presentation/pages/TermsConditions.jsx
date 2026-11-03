import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    HiOutlineShieldCheck,
    HiOutlineTruck,
    HiOutlineArrowPath,
    HiOutlineLockClosed,
    HiOutlineChatBubbleLeftRight,
    HiOutlineDocumentText,
    HiOutlineBuildingOffice2,
    HiOutlineEnvelope,
    HiOutlinePhone,
    HiOutlineClock,
    HiOutlineArrowUpRight,
} from 'react-icons/hi2';
import { FaWhatsapp } from 'react-icons/fa6';
import { STORE_WHATSAPP } from '@/infrastructure/container.js';

export default function TermsConditions() {
    const { hash } = useLocation();

    useEffect(() => {
        if (hash) {
            const target = document.querySelector(hash);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [hash]);

    const sellerInfo = {
        tradeName: 'Aroma Premium Store',
        owner: 'Rodrigo Andrés Picón Ovalle / Aroma Premium Store',
        nit: '1148441082-1 / 901.458.291-3',
        city: 'Ocaña, Norte de Santander, Colombia',
        address: 'Calle 1 # 29 A 40, Barrio El Lago Primera Etapa',
        email: 'contacto@aromapremium.co',
        phoneDisplay: '(+57) 314 616 0642',
        website: 'www.aromapremiumstore.com',
        hours: 'Lunes a Sábado de 8:00 a.m. a 7:00 p.m.',
    };

    const sections = [
        { id: 'terminos-generales', label: '1. Términos y Condiciones' },
        { id: 'politica-envios', label: '2. Envíos y Entregas' },
        { id: 'politica-garantias', label: '3. Cambios, Devoluciones y Garantías' },
        { id: 'politica-privacidad', label: '4. Privacidad y Tratamiento de Datos' },
        { id: 'atencion-cliente', label: '5. Atención al Cliente y Reclamaciones' },
    ];

    return (
        <div className="bg-cream-light/30 py-12 sm:py-16">
            <div className="container-luxe max-w-5xl">
                {/* Migas de pan */}
                <nav className="mb-6 text-[11px] uppercase tracking-[0.18em] text-taupe" aria-label="Ruta de navegación">
                    <Link to="/" className="hover:text-ink">Inicio</Link> /{' '}
                    <span className="text-ink">Términos, Condiciones y Políticas</span>
                </nav>

                {/* Encabezado Principal */}
                <header className="border-b border-taupe/15 pb-8">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-gold/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
                            AROMA PREMIUM STORE
                        </span>
                        <span className="text-xs text-taupe">· Colombia</span>
                    </div>
                    <h1 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl text-ink leading-tight">
                        Términos, condiciones y políticas comerciales
                    </h1>
                    <p className="mt-3 text-sm text-taupe">
                        Sitio web:{' '}
                        <a href="https://www.aromapremiumstore.com" className="font-semibold text-gold-dark hover:underline">
                            {sellerInfo.website}
                        </a>{' '}
                        · Última actualización: <strong>26 de octubre de 2026</strong>
                    </p>
                </header>

                {/* Barra de acceso rápido a secciones */}
                <nav className="my-8 rounded-xl border border-taupe/15 bg-white p-4 sm:p-6 shadow-xs">
                    <p className="eyebrow text-ink font-semibold tracking-[0.18em]">Índice de contenido legal</p>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                        {sections.map((s) => (
                            <li key={s.id}>
                                <a
                                    href={`#${s.id}`}
                                    className="flex items-center gap-1.5 text-taupe hover:text-gold-dark transition font-medium py-1"
                                >
                                    <span className="text-gold">§</span> {s.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Contenido Principal */}
                <article className="space-y-12 text-ink/90 leading-relaxed text-sm sm:text-base">

                    {/* SECCIÓN 1: TÉRMINOS Y CONDICIONES */}
                    <section id="terminos-generales" className="scroll-mt-24 rounded-2xl border border-taupe/15 bg-white p-6 sm:p-10 shadow-xs">
                        <div className="flex items-center gap-3 border-b border-taupe/15 pb-4">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
                                <HiOutlineDocumentText className="h-5 w-5" />
                            </span>
                            <div>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-gold-dark font-bold">Sección 1</span>
                                <h2 className="font-display text-2xl font-bold text-ink">Términos y Condiciones</h2>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            <h3 className="font-display text-lg font-semibold text-ink">Bienvenidos a Aroma Premium</h3>
                            <p>
                                En <strong>Aroma Premium Store</strong> nos especializamos en la comercialización de perfumes y fragancias, ofreciendo a nuestros clientes una experiencia de compra cómoda, segura y transparente.
                            </p>
                            <p>
                                Nuestro compromiso es brindar información clara sobre los productos, sus características, precios, disponibilidad y condiciones de compra.
                            </p>
                            <p>
                                Al realizar una compra a través de{' '}
                                <a href="https://www.aromapremiumstore.com" className="text-gold-dark hover:underline font-medium">
                                    www.aromapremiumstore.com
                                </a>
                                , el cliente acepta las condiciones comerciales aquí establecidas, sin perjuicio de los derechos reconocidos por la legislación colombiana (Ley 1480 de 2011 — Estatuto del Consumidor).
                            </p>

                            <div className="mt-6 rounded-xl border border-gold/30 bg-cream/30 p-5">
                                <h4 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-ink mb-3">
                                    <HiOutlineBuildingOffice2 className="h-4 w-4 text-gold-dark" /> Identificación del vendedor
                                </h4>
                                <dl className="grid gap-2 text-xs sm:grid-cols-2">
                                    <div>
                                        <dt className="text-taupe font-medium">Nombre comercial:</dt>
                                        <dd className="font-semibold text-ink">{sellerInfo.tradeName}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-taupe font-medium">Titular o razón social:</dt>
                                        <dd className="font-semibold text-ink">{sellerInfo.owner}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-taupe font-medium">NIT / Identificación tributaria:</dt>
                                        <dd className="font-semibold text-ink font-mono">{sellerInfo.nit}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-taupe font-medium">Domicilio principal:</dt>
                                        <dd className="font-semibold text-ink">{sellerInfo.city}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-taupe font-medium">Dirección de notificaciones:</dt>
                                        <dd className="font-semibold text-ink">{sellerInfo.address}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-taupe font-medium">Correo electrónico oficial:</dt>
                                        <dd className="font-semibold text-ink">
                                            <a href={`mailto:${sellerInfo.email}`} className="text-gold-dark hover:underline">
                                                {sellerInfo.email}
                                            </a>
                                        </dd>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <dt className="text-taupe font-medium">WhatsApp de atención oficial:</dt>
                                        <dd className="font-semibold text-gold-dark font-mono">
                                            <a
                                                href={`https://wa.me/${STORE_WHATSAPP}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 hover:underline"
                                            >
                                                <FaWhatsapp className="h-3.5 w-3.5" /> {sellerInfo.phoneDisplay}
                                            </a>
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <h3 className="font-display text-base font-semibold text-ink pt-4">Productos y disponibilidad</h3>
                            <p>
                                Los perfumes comercializados se presentan con información sobre marca, referencia, contenido, concentración y características relevantes (incluyendo pirámide olfativa y notas de salida, corazón y fondo).
                            </p>
                            <p>
                                La disponibilidad de cada producto estará indicada en tiempo real en el catálogo. En caso de agotamiento posterior a una compra, informaremos al cliente inmediatamente para ofrecerle las alternativas legalmente procedentes, como el reemplazo por otra referencia de su preferencia o la devolución inmediata de su dinero.
                            </p>
                            <p>
                                Las imágenes son ilustrativas y procuran representar fielmente los productos originales. Las características efectivas de cada referencia prevalecerán conforme a su descripción y etiquetado del fabricante.
                            </p>

                            <h3 className="font-display text-base font-semibold text-ink pt-4">Precios y pagos</h3>
                            <p>
                                Todos los precios se expresan en pesos colombianos (COP).
                            </p>
                            <p>
                                El valor total de la compra, los impuestos aplicables, los gastos de envío y cualquier cargo adicional se informarán de manera transparente antes de confirmar el pedido y proceder al pago.
                            </p>
                            <p>
                                Los pagos electrónicos se procesan a través de la pasarela certificada <strong>Wompi (Grupo Bancolombia)</strong> y los medios habilitados (Tarjetas de crédito/débito, PSE con todos los bancos colombianos, Nequi y Botón Bancolombia).
                            </p>
                            <div className="rounded-lg border border-red-200 bg-red-50/70 p-4 text-xs text-red-900">
                                <strong>⚠️ Aviso de seguridad:</strong> Aroma Premium Store nunca solicitará contraseñas bancarias, claves personales, códigos OTP ni información confidencial mediante llamadas, mensajes de texto o redes sociales.
                            </div>

                            <h3 className="font-display text-base font-semibold text-ink pt-4">Confirmación del pedido</h3>
                            <p>
                                Una vez registrada la compra, el cliente recibirá una confirmación con la información detallada de su pedido.
                            </p>
                            <p>
                                La confirmación de pago y el estado del pedido podrán consultarse en cualquier momento mediante los canales habilitados por la tienda o a través de la sección de seguimiento con su código único de pedido.
                            </p>
                        </div>
                    </section>

                    {/* SECCIÓN 2: POLÍTICA DE ENVÍOS Y ENTREGAS */}
                    <section id="politica-envios" className="scroll-mt-24 rounded-2xl border border-taupe/15 bg-white p-6 sm:p-10 shadow-xs">
                        <div className="flex items-center gap-3 border-b border-taupe/15 pb-4">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
                                <HiOutlineTruck className="h-5 w-5" />
                            </span>
                            <div>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-gold-dark font-bold">Sección 2</span>
                                <h2 className="font-display text-2xl font-bold text-ink">Política de Envíos y Entregas</h2>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            <p>
                                <strong>Aroma Premium Store</strong> realiza despachos de mercancía directamente desde <strong>Ocaña, Norte de Santander</strong>, hacia todos los destinos habilitados dentro del territorio nacional colombiano, utilizando transportadoras autorizadas y certificadas (Coordinadora Mercantil, Servientrega, Interrapidísimo, Envia.com).
                            </p>

                            <h3 className="font-display text-base font-semibold text-ink pt-2">Costos de envío</h3>
                            <p>
                                Los gastos de transporte se calcularán según el destino, peso y dimensiones del paquete y el servicio seleccionado. El costo correspondiente será informado de manera clara antes de que el cliente finalice su compra.
                            </p>

                            <h3 className="font-display text-base font-semibold text-ink pt-2">Tiempos de entrega</h3>
                            <p>
                                El plazo estimado o comprometido de entrega habitual es de <strong>24 a 48 horas hábiles</strong> para ciudades principales y de 3 a 5 días hábiles para trayectos especiales, el cual se informará al comprador antes de confirmar el pedido.
                            </p>
                            <p>
                                Los plazos podrán variar según el destino, cobertura de la transportadora y condiciones logísticas o de fuerza mayor, respetando en todo momento los derechos establecidos en la legislación colombiana.
                            </p>
                            <p>
                                Cuando no se haya acordado un plazo específico, se aplicará el término legal máximo supletorio de treinta (30) días calendario establecido en el Estatuto del Consumidor.
                            </p>

                            <h3 className="font-display text-base font-semibold text-ink pt-2">Seguimiento del pedido</h3>
                            <p>
                                Cuando la transportadora lo permita, el cliente recibirá un número de guía y enlace directo para consultar en línea el estado de su envío y el historial de trazabilidad de su paquete.
                            </p>

                            <h3 className="font-display text-base font-semibold text-ink pt-2">Novedades en la entrega</h3>
                            <p>
                                Si un pedido no puede entregarse dentro del plazo acordado, Aroma Premium Store informará oportunamente al comprador y gestionará la situación conforme a la ley.
                            </p>
                            <p>
                                En caso de incumplimiento injustificado del plazo de entrega o falta sobrevenida de disponibilidad, el consumidor podrá solicitar la terminación de la compra y el reembolso total de las sumas pagadas, sin descuentos ni retenciones, dentro del término legal máximo aplicable.
                            </p>

                            <h3 className="font-display text-base font-semibold text-ink pt-2">Productos dañados durante el transporte</h3>
                            <p>
                                Si el pedido llega con daños visibles, derrames, roturas de frasco o faltantes ocasionados durante el trayecto, recomendamos comunicarlo cuanto antes mediante nuestros canales oficiales de WhatsApp o correo electrónico, aportando fotografías o videos del estado del paquete cuando sea posible.
                            </p>
                            <p className="text-xs text-taupe italic">
                                * Nota legal: La ausencia de fotografías o de un reporte inmediato no elimina ni restringe los derechos legales del consumidor.
                            </p>
                        </div>
                    </section>

                    {/* SECCIÓN 3: CAMBIOS, DEVOLUCIONES Y GARANTÍAS */}
                    <section id="politica-garantias" className="scroll-mt-24 rounded-2xl border border-taupe/15 bg-white p-6 sm:p-10 shadow-xs">
                        <div className="flex items-center gap-3 border-b border-taupe/15 pb-4">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
                                <HiOutlineArrowPath className="h-5 w-5" />
                            </span>
                            <div>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-gold-dark font-bold">Sección 3</span>
                                <h2 className="font-display text-2xl font-bold text-ink">Política de Cambios, Devoluciones y Garantías</h2>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            <p>
                                En <strong>Aroma Premium Store</strong> buscamos que cada cliente reciba el producto solicitado con los más altos estándares de calidad y originalidad.
                            </p>

                            <div className="rounded-xl border border-gold/30 bg-gold/5 p-5">
                                <h3 className="font-display text-base font-bold text-ink">Derecho de Retracto (Artículo 47, Ley 1480 de 2011)</h3>
                                <p className="mt-2 text-xs sm:text-sm">
                                    En las compras realizadas por medios electrónicos o internet, el consumidor podrá ejercer el derecho de retracto dentro de los <strong>cinco (5) días hábiles</strong> siguientes a la fecha de entrega del producto, siempre que resulte legalmente procedente.
                                </p>
                                <p className="mt-2 text-xs sm:text-sm">
                                    Para solicitarlo, deberá comunicarse por los canales oficiales de atención (WhatsApp o correo) e identificar su número de pedido.
                                </p>
                                <p className="mt-2 text-xs sm:text-sm">
                                    Cuando proceda el retracto, el producto deberá devolverse en las mismas condiciones en que fue recibido, incluyendo su empaque original, celofán y sellos intactos. Los costos de transporte de la devolución estarán a cargo del consumidor, conforme a la ley.
                                </p>
                                <p className="mt-2 text-xs sm:text-sm font-semibold text-gold-dark">
                                    El reembolso total de las sumas pagadas se realizará dentro del plazo máximo legal de quince (15) días calendario a partir del momento en que el consumidor ejerza el derecho y devuelva el producto.
                                </p>
                            </div>

                            <h3 className="font-display text-base font-semibold text-ink pt-2">Condiciones especiales para perfumes y fragancias</h3>
                            <p>
                                Por tratarse de productos cosméticos y de aplicación personal íntima, las solicitudes relacionadas con perfumes <strong>abiertos, atomizados, utilizados, alterados o con sus sellos de seguridad originales removidos</strong> serán evaluadas teniendo en cuenta la naturaleza del producto y las excepciones legales aplicables al derecho de retracto (art. 47 num. 4 Ley 1480).
                            </p>
                            <p>
                                En ningún caso estas condiciones limitarán los derechos del consumidor cuando el producto presente defectos objetivos de calidad, falta de conformidad, daños de fábrica o incumplimiento de la garantía legal.
                            </p>

                            <h3 className="font-display text-base font-semibold text-ink pt-2">Garantía de originalidad y calidad</h3>
                            <p>
                                Todos los perfumes comercializados por Aroma Premium Store son <strong>100% originales</strong>, importados con número de lote (batch code) verificable y cuentan con las garantías legales correspondientes.
                            </p>
                            <p>El cliente podrá presentar reclamaciones de garantía por situaciones tales como:</p>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                <li>Producto diferente al solicitado en la orden.</li>
                                <li>Defectos de fabricación en atomizador, válvula o sellado.</li>
                                <li>Envase averiado, frasco defectuoso o derrames en tránsito.</li>
                                <li>Producto incompleto o en condiciones diferentes a las anunciadas.</li>
                            </ul>
                            <p>
                                Cada reclamación será evaluada con la mayor celeridad de conformidad con la garantía legal y los derechos del consumidor, ofreciendo la solución procedente: reposición inmediata del producto o devolución total del dinero.
                            </p>

                            <h3 className="font-display text-base font-semibold text-ink pt-2">Reversión de pagos (Artículo 51, Ley 1480 de 2011)</h3>
                            <p>
                                Los consumidores podrán solicitar la reversión de los pagos efectuados mediante mecanismos de comercio electrónico en los casos taxativamente previstos por la ley:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                <li>Cuando el consumidor sea objeto de fraude o la transacción corresponda a una operación no solicitada.</li>
                                <li>Cuando el producto adquirido no haya sido entregado.</li>
                                <li>Cuando el producto entregado no corresponda a lo solicitado, no cumpla con las características inherentes o resulte defectuoso.</li>
                            </ul>
                            <p>
                                Para ejercer este derecho deberán cumplirse los requisitos legales: presentar la reclamación ante Aroma Premium Store dentro de los cinco (5) días hábiles siguientes al conocimiento de la situación y notificar en el mismo término al emisor del instrumento de pago electrónico utilizado.
                            </p>
                        </div>
                    </section>

                    {/* SECCIÓN 4: PRIVACIDAD Y PROTECCIÓN DE DATOS */}
                    <section id="politica-privacidad" className="scroll-mt-24 rounded-2xl border border-taupe/15 bg-white p-6 sm:p-10 shadow-xs">
                        <div className="flex items-center gap-3 border-b border-taupe/15 pb-4">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
                                <HiOutlineLockClosed className="h-5 w-5" />
                            </span>
                            <div>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-gold-dark font-bold">Sección 4</span>
                                <h2 className="font-display text-2xl font-bold text-ink">Política de Privacidad y Tratamiento de Datos Personales</h2>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            <p>
                                <strong>Aroma Premium Store</strong> reconoce la importancia de proteger la privacidad y los datos personales de sus usuarios y clientes.
                            </p>
                            <p>
                                El responsable del tratamiento de los datos es <strong>{sellerInfo.owner}</strong>, identificado con NIT <strong>{sellerInfo.nit}</strong>, con domicilio en <strong>{sellerInfo.city}</strong>, dirección física <strong>{sellerInfo.address}</strong>, correo electrónico oficial <strong>{sellerInfo.email}</strong> y teléfono de atención <strong>{sellerInfo.phoneDisplay}</strong>.
                            </p>
                            <p>
                                Esta política se desarrolla y ejecuta en estricto cumplimiento de la <strong>Ley Estatutaria 1581 de 2012</strong>, el Decreto 1377 de 2013 y demás normas colombianas que regulan el régimen de protección de datos personales (Habeas Data).
                            </p>

                            <h3 className="font-display text-base font-semibold text-ink pt-2">Información recopilada</h3>
                            <p>Dependiendo de la interacción con nuestra tienda virtual, podremos recopilar:</p>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                <li>Nombre y apellidos completos.</li>
                                <li>Número de documento de identificación (cédula o NIT), cuando resulte necesario para facturación y guías de transporte.</li>
                                <li>Número telefónico o de celular (WhatsApp).</li>
                                <li>Correo electrónico.</li>
                                <li>Dirección física de despacho y ciudad de entrega.</li>
                                <li>Historial de compras, pedidos y transacciones.</li>
                                <li>Datos técnicos de navegación y cookies analíticas para mejorar la experiencia de usuario.</li>
                            </ul>

                            <h3 className="font-display text-base font-semibold text-ink pt-2">Finalidades del tratamiento</h3>
                            <p>La información personal será utilizada legítimamente para:</p>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                <li>Procesar, validar y administrar compras y despachos.</li>
                                <li>Coordinar entregas seguras con las transportadoras aliadas.</li>
                                <li>Emitir los comprobantes y documentos de venta correspondientes.</li>
                                <li>Comunicar al cliente el estado de sus pedidos y números de guía.</li>
                                <li>Tramitar consultas, garantías, peticiones y reclamaciones.</li>
                                <li>Cumplir con las obligaciones legales, tributarias y contables.</li>
                                <li>Enviar novedades, ofertas y beneficios exclusivos únicamente cuando el titular haya otorgado su autorización previa, expresa e informada.</li>
                            </ul>

                            <h3 className="font-display text-base font-semibold text-ink pt-2">Proveedores tecnológicos y seguridad</h3>
                            <p>
                                Para desarrollar nuestra operación colaboramos con proveedores tecnológicos de primer nivel para pasarela de pagos (Wompi Bancolombia), bases de datos seguras (Supabase) y servicios logísticos de paquetería, compartiendo exclusivamente los datos estrictamente necesarios para cumplir con el servicio contratado bajo estrictos acuerdos de confidencialidad y protocolos de seguridad SSL/TLS.
                            </p>

                            <h3 className="font-display text-base font-semibold text-ink pt-2">Derechos de los titulares (Habeas Data)</h3>
                            <p>
                                Los titulares de datos personales tienen derecho a: conocer, actualizar, rectificar y solicitar la supresión de sus datos personales, solicitar prueba de la autorización otorgada, ser informados sobre el uso dado a sus datos y revocar la autorización en cualquier momento cuando no medie un deber legal o contractual de conservarlos.
                            </p>
                            <p>
                                Para ejercer estos derechos, el titular puede enviar una comunicación formal a{' '}
                                <a href={`mailto:${sellerInfo.email}`} className="text-gold-dark hover:underline font-semibold">
                                    {sellerInfo.email}
                                </a>{' '}
                                o a nuestra línea de WhatsApp {sellerInfo.phoneDisplay}, indicando su nombre, número de identificación y la solicitud específica. Aroma Premium Store responderá en los términos máximos establecidos por la Ley 1581 de 2012 (10 a 15 días hábiles).
                            </p>
                        </div>
                    </section>

                    {/* SECCIÓN 5: ATENCIÓN AL CLIENTE Y RECLAMACIONES */}
                    <section id="atencion-cliente" className="scroll-mt-24 rounded-2xl border border-taupe/15 bg-white p-6 sm:p-10 shadow-xs">
                        <div className="flex items-center gap-3 border-b border-taupe/15 pb-4">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
                                <HiOutlineChatBubbleLeftRight className="h-5 w-5" />
                            </span>
                            <div>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-gold-dark font-bold">Sección 5</span>
                                <h2 className="font-display text-2xl font-bold text-ink">Atención al Cliente, PQRS y Reclamaciones</h2>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            <p>
                                En <strong>Aroma Premium Store</strong> valoramos la confianza de nuestros clientes y estamos comprometidos con una atención clara, respetuosa, oportuna y personalizada.
                            </p>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-xl border border-taupe/20 bg-cream-light/40 p-4">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink mb-2">
                                        <FaWhatsapp className="h-4 w-4 text-emerald-600" /> WhatsApp Oficial
                                    </div>
                                    <p className="font-mono text-sm font-semibold text-ink">{sellerInfo.phoneDisplay}</p>
                                    <a
                                        href={`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent('Hola Aroma Premium Store, deseo radicar una consulta o solicitud 📝')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-2 inline-flex items-center gap-1 text-xs text-gold-dark font-medium hover:underline"
                                    >
                                        Escribir al WhatsApp oficial <HiOutlineArrowUpRight className="h-3 w-3" />
                                    </a>
                                </div>

                                <div className="rounded-xl border border-taupe/20 bg-cream-light/40 p-4">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink mb-2">
                                        <HiOutlineEnvelope className="h-4 w-4 text-gold-dark" /> Correo Electrónico
                                    </div>
                                    <p className="font-mono text-sm font-semibold text-ink">{sellerInfo.email}</p>
                                    <a
                                        href={`mailto:${sellerInfo.email}`}
                                        className="mt-2 inline-flex items-center gap-1 text-xs text-gold-dark font-medium hover:underline"
                                    >
                                        Enviar correo de atención <HiOutlineArrowUpRight className="h-3 w-3" />
                                    </a>
                                </div>

                                <div className="rounded-xl border border-taupe/20 bg-cream-light/40 p-4">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink mb-2">
                                        <HiOutlineBuildingOffice2 className="h-4 w-4 text-gold-dark" /> Sede y Ciudad
                                    </div>
                                    <p className="text-sm font-medium text-ink">{sellerInfo.city}</p>
                                    <p className="text-xs text-taupe mt-0.5">{sellerInfo.address}</p>
                                </div>

                                <div className="rounded-xl border border-taupe/20 bg-cream-light/40 p-4">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink mb-2">
                                        <HiOutlineClock className="h-4 w-4 text-gold-dark" /> Horario de Atención
                                    </div>
                                    <p className="text-sm font-medium text-ink">{sellerInfo.hours}</p>
                                    <p className="text-xs text-taupe mt-0.5">Respuestas en menos de 2 horas hábiles</p>
                                </div>
                            </div>

                            <p className="pt-2">
                                Los consumidores podrán presentar peticiones, quejas, reclamos (PQRS), solicitudes de garantía, devoluciones y requerimientos relacionados con sus compras.
                            </p>
                            <p>
                                Cada solicitud formal recibirá un número de radicado con fecha y hora, que permitirá consultar su estado y realizar el seguimiento respectivo hasta su completa resolución.
                            </p>

                            <div className="mt-6 rounded-xl border border-taupe/25 bg-white p-5">
                                <h4 className="font-display text-sm font-bold uppercase tracking-wider text-ink mb-1">
                                    Protección al consumidor · Superintendencia de Industria y Comercio (SIC)
                                </h4>
                                <p className="text-xs text-taupe leading-relaxed">
                                    Los clientes también podrán consultar sus derechos y normatividad vigente ante la Superintendencia de Industria y Comercio (SIC), autoridad nacional competente en materia de protección al consumidor en Colombia.
                                </p>
                                <a
                                    href="https://www.sic.gov.co"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-gold-dark hover:underline"
                                >
                                    Visitar sitio oficial de la SIC: www.sic.gov.co <HiOutlineArrowUpRight className="h-3.5 w-3.5" />
                                </a>
                            </div>
                        </div>
                    </section>

                    {/* PIE DE PÁGINA DE LA POLÍTICA */}
                    <footer className="text-center pt-8 border-t border-taupe/15">
                        <p className="font-display text-2xl font-bold tracking-[0.12em] text-ink">
                            AROMA PREMIUM STORE
                        </p>
                        <p className="eyebrow text-gold mt-1">
                            Tu esencia, tu estilo, tu identidad.
                        </p>
                        <p className="mt-3 text-xs text-taupe">
                            www.aromapremiumstore.com · La confianza de nuestros clientes es parte de nuestra esencia.
                        </p>
                    </footer>
                </article>
            </div>
        </div>
    );
}
