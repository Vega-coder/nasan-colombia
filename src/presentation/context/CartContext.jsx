import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { addItem, updateQuantity, removeItem, countItems, calculateTotals } from '@/domain/cart/cart.js';
import { toast } from '@/presentation/utils/swal.js';

// Adaptador: guarda el estado del carrito en React + localStorage y delega
// todas las reglas (stock, máximos, envío) al dominio.

const STORAGE_KEY = 'nasan_cart';
const CartContext = createContext(null);

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
    return ctx;
};

const loadCart = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    } catch {
        return [];
    }
};

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState(loadCart);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            // Sin almacenamiento (modo privado): el carrito vive solo en memoria.
        }
    }, [items]);

    const add = useCallback((product, quantity = 1) => {
        if (product.stock <= 0) {
            toast('Producto agotado', 'info');
            return;
        }
        setItems((prev) => addItem(prev, product, quantity));
        setIsOpen(true);
    }, []);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);

    const value = useMemo(() => ({
        items,
        count: countItems(items),
        totals: calculateTotals(items),
        isOpen,
        open,
        close,
        add,
        setQuantity: (productId, qty) => setItems((prev) => updateQuantity(prev, productId, qty)),
        remove: (productId) => setItems((prev) => removeItem(prev, productId)),
        clear: () => setItems([]),
    }), [items, isOpen, open, close, add]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
