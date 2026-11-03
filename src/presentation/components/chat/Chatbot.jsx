import { useState, useEffect, useRef } from 'react';
import { HiSparkles, HiPaperAirplane, HiXMark, HiArrowPath, HiMinus } from 'react-icons/hi2';
import { FaWhatsapp, FaCrown } from 'react-icons/fa6';
import { useCases, STORE_WHATSAPP } from '@/infrastructure/container.js';
import ChatMarkdown from './ChatMarkdown.jsx';

const STORAGE_KEY = 'ap_chatbot_history_v2';

const SUGGESTIONS = [
    { label: '🍫 Perfumes dulces y cálidos para cita', query: '¿Cuáles son los mejores perfumes dulces y cálidos para una cita o noche romántica?' },
    { label: '🍋 Perfumes frescos / cítricos para el día', query: 'Recomiéndame perfumes árabes frescos y cítricos ideales para el uso diario y clima cálido.' },
    { label: '👑 Los más vendidos para hombre', query: '¿Cuáles son los perfumes más vendidos y con más cumplidos para hombre?' },
    { label: '🌹 Fragancias femeninas más elogiadas', query: '¿Cuáles son las mejores opciones de perfumes para mujer con excelente fijación?' },
    { label: '📦 ¿Cómo funcionan los envíos y pagos?', query: '¿Cómo funcionan los envíos en Colombia, cuánto tardan y qué medios de pago aceptan?' },
];

const INITIAL_WELCOME = {
    role: 'assistant',
    content: '¡Hola! Soy tu **Asesor Sommelier de Aroma Premium**. ✨\n\nEstoy aquí para guiarte en el fascinante mundo de la perfumería árabe (Lattafa, Afnan, Armaf, Maison y más). ¿Buscas una fragancia para ti, una ocasión especial o un regalo inolvidable?',
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
                content: error.message || 'Lo sentimos, tuvimos un problema de conexión temporal. Puedes escribirnos directamente a nuestro [WhatsApp de Atención Oficial](https://wa.me/573146160642) para asesorarte de inmediato.',
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
                <aside aria-label="Asesor Virtual IA" className="fixed bottom-5 left-4 z-30 sm:left-5">
                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-ink via-ink-light to-ink p-1.5 sm:py-2 sm:pl-3 sm:pr-4 text-gold shadow-luxe ring-1 ring-gold/40 transition-all duration-300 hover:scale-105 hover:ring-gold"
                        aria-label="Abrir Asesor Virtual IA de Perfumería"
                        title="Asesor Virtual de Perfumería Aroma Premium"
                    >
                        <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gold/15 text-gold transition group-hover:bg-gold group-hover:text-ink">
                            <HiSparkles className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse text-gold group-hover:text-ink" />
                            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold" />
                            </span>
                        </div>
                        <div className="flex flex-col text-left leading-tight pr-1.5 sm:pr-0">
                            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gold">
                                <FaCrown className="h-2 w-2" /> Asesor IA
                            </span>
                            <span className="hidden sm:block text-[11px] font-medium text-cream-light">
                                ¿Qué perfume buscas?
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
                    aria-label="Chat con Asesor Virtual Aroma Premium"
                    className="fixed inset-x-3 bottom-3 top-20 z-50 flex flex-col overflow-hidden rounded-2xl border border-gold/40 bg-cream-light shadow-2xl backdrop-blur-md transition-all duration-300 sm:inset-auto sm:bottom-5 sm:left-5 sm:h-[580px] sm:w-[410px] sm:max-h-[85vh]"
                >
                    {/* Encabezado de Lujo */}
                    <header className="relative flex items-center justify-between border-b border-gold/20 bg-gradient-to-r from-[#171513] via-[#24211D] to-[#171513] px-4 py-3 text-cream-light shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-gold/10 text-gold shadow-xs">
                                <HiSparkles className="h-5 w-5" />
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-ink bg-emerald-500" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                                        Asesor Aroma Premium
                                    </h3>
                                    <span className="rounded-full bg-gold/20 px-1.5 py-0.2 text-[9px] font-semibold tracking-wider text-gold uppercase">
                                        IA Groq
                                    </span>
                                </div>
                                <p className="text-[11px] text-cream/70">
                                    En línea · Sommelier de Perfumería
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
                    <div className="flex items-center justify-between border-t border-taupe/15 bg-cream/60 px-4 py-1.5 text-[11px]">
                        <span className="text-taupe">¿Prefieres atención humana?</span>
                        <a
                            href={`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent('Hola Aroma Premium, deseo hablar con un asesor humano 💬')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                        >
                            <FaWhatsapp className="h-3.5 w-3.5" /> Escribir a WhatsApp
                        </a>
                    </div>

                    {/* Formulario de Entrada */}
                    <footer className="border-t border-taupe/20 bg-white p-3">
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
                                placeholder="Escribe tu consulta sobre perfumes..."
                                disabled={loading}
                                className="flex-1 rounded-full border border-taupe/30 bg-cream-light/40 px-4 py-2.5 text-xs text-ink placeholder:text-taupe focus:border-gold focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold sm:text-sm"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-white shadow-sm transition hover:bg-gold-dark disabled:opacity-40 disabled:hover:bg-gold active:scale-95"
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
