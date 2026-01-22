import {Config} from "../config";

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');


const client = jwksClient({
    jwksUri: `${Config.keycloak.baseUrl}/realms/${Config.keycloak.realm}/protocol/openid-connect/certs`,
});

// Function to retrieve the signing key
const getKey = (header, callback) => {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) return callback(err);
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
    });
}

const jwtVerify = (accessToken: string, key, options): Promise<any> => {
    return new Promise((resolve, reject) => {
        jwt.verify(accessToken, key, options, (err, decoded) => {
            if (err) return reject(err)
            resolve(decoded)
        });
    });
}

const parseUserDataFromToken = (decoded) => {
    return {
        id: decoded.sub,
        username: decoded.preferred_username,
        name: decoded.name,
        email: decoded.email,
        roles: decoded.resource_access?.[Config.keycloak.clientId as string]?.roles ?? []
    }
}

export const oAuthModel = {
    async getAccessToken(accessToken: string) {
        const options = {
            algorithms: ['RS256'], // Keycloak uses RS256
            issuer: `${Config.keycloak.issuerUrl}/realms/${Config.keycloak.realm}`, // Ensure token is issued by this realm
        }
        const decodedToken = await jwtVerify(accessToken, getKey, options);
        return {
            accessToken,
            client: { id: Config.keycloak.clientId },
            user: parseUserDataFromToken(decodedToken), // inject user data into token to be used in Vue components
            accessTokenExpiresAt: new Date(decodedToken.exp * 1000),
        }
    },

    getClient(clientId, clientSecret) {
        if (clientId === Config.keycloak.clientId) {
            return {
                id: Config.keycloak.clientId,
                grants: ['password', 'refresh_token']
            }
        }
        return null;
    },

    saveToken(token, client, user) {
        return {
            ...token,
            client,
            user,
        };
    },

    verifyScope(token, scope) {
        // Adjust as per your scope requirements
        return true;
    },

};

/**
 * Middleware to check if a user has one of the required roles.
 */
export function hasAnyRole(...roles: Array<string>) {
    return (req, res, next) => {
        const user = res.locals.oauth?.token?.user
        

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!roles.some(role => user.roles?.includes(role))) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        next();
    };
}
