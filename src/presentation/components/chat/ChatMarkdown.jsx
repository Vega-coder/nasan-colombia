import { Link } from 'react-router-dom';

/**
 * Renderizador ligero y seguro de Markdown para el Chatbot.
 * Soporta enlaces internos [Texto](/ruta), negritas (**texto**),
 * cursivas (*texto*), viñetas (- o •) y saltos de línea.
 */
const TABLE_SEPARATOR_REGEX = new RegExp('^\\|[\\-:\\s\\|]+\\|$');

export default function ChatMarkdown({ content, onLinkClick }) {
    if (!content) return null;

    // Normaliza saltos de línea
    const lines = content.split('\n');

    const renderInline = (text) => {
        // Expresión regular para detectar enlaces markdown: [label](url), negritas **bold**, y cursivas *italic*
        const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g;
        const parts = text.split(tokenRegex);

        return parts.map((part, index) => {
            if (!part) return null;

            // Enlace markdown: [Texto](url)
            const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (linkMatch) {
                const [, label, url] = linkMatch;
                const isInternal = url.startsWith('/') || url.startsWith('#');
                if (isInternal) {
                    return (
                        <Link
                            key={index}
                            to={url}
                            onClick={onLinkClick}
                            className="font-semibold text-gold-dark underline decoration-gold/60 underline-offset-2 transition hover:text-ink hover:decoration-ink"
                        >
                            {label}
                        </Link>
                    );
                }
                return (
                    <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-gold-dark underline decoration-gold/60 underline-offset-2 transition hover:text-ink"
                    >
                        {label} ↗
                    </a>
                );
            }

            // Negrita: **texto**
            const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
            if (boldMatch) {
                return <strong key={index} className="font-semibold text-ink">{boldMatch[1]}</strong>;
            }

            // Cursiva: *texto*
            const italicMatch = part.match(/^\*([^*]+)\*$/);
            if (italicMatch) {
                return <em key={index} className="italic text-ink/90">{italicMatch[1]}</em>;
            }

            return part;
        });
    };

    return (
        <div className="space-y-1.5 leading-relaxed text-xs sm:text-[13px]">
            {lines.map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) {
                    return <div key={idx} className="h-1" />;
                }

                // Títulos encabezados (# o ## o ###)
                if (trimmed.startsWith('### ')) {
                    return (
                        <p key={idx} className="mt-2 font-display text-xs font-bold uppercase tracking-wider text-gold-dark">
                            {renderInline(trimmed.replace(/^###\s*/, ''))}
                        </p>
                    );
                }
                if (trimmed.startsWith('## ')) {
                    return (
                        <p key={idx} className="mt-2 font-display text-sm font-bold uppercase tracking-wider text-gold-dark">
                            {renderInline(trimmed.replace(/^##\s*/, ''))}
                        </p>
                    );
                }

                // Viñetas (- o • o *)
                if (/^[-*•]\s+/.test(trimmed)) {
                    return (
                        <div key={idx} className="ml-2 flex items-start gap-1.5">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                            <span>{renderInline(trimmed.replace(/^[-*•]\s+/, ''))}</span>
                        </div>
                    );
                }

                // Líneas de tabla Markdown: ignoramos filas de separador |---|---|
                if (TABLE_SEPARATOR_REGEX.test(trimmed)) {
                    return null;
                }

                // Filas simples de tabla: | Columna 1 | Columna 2 |
                if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                    const cells = trimmed
                        .slice(1, -1)
                        .split('|')
                        .map((c) => c.trim());
                    return (
                        <div key={idx} className="my-1 grid grid-cols-2 gap-2 rounded-md bg-cream/50 p-1.5 text-[11px]">
                            {cells.map((cell, cIdx) => (
                                <div key={cIdx} className={cIdx === 0 ? 'font-semibold text-ink' : 'text-taupe'}>
                                    {renderInline(cell)}
                                </div>
                            ))}
                        </div>
                    );
                }

                return <p key={idx}>{renderInline(line)}</p>;
            })}
        </div>
    );
}
