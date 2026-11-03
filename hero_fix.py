import re

f = open('src/presentation/components/home/Hero.jsx', 'r', encoding='utf-8')
c = f.read()
f.close()

# Reduce Hero min-height on mobile
c = c.replace(
    'container-luxe relative grid min-h-[460px] items-center gap-8 py-10 md:grid-cols-2 md:py-16',
    'container-luxe relative grid min-h-0 md:min-h-[460px] items-center gap-4 sm:gap-8 py-6 sm:py-10 md:grid-cols-2 md:py-16'
)

# Smaller h1 on mobile
c = c.replace(
    'mt-4 font-display text-3xl font-extrabold uppercase leading-[1.1] tracking-tight sm:text-4xl md:text-5xl lg:text-[54px]',
    'mt-3 font-display text-2xl font-extrabold uppercase leading-[1.1] tracking-tight sm:text-4xl md:text-5xl lg:text-[54px]'
)

# Smaller badge
c = c.replace(
    'inline-flex items-center gap-2 rounded-full border border-teal-500/40 bg-teal-500/10 px-3.5 py-1 text-xs',
    'inline-flex items-center gap-1.5 rounded-full border border-teal-500/40 bg-teal-500/10 px-2.5 py-0.5 text-[10px] sm:text-xs sm:px-3.5 sm:py-1'
)

# Reduce description paragraph margin
c = c.replace(
    'mt-4 max-w-lg text-sm sm:text-base leading-relaxed text-slate-300',
    'mt-2 sm:mt-4 max-w-lg text-xs sm:text-base leading-relaxed text-slate-300 line-clamp-3 sm:line-clamp-none'
)

# Reduce buttons section margin and padding
c = c.replace(
    'mt-8 flex flex-wrap items-center gap-4',
    'mt-4 sm:mt-8 flex flex-wrap items-center gap-2 sm:gap-4'
)
c = c.replace(
    'px-6 py-3.5 font-display text-xs font-bold uppercase tracking-wider text-slate-950',
    'px-4 py-2.5 sm:px-6 sm:py-3.5 font-display text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-950'
)
c = c.replace(
    'px-5 py-3.5 font-display text-xs font-semibold uppercase tracking-wider text-slate-200',
    'px-3 py-2.5 sm:px-5 sm:py-3.5 font-display text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-200'
)

# Reduce guarantee badges margin
c = c.replace(
    'mt-8 grid grid-cols-3 gap-3 border-t border-slate-800/80 pt-6 text-xs text-slate-400',
    'mt-4 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-3 border-t border-slate-800/80 pt-4 sm:pt-6 text-[10px] sm:text-xs text-slate-400'
)

# Machine image container: smaller on mobile
c = c.replace(
    'relative flex h-72 w-full items-end justify-center sm:h-80 md:h-[380px] lg:h-[420px]',
    'relative flex h-48 w-full items-end justify-center sm:h-80 md:h-[380px] lg:h-[420px]'
)

# Machine image max-height smaller on mobile
c = c.replace(
    'relative max-h-[280px] sm:max-h-[320px] md:max-h-[350px]',
    'relative max-h-[180px] sm:max-h-[320px] md:max-h-[350px]'
)
c = c.replace(
    'max-h-[260px] sm:max-h-[300px] md:max-h-[330px]',
    'max-h-[160px] sm:max-h-[300px] md:max-h-[330px]'
)

# Slogan - slightly smaller margin
c = c.replace(
    'mt-4 flex flex-wrap items-center gap-2 font-display text-xs sm:text-sm',
    'mt-2 sm:mt-4 flex flex-wrap items-center gap-2 font-display text-[10px] sm:text-sm'
)

# WhatsApp link fix
c = c.replace('573001234567', '573123917729')

f = open('src/presentation/components/home/Hero.jsx', 'w', encoding='utf-8')
f.write(c)
f.close()
print('Hero updated successfully')
