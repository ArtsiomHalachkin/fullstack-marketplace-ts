export default {
    userService: import.meta.env.VITE_USER_SERVICE_URL,
    ordersService:  import.meta.env.VITE_ORDERS_SERVICE_URL,
    productService: import.meta.env.VITE_PRODUCTS_SERVICE_URL,
    paymentService: import.meta.env.VITE_PAYMENT_SERVICE_URL,
    keycloak: {
        baseUrl: import.meta.env.VITE_KEYCLOAK_BASE_URL || 'http://localhost:8091',
        realm: import.meta.env.VITE_KEYCLOAK_REALM || 'MARKETPLACE-APP',
        clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'web-app',
        redirectUri: location.origin + '/login-callback',
    }
}

