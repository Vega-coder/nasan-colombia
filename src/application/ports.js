// Puertos (contratos) que la infraestructura debe implementar.
// En JS los documentamos con JSDoc; los casos de uso solo dependen de estas formas,
// nunca de Supabase ni de ninguna implementación concreta.

/**
 * @typedef {Object} ProductRepository
 * @property {() => Promise<import('../domain/catalog/product.js').Product[]>} findAll           Solo productos activos (tienda)
 * @property {() => Promise<import('../domain/catalog/product.js').Product[]>} findAllForAdmin   Activos e inactivos
 * @property {(id: string) => Promise<import('../domain/catalog/product.js').Product|null>} findById
 * @property {(slug: string) => Promise<import('../domain/catalog/product.js').Product|null>} findBySlug
 * @property {(ids: string[]) => Promise<import('../domain/catalog/product.js').Product[]>} findByIds
 * @property {(product: import('../domain/catalog/product.js').Product) => Promise<import('../domain/catalog/product.js').Product>} save  Crea o actualiza
 * @property {(id: string) => Promise<{ archived: boolean }>} remove   Borra; si tiene pedidos asociados lo desactiva
 */

/**
 * @typedef {Object} OrderRepository
 * @property {(order: Object) => Promise<Object>} save         Persiste el pedido y devuelve lo guardado
 * @property {(code: string) => Promise<Object|null>} findByCode
 * @property {() => Promise<Object[]>} findAll                 Más recientes primero
 * @property {(code: string, status: string) => Promise<void>} updateStatus
 */

/**
 * @typedef {Object} NotificationGateway
 * @property {(order: Object) => string} buildOrderMessageUrl  URL (ej. WhatsApp) para confirmar el pedido con la tienda
 * @property {(order: Object) => string} buildCustomerMessageUrl  URL para que la tienda escriba al cliente
 */

/**
 * @typedef {Object} AdminUser
 * @property {string} id
 * @property {string} email
 * @property {boolean} isAdmin
 */

/**
 * @typedef {Object} AuthGateway
 * @property {(email: string, password: string) => Promise<AdminUser>} signIn
 * @property {() => Promise<void>} signOut
 * @property {() => Promise<AdminUser|null>} getCurrentUser
 * @property {(email: string) => Promise<any>} [resetPasswordForEmail]
 * @property {(password: string) => Promise<any>} [updatePassword]
 */

/**
 * @typedef {Object} ImageStorage
 * @property {(file: File) => Promise<string>} upload   Devuelve la URL pública de la imagen
 */

export {};
