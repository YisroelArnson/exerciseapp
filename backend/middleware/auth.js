const { getAuth } = require('../firebase/config');

/**
 * Middleware to verify Firebase ID token
 */
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No token provided or invalid format'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify the token with Firebase Admin
        const auth = getAuth();
        const decodedToken = await auth.verifyIdToken(token);

        // Add user info to request object
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified,
            name: decodedToken.name,
            picture: decodedToken.picture
        };

        next();
    } catch (error) {
        console.error('Token verification error:', error);

        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({
                error: 'Token expired',
                message: 'Please sign in again'
            });
        }

        if (error.code === 'auth/id-token-revoked') {
            return res.status(401).json({
                error: 'Token revoked',
                message: 'Please sign in again'
            });
        }

        return res.status(401).json({
            error: 'Invalid token',
            message: 'Authentication failed'
        });
    }
};

/**
 * Optional middleware - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const auth = getAuth();
            const decodedToken = await auth.verifyIdToken(token);

            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                emailVerified: decodedToken.email_verified,
                name: decodedToken.name,
                picture: decodedToken.picture
            };
        }

        next();
    } catch (error) {
        // Don't fail for optional auth, just continue without user
        next();
    }
};

module.exports = {
    verifyToken,
    optionalAuth
}; 