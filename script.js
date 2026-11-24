/**
 * BlogSpace - Modern Personal & Tech Blog Website
 * Phase 7: Full Frontend Integration with Express Backend API
 * Pure Vanilla JavaScript (Beginner-Friendly, Robust & Feature-Complete)
 */

// Backend API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Storage keys for user authentication session
const USER_KEY = 'blogspace_user';
const TOKEN_KEY = 'blogspace_token';

// Fallback cover image if user provides none or image fails to load
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80';

// In-memory state variables (sourced strictly from MongoDB)
let posts = [];
let currentCategory = 'all';
let searchKeyword = '';
let currentUser = null;
let isLoadingBlogs = false;

/* ==========================================================================
   DOM Elements
   ========================================================================== */
const postsContainer = document.getElementById('postsContainer');
const emptyState = document.getElementById('emptyState');
const postForm = document.getElementById('postForm');
const postIdInput = document.getElementById('postIdInput');
const postTitleInput = document.getElementById('postTitle');
const postCategoryInput = document.getElementById('postCategory');
const postAuthorInput = document.getElementById('postAuthor');
const postImageInput = document.getElementById('postImage');
const postContentInput = document.getElementById('postContent');
const modalTitle = document.getElementById('modalTitle');
const savePostBtn = document.getElementById('savePostBtn');

// Modals
const postModalOverlay = document.getElementById('postModalOverlay');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');

const readModalOverlay = document.getElementById('readModalOverlay');
const closeReadModalBtn = document.getElementById('closeReadModalBtn');
const readModalContent = document.getElementById('readModalContent');

// Auth Modals & Elements
const registerModalOverlay = document.getElementById('registerModalOverlay');
const closeRegisterModalBtn = document.getElementById('closeRegisterModalBtn');
const cancelRegisterModalBtn = document.getElementById('cancelRegisterModalBtn');
const registerForm = document.getElementById('registerForm');
const registerNameInput = document.getElementById('registerName');
const registerEmailInput = document.getElementById('registerEmail');
const registerPasswordInput = document.getElementById('registerPassword');
const submitRegisterBtn = document.getElementById('submitRegisterBtn');
const switchToLoginLink = document.getElementById('switchToLoginLink');

const loginModalOverlay = document.getElementById('loginModalOverlay');
const closeLoginModalBtn = document.getElementById('closeLoginModalBtn');
const cancelLoginModalBtn = document.getElementById('cancelLoginModalBtn');
const loginForm = document.getElementById('loginForm');
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const submitLoginBtn = document.getElementById('submitLoginBtn');
const switchToRegisterLink = document.getElementById('switchToRegisterLink');

// Navigation auth controls
const navLoginBtn = document.getElementById('navLoginBtn');
const navRegisterBtn = document.getElementById('navRegisterBtn');
const userGreeting = document.getElementById('userGreeting');
const navLogoutBtn = document.getElementById('navLogoutBtn');

// Trigger buttons
const openCreateModalBtn = document.getElementById('openCreateModalBtn');
const heroCreateBtn = document.getElementById('heroCreateBtn');
const quickAddBtn = document.getElementById('quickAddBtn');
const emptyAddBtn = document.getElementById('emptyAddBtn');

// Filter & Search
const searchInput = document.getElementById('searchInput');
const categoryFilters = document.getElementById('categoryFilters');

// Mobile Menu
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.getElementById('navLinks');

// Footer year
const currentYearSpan = document.getElementById('currentYear');

/* ==========================================================================
   Storage & Helper Functions
   ========================================================================== */

/**
 * Formats a date string (e.g. "Nov 24, 2026")
 */
function getCurrentFormattedDate() {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date().toLocaleDateString('en-US', options);
}

/**
 * Calculate estimated read time in minutes
 */
function calcReadTime(text) {
  if (!text) return 1;
  const words = text.trim().split(/\s+/).length;
  const mins = Math.ceil(words / 180);
  return mins > 0 ? mins : 1;
}

/**
 * Escapes HTML characters to prevent XSS injection
 */
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ==========================================================================
   API: Fetch All Blogs from MongoDB (GET /api/blogs)
   ========================================================================== */

/**
 * Fetches all blogs directly from MongoDB via the backend API.
 * Handles loading, empty database, and API error states without fake fallback data.
 */
