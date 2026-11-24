const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("FATAL: JWT_SECRET is not defined in environment variables (.env)");
}

/**
 * Authentication Middleware
 * Validates JSON Web Token in the Authorization header.
 * Attaches decoded user payload to req.user.
 */
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || req.headers.Authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authentication required. Please login to perform this action."
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Authentication token missing."
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Session expired. Please login again."
            });
        }
        return res.status(401).json({
            message: "Invalid authentication token. Authorization denied."
        });
    }
};

module.exports = authMiddleware;
