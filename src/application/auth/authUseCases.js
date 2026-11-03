// Casos de uso de autenticación (administradores y clientes de la tienda).

/** @param {{ authGateway: import('../ports.js').AuthGateway }} deps */
export const makeSignInCustomer = ({ authGateway }) => async (email, password) => {
    const cleanEmail = email?.trim().toLowerCase();
    if (!cleanEmail || !password) throw new Error('Ingresa tu correo y contraseña');
    return authGateway.signIn(cleanEmail, password);
};

/** @param {{ authGateway: import('../ports.js').AuthGateway }} deps */
export const makeSignUpCustomer = ({ authGateway }) => async ({ email, password, fullName, phone }) => {
    const cleanEmail = email?.trim().toLowerCase();
    const cleanName = fullName?.trim();
    const cleanPhone = phone?.trim();

    if (!cleanName) throw new Error('Por favor ingresa tu nombre completo');
    if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Ingresa un correo electrónico válido');
    if (!password || password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');

    return authGateway.signUp(cleanEmail, password, {
        fullName: cleanName,
        phone: cleanPhone,
    });
};

/** @param {{ authGateway: import('../ports.js').AuthGateway }} deps */
export const makeGetCurrentUser = ({ authGateway }) => async () => {
    return authGateway.getCurrentUser();
};

/** @param {{ authGateway: import('../ports.js').AuthGateway }} deps */
export const makeGetUserOrders = ({ authGateway }) => async () => {
    if (!authGateway.getUserOrders) return [];
    return authGateway.getUserOrders();
};

/** @param {{ authGateway: import('../ports.js').AuthGateway }} deps */
export const makeSignInAdmin = ({ authGateway }) => async (email, password) => {
    if (!email?.trim() || !password) throw new Error('Ingresa correo y contraseña');
    const user = await authGateway.signIn(email.trim().toLowerCase(), password);
    if (!user?.isAdmin) {
        await authGateway.signOut();
        throw new Error('Esta cuenta no tiene permisos de administrador');
    }
    return user;
};

/** @param {{ authGateway: import('../ports.js').AuthGateway }} deps */
export const makeGetCurrentAdmin = ({ authGateway }) => async () => {
    const user = await authGateway.getCurrentUser();
    return user?.isAdmin ? user : null;
};

/** @param {{ authGateway: import('../ports.js').AuthGateway }} deps */
export const makeSignOut = ({ authGateway }) => () => authGateway.signOut();

/** @param {{ authGateway: import('../ports.js').AuthGateway }} deps */
export const makeResetPassword = ({ authGateway }) => async (email) => {
    const cleanEmail = email?.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
        throw new Error('Por favor ingresa un correo electrónico válido');
    }
    if (!authGateway.resetPasswordForEmail) {
        throw new Error('La recuperación de contraseña no está disponible');
    }
    return authGateway.resetPasswordForEmail(cleanEmail);
};

/** @param {{ authGateway: import('../ports.js').AuthGateway }} deps */
export const makeUpdatePassword = ({ authGateway }) => async (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
    }
    if (!authGateway.updatePassword) {
        throw new Error('La actualización de contraseña no está disponible');
    }
    return authGateway.updatePassword(newPassword);
};