async function fetchBlogs() {
  isLoadingBlogs = true;

  // Display loading state
  postsContainer.innerHTML = `
    <div class="posts-loading" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
      <div class="spinner"></div>
      <p style="margin-top: 1rem; color: var(--text-muted);">Fetching articles from MongoDB Atlas...</p>
    </div>
  `;
  emptyState.classList.add('hidden');

  try {
    const response = await fetch(`${API_BASE_URL}/blogs`);

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();
    const fetchedBlogs = Array.isArray(data) ? data : (data.blogs || []);

    if (fetchedBlogs.length > 0) {
      // Normalize posts directly from MongoDB documents
      posts = fetchedBlogs.map(b => ({
        id: b._id ? b._id.toString() : (b.id ? b.id.toString() : Date.now().toString()),
        title: b.title || 'Untitled Post',
        author: b.author || 'Anonymous',
        category: b.category || 'General',
        content: b.content || '',
        image: b.image && b.image.trim() !== '' ? b.image : DEFAULT_IMAGE,
        createdAt: b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : getCurrentFormattedDate()
      }));
    } else {
      // Database has no blogs yet
      posts = [];
    }
    renderPosts();
  } catch (error) {
    console.error('API GET /api/blogs failed:', error);
    posts = [];
    postsContainer.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1rem; text-align: center;">
        <div class="empty-icon">⚠️</div>
        <h3>Unable to Load Blogs from Database</h3>
        <p style="color: var(--text-muted); margin: 0.5rem 0 1.5rem; max-width: 480px;">
          Could not retrieve articles from the backend API. Please make sure the server is running on http://localhost:5000 and connected to MongoDB Atlas.
        </p>
        <button class="btn btn-primary" onclick="fetchBlogs()">
          <span>↻ Retry Connection</span>
        </button>
      </div>
    `;
    emptyState.classList.add('hidden');
  } finally {
    isLoadingBlogs = false;
  }
}

/* ==========================================================================
   API: Fetch Single Blog by MongoDB ID (GET /api/blogs/:id)
   ========================================================================== */

/**
 * Fetches and displays individual blog details in the reading view modal directly from MongoDB.
 */
async function openReadModal(id) {
  // Open modal with loading spinner
  readModalContent.innerHTML = `
    <div class="posts-loading" style="padding: 3rem 1rem; text-align: center;">
      <div class="spinner"></div>
      <p style="margin-top: 1rem; color: var(--text-muted);">Loading article from MongoDB...</p>
    </div>
  `;
  readModalOverlay.classList.remove('hidden');

  try {
    const response = await fetch(`${API_BASE_URL}/blogs/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Blog post not found in database.');
      } else if (response.status === 400) {
        throw new Error('Invalid blog ID format.');
      }
      throw new Error(`Server returned status ${response.status}`);
    }

    const serverBlog = await response.json();
    const displayImage = serverBlog.image && serverBlog.image.trim() !== '' ? serverBlog.image : DEFAULT_IMAGE;
    const formattedDate = serverBlog.createdAt
      ? new Date(serverBlog.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : getCurrentFormattedDate();

    readModalContent.innerHTML = `
      <img class="read-modal-image" src="${escapeHTML(displayImage)}" alt="${escapeHTML(serverBlog.title)}" onerror="this.onerror=null; this.src='${DEFAULT_IMAGE}';">
      <div class="read-modal-header">
        <span class="read-modal-badge">${escapeHTML(serverBlog.category || 'General')}</span>
        <h2 class="read-modal-title">${escapeHTML(serverBlog.title)}</h2>
        <div class="read-modal-meta">
          <span>By <strong>${escapeHTML(serverBlog.author || 'Anonymous')}</strong></span>
          <span>•</span>
          <span>${escapeHTML(formattedDate)}</span>
          <span>•</span>
          <span>${calcReadTime(serverBlog.content)} min read</span>
        </div>
      </div>
      <div class="read-modal-body">
        ${escapeHTML(serverBlog.content)}
      </div>
      <div style="margin-top: 2rem; border-top: 1px solid var(--purple-border, #2d2254); padding-top: 1.5rem; display: flex; justify-content: flex-end;">
        <button class="btn btn-secondary" id="readModalBackBtn" onclick="closeReadModal()">← Back to Articles</button>
      </div>
    `;
  } catch (err) {
    console.error(`Error loading blog details for ID ${id}:`, err);
    readModalContent.innerHTML = `
      <div class="empty-state" style="padding: 3rem 1rem; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
        <div class="empty-icon">🔍</div>
        <h3>Article Details Unavailable</h3>
        <p style="color: var(--text-muted); margin: 0.5rem 0 1.5rem;">${escapeHTML(err.message || 'Could not load article from database.')}</p>
        <button class="btn btn-secondary" onclick="closeReadModal()">← Back to Articles</button>
      </div>
    `;
  }
}

