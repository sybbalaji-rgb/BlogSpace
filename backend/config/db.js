
const dns = require("dns");
try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;

        if (!uri) {
            throw new Error("MONGO_URI is missing from environment variables (.env)");
        }

        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 15000
        });

        console.log("MongoDB Connected Successfully!");
        console.log("Database:", conn.connection.name);

        return conn;
    } catch (error) {
        console.error("MongoDB Connection Error:", error.message);
        throw error;
    }
};

module.exports = connectDB;
