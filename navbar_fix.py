import re

f = open('src/presentation/components/layout/Navbar.jsx', 'r', encoding='utf-8')
c = f.read()
f.close()

# Hide user icon link on mobile: find the Link to login/cuenta and add hidden sm:flex
old_user = 'className="flex items-center gap-2 p-1 text-ink transition hover:text-gold-dark"\r\r\n                            aria-label={isAuthenticated'
new_user = 'className="hidden sm:flex items-center gap-2 p-1 text-ink transition hover:text-gold-dark"\r\r\n                            aria-label={isAuthenticated'
c = c.replace(old_user, new_user, 1)

# Hide wishlist link on mobile
old_wish = 'className="flex items-center gap-2 p-1 text-ink transition hover:text-gold-dark"\r\r\n                            aria-label={`Lista de deseos'
new_wish = 'className="hidden sm:flex items-center gap-2 p-1 text-ink transition hover:text-gold-dark"\r\r\n                            aria-label={`Lista de deseos'
c = c.replace(old_wish, new_wish, 1)

# Smaller shopping bag icon on mobile
c = c.replace(
    'className="flex items-center gap-3 p-1"',
    'className="flex items-center gap-1.5 sm:gap-3 p-1"',
    1
)
c = c.replace(
    'HiOutlineShoppingBag className="h-6 w-6"',
    'HiOutlineShoppingBag className="h-5 w-5 sm:h-6 sm:w-6"'
)

# Smaller hamburger
c = c.replace(
    'HiOutlineBars3 className="h-6 w-6"',
    'HiOutlineBars3 className="h-5 w-5 sm:h-6 sm:w-6"'
)

f = open('src/presentation/components/layout/Navbar.jsx', 'w', encoding='utf-8')
f.write(c)
f.close()
print('OK - replacements done')