/**
 * Close Read Full Post Modal
 */
function closeReadModal() {
  readModalOverlay.classList.add('hidden');
  readModalContent.innerHTML = '';
}

/* ==========================================================================
   Render Functions
   ========================================================================== */

/**
 * Render blog posts grid based on category and search filters
 */
function renderPosts() {
  if (isLoadingBlogs) return;

  // Filter by category
  let filtered = posts;
  if (currentCategory !== 'all') {
    filtered = filtered.filter(p => p.category && p.category.toLowerCase() === currentCategory.toLowerCase());
  }

  // Filter by search keyword
  if (searchKeyword.trim() !== '') {
    const q = searchKeyword.toLowerCase();
    filtered = filtered.filter(p => 
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.content && p.content.toLowerCase().includes(q)) ||
      (p.author && p.author.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }

  // Clear container
  postsContainer.innerHTML = '';

  // Handle empty state
  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  // Render cards
  filtered.forEach(post => {
    const card = document.createElement('article');
    card.className = 'post-card';
    card.dataset.id = post.id;

    const initial = post.author ? post.author.trim().charAt(0).toUpperCase() : 'U';
    const displayImage = post.image && post.image.trim() !== '' ? post.image : DEFAULT_IMAGE;

    card.innerHTML = `
      <div class="card-image-wrap">
        <img class="card-image" src="${escapeHTML(displayImage)}" alt="${escapeHTML(post.title)}" onerror="this.onerror=null; this.src='${DEFAULT_IMAGE}';">
        <span class="category-badge">${escapeHTML(post.category)}</span>
      </div>
      <div class="card-body">
        <div class="card-meta">
          <span>${escapeHTML(post.createdAt || 'Recent')}</span>
          <span class="meta-dot">•</span>
          <span>${calcReadTime(post.content)} min read</span>
        </div>
        <h3 class="card-title" title="Read full post">${escapeHTML(post.title)}</h3>
        <p class="card-excerpt">${escapeHTML(post.content)}</p>
        <div class="card-footer">
          <div class="author-info">
            <div class="author-avatar">${escapeHTML(initial)}</div>
            <span class="author-name">${escapeHTML(post.author)}</span>
          </div>
          <div class="card-actions">
            <button class="action-btn action-btn-edit" data-action="edit" title="Edit Post">✏️ Edit</button>
            <button class="action-btn action-btn-delete" data-action="delete" title="Delete Post">🗑️ Delete</button>
          </div>
        </div>
      </div>
    `;

    // Make entire card clickable to open full article view via GET /api/blogs/:id
    card.addEventListener('click', (e) => {
      // Do not open reading view if Edit or Delete button was clicked
      if (e.target.closest('[data-action]')) return;
      openReadModal(post.id);
    });

    // Handle Edit / Delete clicks
    const editBtn = card.querySelector('[data-action="edit"]');
    const deleteBtn = card.querySelector('[data-action="delete"]');

    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(post.id);
    });

    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deletePost(post.id);
    });

    postsContainer.appendChild(card);
  });
}

/* ==========================================================================
   Authentication & UI Functions
   ========================================================================== */

/**
 * Updates navbar display according to login state
 */
function updateAuthUI() {
  if (currentUser) {
    if (navLoginBtn) navLoginBtn.classList.add('hidden');
    if (navRegisterBtn) navRegisterBtn.classList.add('hidden');
    if (userGreeting) {
      userGreeting.textContent = `👋 ${currentUser.name}`;
      userGreeting.classList.remove('hidden');
    }
    if (navLogoutBtn) navLogoutBtn.classList.remove('hidden');

    // Auto-fill author name in create blog form
    if (postAuthorInput && !postAuthorInput.value) {
      postAuthorInput.value = currentUser.name;
    }
  } else {
    if (navLoginBtn) navLoginBtn.classList.remove('hidden');
    if (navRegisterBtn) navRegisterBtn.classList.remove('hidden');
    if (userGreeting) userGreeting.classList.add('hidden');
    if (navLogoutBtn) navLogoutBtn.classList.add('hidden');
  }
}

