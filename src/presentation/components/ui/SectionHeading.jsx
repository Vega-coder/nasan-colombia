export default function SectionHeading({ eyebrow, title, align = 'center', tone = 'dark', children }) {
    const centered = align === 'center';
    return (
        <div className={`mb-10 flex flex-col ${centered ? 'items-center text-center' : 'items-start'}`}>
            {eyebrow && <p className={`eyebrow ${tone === 'light' ? 'text-gold' : 'text-taupe'}`}>{eyebrow}</p>}
            <h2 className={`mt-3 text-3xl sm:text-4xl ${tone === 'light' ? 'text-cream-light' : 'text-ink'}`}>{title}</h2>
            <span className="gold-rule mt-5" />
            {children && <div className={`mt-4 max-w-xl text-sm ${tone === 'light' ? 'text-cream/70' : 'text-taupe'}`}>{children}</div>}
        </div>
    );
}
