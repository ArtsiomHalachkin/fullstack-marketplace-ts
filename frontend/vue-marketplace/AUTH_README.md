# Frontend Keycloak Authentication

The frontend already has Keycloak authentication implemented. You only need to implement the **backend** part.

## What's Already Done (Frontend)

### New Files
- `src/composables/useAuth.ts` - Auth composable with PKCE flow
- `src/views/LoginCallbackView.vue` - OAuth callback handler

### Modified Files
- `src/config.ts` - Added Keycloak config with defaults
- `src/router/index.ts` - Added `/login-callback` route
- `src/App.vue` - Auth init + login button

### Dependencies (package.json)
```json
"openid-client": "^6.1.6"
"jwt-decode": "^4.0.0"
```

### Configuration (src/config.ts)
```typescript
keycloak: {
    baseUrl: import.meta.env.VITE_KEYCLOAK_BASE_URL || 'http://localhost:8091',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'FLIGHTS-APP',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'web-app',
    redirectUri: location.origin + '/login-callback',
}
```

### Environment (.env)
```
VITE_BACKEND_URL=http://localhost:5001
VITE_KEYCLOAK_BASE_URL=http://localhost:8091
VITE_KEYCLOAK_REALM=FLIGHTS-APP
VITE_KEYCLOAK_CLIENT_ID=web-app
```

## Docker Compose Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5002 | http://localhost:5002 |
| Backend (flight-control) | 5001 | http://localhost:5001 |
| Keycloak | 8091 | http://localhost:8091 |
| MongoDB | 27018 | mongodb://localhost:27018 |

## Keycloak Client Setup

Make sure the `web-app` client in Keycloak has:
- **Web origins**: `http://localhost:5002`
- **Valid redirect URIs**: `http://localhost:5002/*`

## Auth Flow

```
1. User clicks "Log in" → redirects to Keycloak
2. User logs in at Keycloak
3. Keycloak redirects to /login-callback?code=xxx
4. Frontend exchanges code for JWT token (PKCE flow)
5. Frontend sends JWT in Authorization header to backend
6. Backend validates JWT with Keycloak public key
```

## Your Task: Backend Implementation

The backend needs to:
1. Validate JWT tokens from Keycloak
2. Extract user info and roles from the token
3. Protect endpoints with auth middleware
4. Implement role-based access control (hasAnyRole middleware)

See `flight-control/src/middleware/auth.middleware.ts` for the implementation.

## Testing the Auth Flow

1. Start services: `docker compose up --build`
2. Open http://localhost:5002
3. Click "Log in" button
4. Login with Keycloak user (admin/1234 or officer1/1234)
5. Should redirect back and show username
6. Try fetching aircrafts (requires ADMIN or OFFICER role)

## Debugging

Test OAuth flow manually in browser:
```
http://localhost:8091/realms/FLIGHTS-APP/protocol/openid-connect/auth?response_type=code&client_id=web-app&redirect_uri=http://localhost:5002/login-callback
```