/**
 * Open Register Modal
 */
function openRegisterModal() {
  closeLoginModal();
  registerForm.reset();
  registerModalOverlay.classList.remove('hidden');
  registerNameInput.focus();
}

/**
 * Close Register Modal
 */
function closeRegisterModal() {
  registerModalOverlay.classList.add('hidden');
  registerForm.reset();
}

/**
 * Open Login Modal
 */
function openLoginModal() {
  closeRegisterModal();
  loginForm.reset();
  loginModalOverlay.classList.remove('hidden');
  loginEmailInput.focus();
}

/**
 * Close Login Modal
 */
function closeLoginModal() {
  loginModalOverlay.classList.add('hidden');
  loginForm.reset();
}

/**
 * Task 1: Connect Registration Form to Register API (POST /api/auth/register)
 */
async function handleRegisterSubmit(e) {
  e.preventDefault();

  const name = registerNameInput.value.trim();
  const email = registerEmailInput.value.trim();
  const password = registerPasswordInput.value.trim();

  if (!name || !email || !password) {
    showToast('Please fill in all registration fields.', true);
    return;
  }

  // Button loading state
  if (submitRegisterBtn) {
    submitRegisterBtn.disabled = true;
    submitRegisterBtn.textContent = 'Registering...';
  }

  try {
    let response;
    // Primary route: /api/auth/register, with automatic fallback to /api/register
    try {
      response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      if (response.status === 404) {
        response = await fetch(`${API_BASE_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
      }
    } catch (netErr) {
      response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
    }

    const data = await response.json();

    if (response.ok) {
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      if (data.user) {
        currentUser = data.user;
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        updateAuthUI();
      }
      showToast(data.message || 'Registration successful!');
      closeRegisterModal();
    } else {
      showToast(data.message || 'Registration failed.', true);
    }
  } catch (error) {
    console.error('Registration API Error:', error);
    showToast('Unable to reach backend server at http://localhost:5000', true);
  } finally {
    if (submitRegisterBtn) {
      submitRegisterBtn.disabled = false;
      submitRegisterBtn.textContent = 'Register';
    }
  }
}

/**
 * Task 2: Connect Login Form to Login API (POST /api/auth/login)
 */
async function handleLoginSubmit(e) {
  e.preventDefault();

  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value.trim();

  if (!email || !password) {
    showToast('Please enter both email and password.', true);
    return;
  }

  // Button loading state
  if (submitLoginBtn) {
    submitLoginBtn.disabled = true;
    submitLoginBtn.textContent = 'Logging in...';
  }

  try {
    let response;
    // Primary route: /api/auth/login, with automatic fallback to /api/login
    try {
      response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (response.status === 404) {
        response = await fetch(`${API_BASE_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
      }
    } catch (netErr) {
      response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
    }

    const data = await response.json();

    if (response.ok) {
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      currentUser = data.user;
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      updateAuthUI();
      closeLoginModal();
      showToast(data.message || `Welcome back, ${currentUser.name}!`);
    } else {
      showToast(data.message || 'Invalid email or password.', true);
    }
  } catch (error) {
    console.error('Login API Error:', error);
    showToast('Unable to reach backend server at http://localhost:5000', true);
  } finally {
    if (submitLoginBtn) {
      submitLoginBtn.disabled = false;
      submitLoginBtn.textContent = 'Login';
    }
  }
}

/**
 * Handle Logout
 */
function handleLogout() {
  currentUser = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  updateAuthUI();
  showToast('Logged out successfully.');
}

/* ==========================================================================
   CRUD Operations & Blog Creation API (POST /api/blogs)
   ========================================================================== */

/**
 * Open Modal in "Create Post" mode (Requires Authentication)
 */
function openCreateModal() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    showToast('Please login to create a blog post.', true);
    openLoginModal();
    return;
  }

  postForm.reset();
  postIdInput.value = '';
  modalTitle.textContent = 'Create New Blog Post';
  savePostBtn.textContent = 'Publish Post';

  // If user is logged in, auto-fill author
  if (currentUser) {
    postAuthorInput.value = currentUser.name;
  }

  postModalOverlay.classList.remove('hidden');
  postTitleInput.focus();
}

