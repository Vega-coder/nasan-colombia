import { useState, useEffect, useRef } from 'react';
import { HiSparkles, HiPaperAirplane, HiXMark, HiArrowPath, HiMinus, HiWrenchScrewdriver } from 'react-icons/hi2';
import { FaWhatsapp } from 'react-icons/fa6';
import { useCases, STORE_WHATSAPP } from '@/infrastructure/container.js';
import ChatMarkdown from './ChatMarkdown.jsx';

const STORAGE_KEY = 'nasan_chatbot_history_v3';

const SUGGESTIONS = [
    { label: '⚙️ Máquinas de prensado y laminación', query: '¿Cuál es la diferencia entre la NA-CLN de prensado y la SUPA LITE PRO laminadora?' },
    { label: '🔥 Plancha 360 para curvas y OLED', query: '¿Qué características tiene la NA-SP23 ULTRA plancha 360 para pantallas curvas?' },
    { label: '🔋 Baterías diagnósticas iPhone', query: '¿Qué modelos de baterías de diagnóstico para iPhone tienen disponibles y qué precios manejan?' },
    { label: '🫧 NA-B2+ Elimina burbujas y autoclave', query: '¿Cómo funciona la NA-B2+ removedor de burbujas y el combo NA-B2+ PRO?' },
    { label: '📦 ¿Cómo funcionan los envíos y pagos?', query: '¿Cómo funcionan los envíos en Colombia, cuánto tardan y qué medios de pago aceptan?' },
];

