
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Temporary storage
let users = [];
let blogs = [];

// Home route
app.get("/", (req, res) => {
    res.send("BlogSpace Backend is Running!");
});

// User Registration API
app.post("/api/register", (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    const existingUser = users.find(
        user => user.email === email
    );

    if (existingUser) {
        return res.status(400).json({
            message: "Email already registered"
        });
    }

    const newUser = {
        id: users.length + 1,
        name,
        email,
        password
    };

    users.push(newUser);

    res.status(201).json({
        message: "Registration successful!",
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
        }
    });
});

// User Login API
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    const user = users.find(
        u => u.email === email
    );

    if (!user || user.password !== password) {
        return res.status(401).json({
            message: "Invalid email or password"
        });
    }

    res.status(200).json({
        message: "Login successful!",
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    });
});

// Create Blog API
app.post("/api/blogs", (req, res) => {
    const { title, author, category, content } = req.body;

    if (!title || !author || !category || !content) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    const newBlog = {
        id: blogs.length + 1,
        title,
        author,
        category,
        content
    };

    blogs.push(newBlog);

    res.status(201).json({
        message: "Blog created successfully!",
        blog: newBlog
    });
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
