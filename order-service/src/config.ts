export const Config = {
    port: process.env.PORT || 3000,
    productService: process.env.PRODUCT_SERVICE_URL || 'http://localhost:5002',
    mongo: {
        url: process.env.MONGO_URL,
        dbName: process.env.MONGO_DB_NAME
    },

    keycloak: {
        baseUrl: process.env.KEYCLOAK_BASE_URL,
        issuerUrl: process.env.KEYCLOAK_ISSUER_URL || process.env.KEYCLOAK_BASE_URL,
        realm: process.env.KEYCLOAK_REALM,
        clientId: process.env.KEYCLOAK_CLIENT_ID,
    }
}