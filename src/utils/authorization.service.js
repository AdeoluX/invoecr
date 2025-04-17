const jwt = require('jsonwebtoken');
require('dotenv').config();

const secret = process.env.JWT_SECRET || 'default-secret-key'; // Fallback secret
const expiresIn = process.env.JWT_EXPIRES_IN || '24h'; 

// Authorization class for generating and verifying JWTs
class Authorization {
    constructor() {
        // Load JWT secret and expiration from environment variables
        // Fallback to 1 hour
    }

    // Generate a JWT for a user
    static generateToken(payload) {
        try {
            console.log(secret);
            // Sign the token with the payload, secret, and expiration
            const token = jwt.sign(payload, secret, { expiresIn: expiresIn });
            return {
                success: true,
                token: `${token}`, // Include "Bearer" prefix (common convention)
                expiresIn
            };
        } catch (error) {
            console.error('Error generating JWT:', error.message);
            return {
                success: false,
                error: 'Failed to generate token'
            };
        }
    }

    // Verify a JWT and return the decoded payload
    static verifyToken(token) {
        try {
            // Remove "Bearer " prefix if present
            const tokenToVerify = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

            // Verify the token
            const decoded = jwt.verify(tokenToVerify, secret);
            return {
                success: true,
                decoded
            };
        } catch (error) {
            console.error('Error verifying JWT:', error.message);
            let errorMessage = 'Invalid token';
            if (error.name === 'TokenExpiredError') {
                errorMessage = 'Token has expired';
            } else if (error.name === 'JsonWebTokenError') {
                errorMessage = 'Token is malformed';
            }
            return {
                success: false,
                error: errorMessage
            };
        }
    }

    // Middleware to protect routes (for use in Express.js)
    static authenticateToken(req, res, next) {
        // Get the token from the Authorization header
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Verify the token
        const result = Authorization.verifyToken(authHeader);
        if (!result.success) {
            return res.status(401).json({ error: result.error });
        }

        // Attach the decoded payload to the request object
        req.user = result.decoded;
        next();
    }
}

module.exports = Authorization;