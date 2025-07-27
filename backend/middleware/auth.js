// file: backend/middleware/auth.js

const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, config.get('jwtSecret'));
        req.user = decoded.user; // Add the user payload from the token to the request object
        next(); // Move on to the next middleware or the route handler
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
