import { useEffect, useState } from 'react';

/**
 * Ejecuta una función asíncrona (normalmente un caso de uso) y expone { data, loading, error }.
 * Se vuelve a ejecutar cuando cambian las dependencias; ignora respuestas obsoletas.
 * `loading` se deriva comparando la clave de dependencias con la del último resultado,
 * así el efecto solo actualiza estado cuando la promesa termina.
 */
export const useAsync = (fn, deps = []) => {
    const key = JSON.stringify(deps);
    const [result, setResult] = useState({ key: null, data: null, error: null });

    useEffect(() => {
        let active = true;
        fn()
            .then((data) => active && setResult({ key, data, error: null }))
            .catch((error) => {
                console.error(error);
                if (active) setResult({ key, data: null, error });
            });
        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    const loading = result.key !== key;
    return { data: loading ? null : result.data, error: loading ? null : result.error, loading };
};
