import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { normalizeCoupon } from '@/domain/affiliates/affiliate.js';

const REFERRAL_KEY = 'ap_referral_code';

let inMemoryStore = {};

const getStorage = () => {
    try {
        if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
        if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage;
    } catch {
        // Fallback para entornos con cookies/storage bloqueados
    }
    return {
        getItem: (k) => inMemoryStore[k] || null,
        setItem: (k, v) => { inMemoryStore[k] = String(v); },
        removeItem: (k) => { delete inMemoryStore[k]; },
    };
};

export const getStoredReferralCode = () => {
    try {
        return getStorage().getItem(REFERRAL_KEY) || null;
    } catch {
        return null;
    }
};

export const setStoredReferralCode = (code) => {
    try {
        if (!code) {
            getStorage().removeItem(REFERRAL_KEY);
        } else {
            getStorage().setItem(REFERRAL_KEY, normalizeCoupon(code));
        }
    } catch {
        // Ignorar
    }
};

export const useReferralTracking = () => {
    const { search } = useLocation();

    useEffect(() => {
        if (!search) return;
        const params = new URLSearchParams(search);
        const refCode = params.get('ref') || params.get('cupon') || params.get('c');
        if (refCode) {
            const clean = normalizeCoupon(refCode);
            if (clean) {
                setStoredReferralCode(clean);
            }
        }
    }, [search]);
};
