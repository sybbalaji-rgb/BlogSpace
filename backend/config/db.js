
const dns = require("dns");
try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");

// Global cache for serverless container reuse
let cached = global.mongooseConnection;
if (!cached) {
    cached = global.mongooseConnection = { conn: null, promise: null };
}

const connectDB = async () => {
    // If an active connection exists, reuse it immediately
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    if (!cached.promise) {
        const uri = process.env.MONGO_URI;

        if (!uri) {
            throw new Error("MONGO_URI is missing from environment variables (.env)");
        }

        cached.promise = mongoose.connect(uri, {
            serverSelectionTimeoutMS: 15000
        }).then(conn => {
            console.log("MongoDB Connected Successfully!");
            console.log("Database:", conn.connection.name);
            return conn;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        console.error("MongoDB Connection Error:", error.message);
        throw error;
    }

    return cached.conn;
};

module.exports = connectDB;