/**
 * Open Modal in "Edit Post" mode and pre-populate values
 */
function openEditModal(id) {
  const post = posts.find(p => p.id === id.toString());
  if (!post) return;

  postIdInput.value = post.id;
  postTitleInput.value = post.title;
  postCategoryInput.value = post.category;
  postAuthorInput.value = post.author;
  postImageInput.value = post.image || '';
  postContentInput.value = post.content;

  modalTitle.textContent = 'Edit Blog Post';
  savePostBtn.textContent = 'Update Post';

  postModalOverlay.classList.remove('hidden');
  postTitleInput.focus();
}

/**
 * Close Create / Edit Modal
 */
function closePostModal() {
  postModalOverlay.classList.add('hidden');
  postForm.reset();
  postIdInput.value = '';
}

/**
 * Task 3: Connect Create Blog Form to Create-Blog API (POST /api/blogs)
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const title = postTitleInput.value.trim();
  const category = postCategoryInput.value;
  const author = postAuthorInput.value.trim();
  const image = postImageInput.value.trim();
  const content = postContentInput.value.trim();
  const editingId = postIdInput.value;

  if (!title || !author || !category || !content) {
    showToast('Please fill in all required fields.', true);
    return;
  }

  // Check authentication token before sending
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    showToast('Please login to create or edit a blog post.', true);
    openLoginModal();
    return;
  }

  // Button loading state
  if (savePostBtn) {
    savePostBtn.disabled = true;
    savePostBtn.textContent = editingId ? 'Updating...' : 'Publishing...';
  }

  // Handle Edit of existing post in MongoDB (PUT /api/blogs/:id)
  if (editingId) {
    try {
      const response = await fetch(`${API_BASE_URL}/blogs/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          category,
          author,
          image: image || DEFAULT_IMAGE,
          content
        })
      });

      const data = await response.json();

      if (response.status === 401) {
        showToast(data.message || 'Session expired. Please login again.', true);
        handleLogout();
        openLoginModal();
        return;
      }

      if (response.ok) {
        showToast(data.message || 'Blog updated in MongoDB!');
        closePostModal();
        await fetchBlogs();
      } else {
        showToast(data.message || 'Failed to update blog in database.', true);
      }
    } catch (error) {
      console.error('Update Blog API Error:', error);
      showToast('Unable to reach backend server to update blog.', true);
    } finally {
      if (savePostBtn) {
        savePostBtn.disabled = false;
        savePostBtn.textContent = 'Publish Post';
      }
    }
    return;
  }

  // Creating new post -> Call POST /api/blogs with JWT Authorization header
  try {
    const response = await fetch(`${API_BASE_URL}/blogs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title,
        author,
        category,
        content,
        image: image || DEFAULT_IMAGE
      })
    });

    const data = await response.json();

    if (response.status === 401) {
      showToast(data.message || 'Session expired. Please login again.', true);
      handleLogout();
      openLoginModal();
      return;
    }

    if (response.ok) {
      showToast(data.message || 'Blog saved to MongoDB!');
      closePostModal();
      await fetchBlogs();
    } else {
      showToast(data.message || 'Failed to create blog in database.', true);
    }
  } catch (error) {
    console.error('Create Blog API Error:', error);
    showToast('Unable to reach backend server. Blog was not saved.', true);
  } finally {
    if (savePostBtn) {
      savePostBtn.disabled = false;
      savePostBtn.textContent = 'Publish Post';
    }
  }
}

/**
 * Delete a post from MongoDB via DELETE /api/blogs/:id
 */
