require("dotenv").config({ path: "./backend/.env" });

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const connectDB = require("./backend/config/db");
const authMiddleware = require("./backend/middleware/auth");
const User = require("./models/User");
const Blog = require("./models/Blog");

const app = express();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("FATAL: JWT_SECRET is not defined in environment variables (.env)");
    process.exit(1);
}

// CORS configuration
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Express JSON body parser
app.use(express.json());

// Email validation helper regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// API health check (responds immediately to verify backend status and DB connection state)
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "BlogSpace Backend is Running!",
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    });
});

// Ensure MongoDB is connected for data API requests (Serverless & Local)
app.use(async (req, res, next) => {
    if (req.path.startsWith("/api")) {
        try {
            await connectDB();
            next();
        } catch (err) {
            console.error("Database connection middleware error:", err.message);
            return res.status(500).json({ message: "Database connection error" });
        }
    } else {
        next();
    }
});

// Serve frontend static files (HTML, CSS, JS) from public directory with root fallback
const path = require("path");
const fs = require("fs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname)));

// Home route - serve index.html
app.get("/", (req, res) => {
    const publicIndex = path.join(__dirname, "public", "index.html");
    if (fs.existsSync(publicIndex)) {
        return res.sendFile(publicIndex);
    }
    res.sendFile(path.join(__dirname, "index.html"));
});

// User Registration API (Supports /api/auth/register and /api/register)
app.post(["/api/auth/register", "/api/register"], async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Input validation
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const trimmedName = name.trim();
        const normalizedEmail = email.toLowerCase().trim();

        if (trimmedName.length < 2) {
            return res.status(400).json({
                message: "Name must be at least 2 characters long"
            });
        }

        if (!EMAIL_REGEX.test(normalizedEmail)) {
            return res.status(400).json({
                message: "Please provide a valid email address"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long"
            });
        }

        // Prevent duplicate email registrations
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        // Hash password with bcrypt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Store user in MongoDB
        const newUser = await User.create({
            name: trimmedName,
            email: normalizedEmail,
            password: hashedPassword
        });

        // Generate signed JWT token
        const token = jwt.sign(
            { id: newUser._id, name: newUser.name, email: newUser.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Return user details and token without exposing password
        res.status(201).json({
            message: "Registration successful!",
            token: token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error("Registration Error:", error.message);
        res.status(500).json({ message: "Server error during registration" });
    }
});

// User Login API (Supports /api/auth/login and /api/login)
app.post(["/api/auth/login", "/api/login"], async (req, res) => {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        if (!EMAIL_REGEX.test(normalizedEmail)) {
            return res.status(400).json({
                message: "Please provide a valid email address"
            });
        }

        // Find user by normalized email
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Verify password using bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Generate signed JWT token
        const token = jwt.sign(
            { id: user._id, name: user.name, email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Return user details and token without exposing password
        res.status(200).json({
            message: "Login successful!",
            token: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Login Error:", error.message);
        res.status(500).json({ message: "Server error during login" });
    }
});

// Create Blog API - Protected by server-side JWT authentication
app.post("/api/blogs", authMiddleware, async (req, res) => {
    try {
        const { title, category, content, image } = req.body;
        const author = (req.body.author && req.body.author.trim() !== "")
            ? req.body.author.trim()
            : req.user.name;

        // Input validation
        if (!title || !author || !category || !content) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const trimmedTitle = title.trim();
        const trimmedContent = content.trim();
        const trimmedCategory = category.trim();

        if (trimmedTitle.length < 3) {
            return res.status(400).json({
                message: "Title must be at least 3 characters long"
            });
        }

        if (trimmedContent.length < 10) {
            return res.status(400).json({
                message: "Content must be at least 10 characters long"
            });
        }

        // Store new blog document in MongoDB with authenticated author
        const newBlog = await Blog.create({
            title: trimmedTitle,
            author: author,
            category: trimmedCategory,
            content: trimmedContent,
            image: (image || "").trim()
        });

        res.status(201).json({
            message: "Blog created successfully!",
            blog: newBlog
        });
    } catch (error) {
        console.error("Create Blog Error:", error.message);
        res.status(500).json({ message: "Server error during blog creation" });
    }
});

// GET All Blogs API (Publicly readable)
app.get("/api/blogs", async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.status(200).json(blogs);
    } catch (error) {
        console.error("Fetch Blogs Error:", error.message);
        res.status(500).json({ message: "Server error fetching blogs" });
    }
});

// GET Single Blog by ID API (Publicly readable)
app.get("/api/blogs/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId to prevent CastError crashes
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid blog ID format"
            });
        }

        const blog = await Blog.findById(id);

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found"
            });
        }

        res.status(200).json(blog);
    } catch (error) {
        console.error("Fetch Single Blog Error:", error.message);
        res.status(500).json({ message: "Server error fetching blog" });
    }
});

// Update Blog API - Protected by server-side JWT authentication
app.put("/api/blogs/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid blog ID format" });
        }

        const { title, category, content, image } = req.body;
        const author = (req.body.author && req.body.author.trim() !== "")
            ? req.body.author.trim()
            : req.user.name;

        if (!title || !category || !content) {
            return res.status(400).json({ message: "Title, category, and content are required" });
        }

        const updatedBlog = await Blog.findByIdAndUpdate(
            id,
            {
                title: title.trim(),
                category: category.trim(),
                content: content.trim(),
                author: author,
                image: (image || "").trim()
            },
            { new: true, runValidators: true }
        );

        if (!updatedBlog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        res.status(200).json({
            message: "Blog updated successfully!",
            blog: updatedBlog
        });
    } catch (error) {
        console.error("Update Blog Error:", error.message);
        res.status(500).json({ message: "Server error during blog update" });
    }
});

// Delete Blog API - Protected by server-side JWT authentication
app.delete("/api/blogs/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid blog ID format" });
        }

        const deletedBlog = await Blog.findByIdAndDelete(id);

        if (!deletedBlog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        res.status(200).json({
            message: "Blog deleted successfully!"
        });
    } catch (error) {
        console.error("Delete Blog Error:", error.message);
        res.status(500).json({ message: "Server error during blog deletion" });
    }
});

// 404 Route Not Found middleware
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// Global unhandled error handler middleware
app.use((err, req, res, next) => {
    console.error("Unhandled Server Error:", err.message);
    res.status(500).json({ message: "An unexpected error occurred" });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB before accepting API requests
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server due to database connection error:", err.message);
        process.exit(1);
    }
};

if (require.main === module) {
    startServer();
}

module.exports = app;
