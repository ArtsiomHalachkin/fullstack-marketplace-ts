// useAuth.ts - Vue composable for Keycloak authentication with PKCE flow
import { reactive, ref } from 'vue';
import axios from 'axios';
import * as client from 'openid-client'; // OpenID Connect client for OAuth2/OIDC
import {jwtDecode} from "jwt-decode"; // Decode JWT to extract user info
import config from "@/config";



// Reactive auth state shared across all components
interface AuthState {
    accessToken: string | null;
    idToken: string | null;
    user: any | null; 
    authenticated: boolean;
}

const state = reactive<AuthState>({
    accessToken: null,
    idToken: null,    // JWT access token from Keycloak
    user: null,           // Decoded user info from JWT
    authenticated: false, // Is user logged in?
});

const error = ref<string | null>(null);
let codeChallenge: string;
let authConfig: client.Configuration; // Discovered OpenID configuration

export function useAuth() {
    
    // Initialize OpenID client - discovers Keycloak endpoints
    const init = async () => {
        const issuerUri = `${config.keycloak.baseUrl}/realms/${config.keycloak.realm}`;
        // Fetches .well-known/openid-configuration from Keycloak
        authConfig = await client.discovery(
            new URL(issuerUri),
            config.keycloak.clientId!,
            undefined,
            undefined,
            { execute: [client.allowInsecureRequests] } // Allow HTTP for localhost
        );
    }

    // Start login - redirects to Keycloak login page
    const login = async () => {
        /**
         * PKCE (Proof Key for Code Exchange):
         * 1. Generate random code_verifier, store in localStorage
         * 2. Create code_challenge = SHA256(code_verifier)
         * 3. Send code_challenge to Keycloak
         * 4. Later exchange code + code_verifier for tokens
         */
        localStorage.setItem('code_verifier', client.randomPKCECodeVerifier())
        codeChallenge = await client.calculatePKCECodeChallenge(localStorage.getItem('code_verifier') || '');

        let parameters: Record<string, string> = {
            redirect_uri: config.keycloak.redirectUri, // Where to return after login
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        }

        // State parameter prevents CSRF attacks
        localStorage.setItem('state', client.randomState())
        parameters.state = localStorage.getItem('state') || '';

        let redirectTo: URL = client.buildAuthorizationUrl(authConfig, parameters)
        window.location.href = redirectTo.href; // Redirect to Keycloak
    };

    // Handle OAuth callback - exchange authorization code for tokens
    const handleCallback = async (callbackUrl: string) => {
        // URL contains ?code=xxx&state=yyy from Keycloak
        let tokens: client.TokenEndpointResponse = await client.authorizationCodeGrant(
            authConfig,
            new URL(callbackUrl),
            {
                pkceCodeVerifier: localStorage.getItem('code_verifier') || "", // Prove we started the flow
                expectedState: localStorage.getItem('state') || "", // Validate state to prevent CSRF
            },
        )

        state.authenticated = true;
        state.accessToken = tokens.access_token;
        state.idToken = tokens.id_token || null;
        state.user = jwtDecode(tokens.access_token);

        // Prepare the payload matching your UserDto
        const userPayload = {
            name: state.user?.name || state.user?.preferred_username ,
            email: state.user?.email,
        };

        // Call the backend sync endpoint
        try {
            await axios.post(`${config.userService}/users`, userPayload, {
                
                headers: { Authorization: `Bearer ${state.accessToken}` }
            });
            console.log("User synced to MongoDB");
        } catch (err) {
            console.error(" Sync failed", err);
        }
    }

    // Make authenticated API request with Bearer token
    const authorizedRequest = async (endpoint: string, options = {}) => {
        if (!state.accessToken) {
            error.value = 'Not authenticated';
            throw new Error(error.value);
        }

        const response = await axios({
            url: `${endpoint}`,
            headers: {
                Authorization: `Bearer ${state.accessToken}`, // Backend validates this
            },
            ...options,
        });
        return response.data;
    };

    const getUsername = () => {
        return state.user?.preferred_username || state.user?.name || "Guest";
    };

    const getUserEmail = () => {
        return state.user?.email || "";
    }

    const getUserRoles = (): string[] => {
        if (!state.user) return [];

        // 1. Check Realm Roles (Global like 'USER', 'ADMIN')
        const realmRoles = state.user.realm_access?.roles || [];
        
        // 2. Check Client Roles (Specific to web-app)
        const clientRoles = state.user.resource_access?.[config.keycloak.clientId!]?.roles || [];

        // 3. Merge them so we don't miss anything
        return Array.from(new Set([...realmRoles, ...clientRoles]));
    }

    const logout = () => {
        // ... clear state logic ...
        const idTokenForLogout = state.idToken;

        // 1. Define base parameters
        const params: Record<string, string> = {
            post_logout_redirect_uri: window.location.origin,
            client_id: config.keycloak.clientId || '',
        };

        // 2. Only add id_token_hint if it is a valid string
        if (idTokenForLogout) {
            params.id_token_hint = idTokenForLogout;
        }

        let logoutUrl: URL = client.buildEndSessionUrl(authConfig, params);
        window.location.href = logoutUrl.href;
    };
    
    return {
        state,
        error,
        init,
        login,
        handleCallback,
        authorizedRequest,
        getUsername,
        getUserRoles,
        logout,
        getUserEmail,
    };
}