async function deletePost(id) {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    showToast('Please login to delete blog posts.', true);
    openLoginModal();
    return;
  }

  const isConfirmed = confirm('Are you sure you want to delete this blog post from MongoDB? This action cannot be undone.');
  if (!isConfirmed) return;

  try {
    const response = await fetch(`${API_BASE_URL}/blogs/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.status === 401) {
      showToast(data.message || 'Session expired. Please login again.', true);
      handleLogout();
      openLoginModal();
      return;
    }

    if (response.ok) {
      showToast(data.message || 'Blog deleted from database.');
      await fetchBlogs();
    } else {
      showToast(data.message || 'Failed to delete blog from database.', true);
    }
  } catch (error) {
    console.error('Delete Blog API Error:', error);
    showToast('Unable to reach backend server to delete blog.', true);
  }
}

/**
 * Task 6: Display Proper Success and Error Messages
 */
function showToast(message, isError = false) {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notification' + (isError ? ' toast-error' : '');
  const icon = isError ? '⚠️' : '✨';
  toast.innerHTML = `<span>${icon}</span><span>${escapeHTML(message)}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

/* ==========================================================================
   Event Listeners & Initialization
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // Restore current user if logged in previously
  const storedUser = localStorage.getItem(USER_KEY);
  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser);
    } catch (e) {
      currentUser = null;
    }
  }
  updateAuthUI();

  // Set current year in footer
  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
  }

  // Fetch blogs from backend API (Task 4 & 7: Loading states & empty list handling)
  fetchBlogs();

  // Create post modal triggers
  if (openCreateModalBtn) openCreateModalBtn.addEventListener('click', openCreateModal);
  if (heroCreateBtn) heroCreateBtn.addEventListener('click', openCreateModal);
  if (quickAddBtn) quickAddBtn.addEventListener('click', openCreateModal);
  if (emptyAddBtn) emptyAddBtn.addEventListener('click', openCreateModal);

  // Close create/edit modal buttons
  if (closeModalBtn) closeModalBtn.addEventListener('click', closePostModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closePostModal);
  if (closeReadModalBtn) closeReadModalBtn.addEventListener('click', closeReadModal);

  // Auth modal triggers
  if (navLoginBtn) navLoginBtn.addEventListener('click', openLoginModal);
  if (navRegisterBtn) navRegisterBtn.addEventListener('click', openRegisterModal);
  if (navLogoutBtn) navLogoutBtn.addEventListener('click', handleLogout);

  // Auth modal close buttons
  if (closeRegisterModalBtn) closeRegisterModalBtn.addEventListener('click', closeRegisterModal);
  if (cancelRegisterModalBtn) cancelRegisterModalBtn.addEventListener('click', closeRegisterModal);
  if (closeLoginModalBtn) closeLoginModalBtn.addEventListener('click', closeLoginModal);
  if (cancelLoginModalBtn) cancelLoginModalBtn.addEventListener('click', closeLoginModal);

  // Switch between Login and Register modals
  if (switchToLoginLink) {
    switchToLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      openLoginModal();
    });
  }
  if (switchToRegisterLink) {
    switchToRegisterLink.addEventListener('click', (e) => {
      e.preventDefault();
      openRegisterModal();
    });
  }

  // Auth form submissions
  if (registerForm) registerForm.addEventListener('submit', handleRegisterSubmit);
  if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);

  // Close modals when clicking background overlay
  postModalOverlay.addEventListener('click', (e) => {
    if (e.target === postModalOverlay) closePostModal();
  });
  readModalOverlay.addEventListener('click', (e) => {
    if (e.target === readModalOverlay) closeReadModal();
  });
  if (registerModalOverlay) {
    registerModalOverlay.addEventListener('click', (e) => {
      if (e.target === registerModalOverlay) closeRegisterModal();
    });
  }
  if (loginModalOverlay) {
    loginModalOverlay.addEventListener('click', (e) => {
      if (e.target === loginModalOverlay) closeLoginModal();
    });
  }

  // Close modals with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!postModalOverlay.classList.contains('hidden')) closePostModal();
      if (!readModalOverlay.classList.contains('hidden')) closeReadModal();
      if (registerModalOverlay && !registerModalOverlay.classList.contains('hidden')) closeRegisterModal();
      if (loginModalOverlay && !loginModalOverlay.classList.contains('hidden')) closeLoginModal();
    }
  });

  // Post form submit
  postForm.addEventListener('submit', handleFormSubmit);

  // Search input with real-time filtering
  searchInput.addEventListener('input', (e) => {
    searchKeyword = e.target.value;
    renderPosts();
  });

  // Category filter pills
  categoryFilters.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;

    // Remove active class from all pills
    document.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
    pill.classList.add('active');

    currentCategory = pill.dataset.category || 'all';
    renderPosts();
  });

  // Mobile menu toggle
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a, button').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }
});
