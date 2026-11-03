# Arquitectura · Aroma Premium

Clean Architecture en 4 capas. Las dependencias **solo apuntan hacia adentro**:

```
presentation  ──►  application  ──►  domain
      │                 ▲
      └──► infrastructure (implementa los puertos de application)
```

La regla está automatizada en `eslint.config.js` (`no-restricted-imports`): si el dominio importa React o Supabase, o un caso de uso importa infraestructura, `npm run lint` falla.

## Estructura

```
src/
├── domain/                  # Núcleo del negocio. JS puro, sin frameworks.
│   ├── shared/money.js          Formato COP y descuentos
│   ├── catalog/
│   │   ├── categories.js        Géneros, tipos, concentraciones y categorías
│   │   ├── product.js           Entidad Producto (normalización + reglas)
│   │   └── filters.js           Búsqueda, filtros, orden, rangos de precio
│   ├── cart/cart.js             Carrito inmutable, envío gratis, máximos por ítem
│   └── orders/
│       ├── order.js             Pedido: estados, transiciones, validación, construcción
│       └── stats.js             Métricas del tablero (ventas, ticket, stock bajo, top)
│
├── application/             # Casos de uso. Reciben sus dependencias por inyección.
│   ├── ports.js                 Contratos: ProductRepository, OrderRepository, NotificationGateway, AuthGateway, ImageStorage
│   ├── catalog/catalogUseCases.js   browseCatalog, getProductDetail, getHomeShowcase
│   ├── orders/placeOrder.js     placeOrder (revalida precio/stock), getOrder
│   ├── admin/productAdmin.js    listar, guardar (valida + evita duplicados), ocultar, eliminar
│   ├── admin/orderAdmin.js      listar, cambiar estado (respeta transiciones), tablero
│   └── auth/authUseCases.js     iniciar sesión (exige rol admin), sesión actual, cerrar sesión
│
├── infrastructure/          # Detalles: Supabase, localStorage, WhatsApp.
│   ├── supabase/client.js
│   ├── repositories/            Implementaciones Supabase y en memoria/local (modo demo)
│   ├── gateways/                WhatsApp, Auth (Supabase / demo), ImageStorage (Storage / data URL)
│   ├── data/seedProducts.js     Catálogo demo (fuente de supabase/seed.sql)
│   └── container.js             Composition root: expone `useCases` (tienda) y `adminUseCases` (panel)
│
├── presentation/            # React.
│   ├── context/                 CartContext (carrito), AdminAuthContext (sesión del panel)
│   ├── hooks/useAsync.js        Ejecuta casos de uso con loading/error
│   ├── components/{brand,layout,home,product,catalog,cart,checkout,ui,admin}/
│   ├── pages/                   Home, Catalog, ProductDetail, Cart, Checkout, OrderConfirmation, NotFound
│   ├── pages/admin/             Login, Dashboard, Products, ProductEdit, Orders (bundle aparte, carga diferida)
│   └── utils/swal.js            Alertas con estilo de marca
│
└── __tests__/               # Vitest: dominio y casos de uso con repositorios en memoria
```

## Reglas

1. **La UI nunca habla con Supabase.** Las páginas llaman `useCases.*` desde `infrastructure/container.js`.
2. **Las reglas de negocio viven en el dominio** (precio final, envío gratis, stock, validación del cliente) y se prueban sin navegador.
3. **Cambiar de proveedor = nuevo repositorio**, no tocar casos de uso ni UI. Ejemplo: el modo demo usa `inMemoryProductRepository` y `localOrderRepository` con los mismos contratos que Supabase.
4. **El servidor es la fuente de verdad del precio.** `placeOrder` revalida contra el repositorio y la función SQL `place_order` vuelve a calcular todo.
5. Componentes de menos de ~200 líneas; si crecen, se dividen en `components/<dominio>/`.
6. Las constantes de envío (`FREE_SHIPPING_THRESHOLD`, `SHIPPING_COST`) están duplicadas en `supabase/schema.sql`; si cambian, actualizar ambos.

## Flujo de una compra

```
Checkout.jsx ─► useCases.placeOrder(items, customer, paymentMethod)
                   ├─ productRepository.findByIds()      precios/stock reales
                   ├─ domain.buildOrder()                validación + totales + código AP-AAMMDD-XXXX
                   ├─ orderRepository.save()             Supabase RPC place_order (o localStorage en demo)
                   └─ notificationGateway.buildOrderMessageUrl()   enlace wa.me con el resumen
```
