export const Config = {
    port: process.env.PORT || 5005,
    keycloak: {
        baseUrl: process.env.KEYCLOAK_BASE_URL,
        issuerUrl: process.env.KEYCLOAK_ISSUER_URL || process.env.KEYCLOAK_BASE_URL,
        realm: process.env.KEYCLOAK_REALM,
        clientId: process.env.KEYCLOAK_CLIENT_ID,
    }
}