const INITIAL_WELCOME = {
    role: 'assistant',
    content: '¡Hola! Soy tu **Asesor Técnico de NASAN Colombia / Saisebmer**. 🛠️\n\nDistribuidor oficial de maquinaria, herramientas e insumos para remanufactura de pantallas y microelectrónica (By: Jordan Duran). ¿En qué equipo, herramienta o batería para iPhone te puedo colaborar hoy?',
    time: 'Ahora',
};

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState(() => {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [INITIAL_WELCOME];
        } catch {
            return [INITIAL_WELCOME];
        }
    });
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Guardar en sessionStorage al cambiar mensajes
    useEffect(() => {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        } catch {
            // ignore
        }
    }, [messages]);

    // Auto-scroll al final del chat
    const scrollToBottom = (behavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom('auto');
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen, messages, loading]);

    const handleSend = async (textToSend) => {
        const query = (textToSend || input).trim();
        if (!query || loading) return;

        setInput('');
        const userMsg = {
            role: 'user',
            content: query,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setLoading(true);

        try {
            // Preparamos los mensajes para enviar a Groq (filtrando campos de UI)
            const apiMessages = newHistory.map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const response = await useCases.sendChatMessage(apiMessages);

            const botMsg = {
                role: 'assistant',
                content: response,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch (error) {
            console.error('[Chatbot Error]:', error);
            const errorMsg = {
                role: 'assistant',
                content: error.message || `Lo sentimos, tuvimos un problema de conexión temporal. Puedes escribirnos directamente a nuestro [WhatsApp de Asesoría Oficial](https://wa.me/${STORE_WHATSAPP}) para asesorarte de inmediato.`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setMessages([INITIAL_WELCOME]);
        try {
            sessionStorage.removeItem(STORAGE_KEY);
        } catch {
            // ignore
        }
    };

    return (
        <>
            {/* Botón flotante para abrir el Chatbot (ubicado en la esquina inferior izquierda, separado de WhatsApp) */}
            {!isOpen && (
                <aside aria-label="Asesor Técnico IA" className="fixed bottom-5 left-4 z-30 sm:left-5">
                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-1.5 sm:py-2 sm:pl-3 sm:pr-4 text-teal-300 shadow-xl ring-1 ring-teal-500/40 transition-all duration-300 hover:scale-105 hover:ring-teal-400"
                        aria-label="Abrir Asesor Técnico IA de NASAN"
                        title="Asesor Técnico Oficial NASAN Colombia"
                    >
                        <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-teal-500/15 text-teal-400 transition group-hover:bg-teal-500 group-hover:text-slate-950">
                            <HiSparkles className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse text-teal-400 group-hover:text-slate-950" />
                            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-400" />
                            </span>
                        </div>
                        <div className="flex flex-col text-left leading-tight pr-1.5 sm:pr-0">
                            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-teal-400">
                                <HiWrenchScrewdriver className="h-2.5 w-2.5" /> Asesor Técnico IA
                            </span>
                            <span className="hidden sm:block text-[11px] font-medium text-slate-200">
                                ¿Qué maquinaria o repuesto buscas?
                            </span>
                        </div>
                    </button>
                </aside>
            )}

            {/* Ventana Modal / Drawer del Chatbot */}
            {isOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Chat con Asesor Técnico NASAN Colombia"
                    className="fixed inset-x-3 bottom-3 top-20 z-50 flex flex-col overflow-hidden rounded-2xl border border-teal-500/40 bg-slate-950 shadow-2xl backdrop-blur-md transition-all duration-300 sm:inset-auto sm:bottom-5 sm:left-5 sm:h-[580px] sm:w-[420px] sm:max-h-[85vh]"
                >
                    {/* Encabezado Técnico Oficial */}
                    <header className="relative flex items-center justify-between border-b border-teal-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-4 py-3 text-white shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-teal-500/50 bg-teal-500/10 text-teal-300 shadow-xs">
                                <HiSparkles className="h-5 w-5" />
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-emerald-500" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                                        Asesor NASAN Colombia
                                    </h3>
                                    <span className="rounded-full bg-teal-500/20 px-1.5 py-0.2 text-[9px] font-semibold tracking-wider text-teal-300 uppercase">
                                        IA Groq
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-400">
                                    En línea · Saisebmer | By: Jordan Duran
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handleClear}
                                className="rounded-lg p-1.5 text-cream/70 transition hover:bg-white/10 hover:text-white"
                                title="Reiniciar conversación"
                                aria-label="Reiniciar conversación"
                            >
                                <HiArrowPath className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="rounded-lg p-1.5 text-cream/70 transition hover:bg-white/10 hover:text-white"
                                title="Cerrar chat"
                                aria-label="Cerrar chat"
                            >
                                <HiXMark className="h-5 w-5" />
                            </button>
                        </div>
                    </header>

                    {/* Área de Mensajes */}
                    <div className="flex-1 space-y-4 overflow-y-auto p-4 scroll-smooth">
                        {messages.map((msg, idx) => {
                            const isUser = msg.role === 'user';
                            return (
                                <div
                                    key={idx}
                                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-xs ${
                                            isUser
                                                ? 'rounded-tr-none bg-ink text-cream-light'
                                                : 'rounded-tl-none border border-taupe/20 bg-white text-ink'
                                        }`}
                                    >
                                        <ChatMarkdown
                                            content={msg.content}
                                            onLinkClick={() => {
                                                // Al hacer clic en un enlace de producto o sección, cerramos el chat
                                                // y nos desplazamos al inicio para que el cliente vea la página completa
                                                setIsOpen(false);
                                                window.scrollTo({ top: 0, behavior: 'instant' });
                                            }}
                                        />
                                    </div>
                                    {msg.time && (
                                        <span className="mt-1 px-1 text-[10px] text-taupe/70">
                                            {msg.time}
                                        </span>
                                    )}
                                </div>
                            );
                        })}

                        {/* Indicador de escritura */}
                        {loading && (
                            <div className="flex items-start">
                                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-none border border-taupe/20 bg-white px-4 py-3 text-xs text-taupe shadow-xs">
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-gold" />
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-gold [animation-delay:0.2s]" />
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-gold [animation-delay:0.4s]" />
                                    <span className="ml-1 text-[11px] text-taupe">El asesor está pensando…</span>
                                </div>
                            </div>
                        )}

                        {/* Preguntas Frecuentes / Chips Sugeridos (visibles cuando hay pocos mensajes) */}
                        {messages.length <= 2 && !loading && (
                            <div className="mt-4 pt-2">
                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-taupe">
                                    Sugerencias rápidas:
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {SUGGESTIONS.map((item, sIdx) => (
                                        <button
                                            key={sIdx}
                                            type="button"
                                            onClick={() => handleSend(item.query)}
                                            className="rounded-full border border-gold/40 bg-gold/5 px-3 py-1.5 text-left text-xs text-ink transition hover:border-gold hover:bg-gold/15 active:scale-95"
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Enlace directo a WhatsApp en caso de querer humano */}
                    <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900 px-4 py-1.5 text-[11px]">
                        <span className="text-slate-400">¿Prefieres atención directa con Jordan?</span>
                        <a
                            href={`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent('Hola NASAN Colombia, deseo asesoría técnica personalizada 🛠️')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 font-semibold text-teal-400 hover:underline"
                        >
                            <FaWhatsapp className="h-3.5 w-3.5" /> Escribir a WhatsApp
                        </a>
                    </div>

                    {/* Formulario de Entrada */}
                    <footer className="border-t border-slate-800 bg-slate-950 p-3">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                            className="flex items-center gap-2"
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Escribe tu consulta sobre maquinaria, herramientas o repuestos..."
                                disabled={loading}
                                className="flex-1 rounded-full border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-teal-500 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:text-sm"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500 text-slate-950 shadow-sm transition hover:bg-teal-400 disabled:opacity-40 disabled:hover:bg-teal-500 active:scale-95"
                                aria-label="Enviar mensaje"
                            >
                                <HiPaperAirplane className="h-4 w-4" />
                            </button>
                        </form>
                    </footer>
                </div>
            )}
        </>
    );
}
