# BlogSpace ✦

A modern, responsive full-stack blog platform featuring a sleek dark-and-purple UI on the frontend and an Express.js REST API on the backend.

---

## 🚀 Features

- **User Authentication**:
  - User registration (`POST /api/register`) with input validation and duplicate email prevention.
  - User login (`POST /api/login`) with credential verification.
  - Interactive login and registration modals with error and success toast notifications.
- **Blog Post Management**:
  - Create blog posts via backend API (`POST /api/blogs`) and display them dynamically.
  - View full articles in a clean reading view modal.
  - Edit and delete blog posts directly from the UI.
  - LocalStorage persistence to retain posts across page reloads.
- **Search & Filtering**:
  - Real-time search across titles, content, categories, and authors.
  - Category filters (*All, Technology, Design, Lifestyle, Coding*).
- **Responsive & Modern Design**:
  - Dark slate theme with glowing purple accents.
  - Fully responsive across desktop, tablet, and mobile devices.

---

## 🛠️ Technologies Used

- **Frontend**:
  - **HTML5**: Semantic markup, accessible modal dialogs, and clean document structure.
  - **CSS3**: Custom CSS variables, CSS Grid, Flexbox, backdrop blur filters, and keyframe animations.
  - **JavaScript (ES6+)**: Vanilla JavaScript, asynchronous `fetch()` API calls, DOM manipulation, and LocalStorage.
- **Backend**:
  - **Node.js**: JavaScript runtime environment.
  - **Express.js**: Minimalist web framework for routing and JSON API endpoints.
  - **CORS**: Cross-Origin Resource Sharing middleware for frontend-to-backend communication.

---

## 📡 API Endpoints

Base URL: `http://localhost:5000`

| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Health check route | *None* |
| `POST` | `/api/register` | Register a new user | `{ "name": "...", "email": "...", "password": "..." }` |
| `POST` | `/api/login` | Login user | `{ "email": "...", "password": "..." }` |
| `POST` | `/api/blogs` | Create a new blog post | `{ "title": "...", "author": "...", "category": "...", "content": "..." }` |

---

## 📁 Project Structure

```text
Codomax-Module-01/
├── .gitignore          # Git ignore rules for node_modules and sensitive files
├── README.md           # Project documentation and guide
├── index.html          # Main HTML structure with navbar, blog grid, and modals
├── style.css           # Styling with modern dark and purple aesthetic
├── script.js           # Client-side logic and fetch() API integration
├── server.js           # Express.js backend server with auth and blog routes
├── package.json        # Node.js dependencies and project scripts
└── package-lock.json   # Exact dependency tree lockfile
```

---

## 💻 How to Run the Application

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your system.

### 2. Install Dependencies
Open your terminal in the project directory and install the required packages:
```bash
npm install
```

### 3. Start the Backend Server
Run the Express server:
```bash
npm start
```
*or*
```bash
node server.js
```
The server will start listening at: `http://localhost:5000`

### 4. Launch the Frontend
Open [index.html](index.html) in your browser:
- You can double-click `index.html` to open it directly in any browser.
- Alternatively, use a local development server like VS Code Live Server.

---

## 📝 License
This project is prepared for educational and assessment submission.
