/**
 * BlogSpace - Modern Personal & Tech Blog Website
 * Pure Vanilla JavaScript (Beginner-Friendly & Connected to Express API)
 */

// Backend API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Storage key for localStorage
const STORAGE_KEY = 'blogspace_posts';
const USER_KEY = 'blogspace_user';

// Fallback cover image if user provides none or image fails to load
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80';

// Default initial sample posts (used if localStorage is completely empty)
const INITIAL_POSTS = [
  {
    id: 'post-1',
    title: 'The Future of Web Development with Modern CSS and JavaScript',
    category: 'Technology',
    author: 'Elena Vance',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    content: `Web development continues to evolve at a blistering pace. With features like CSS Container Queries, CSS Grid subgrids, and native JavaScript ES modules, developers can build responsive, high-performance web applications without heavy frameworks.\n\nSimplicity and accessibility are becoming core priorities. Exploring pure vanilla stacks gives programmers deeper mastery over core browser capabilities and creates blisteringly fast loading speeds.`,
    createdAt: 'Nov 18, 2026'
  },
  {
    id: 'post-2',
    title: 'Designing Aesthetic Dark & Purple User Interfaces',
    category: 'Design',
    author: 'Marcus Chen',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    content: `Dark themes with rich purple accents provide high visual contrast and reduce eye fatigue. Purple represents creativity, mystery, and innovation.\n\nWhen creating dark UI designs, avoid pure pitch black (#000000). Instead, use dark slate or rich navy shades with subtle ambient violet glows. Add smooth micro-interactions to make your interfaces feel lively, tactile, and modern.`,
    createdAt: 'Nov 20, 2026'
  },
  {
    id: 'post-3',
    title: '5 Daily Coding Habits That Will Level Up Your Career',
    category: 'Coding',
    author: 'Sarah Jenkins',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    content: `Consistency is the secret superpower in software engineering. Setting aside just 30 to 45 minutes every day to explore documentation, review open source pull requests, or refactor existing code builds massive momentum over months.\n\nKeep notes on what you learn, build small side experiments, and celebrate each small milestone along the journey!`,
    createdAt: 'Nov 22, 2026'
  }
];

// State variables
let currentCategory = 'all';
let searchKeyword = '';
let currentUser = null;

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
const switchToLoginLink = document.getElementById('switchToLoginLink');

const loginModalOverlay = document.getElementById('loginModalOverlay');
const closeLoginModalBtn = document.getElementById('closeLoginModalBtn');
const cancelLoginModalBtn = document.getElementById('cancelLoginModalBtn');
const loginForm = document.getElementById('loginForm');
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
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
   Storage Helper Functions
   ========================================================================== */

/**
 * Fetch all posts from localStorage.
 * If empty, initializes with default sample posts.
 */
function getPosts() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_POSTS));
    return [...INITIAL_POSTS];
  }
  try {
    return JSON.parse(data);
  } catch (err) {
    console.error('Error parsing localStorage posts:', err);
    return [];
  }
}

/**
 * Save posts array to localStorage.
 */
function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

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
   Render Functions
   ========================================================================== */

/**
 * Render blog posts grid based on category and search filters
 */
function renderPosts() {
  const allPosts = getPosts();

  // Filter by category
  let filtered = allPosts;
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

    // Click on card title or image opens full article view
    const titleElem = card.querySelector('.card-title');
    const imageWrap = card.querySelector('.card-image-wrap');
    titleElem.addEventListener('click', () => openReadModal(post.id));
    imageWrap.addEventListener('click', () => openReadModal(post.id));

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
 * Handle Registration via POST /api/register
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

  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (response.ok) {
      showToast(data.message || 'Registration successful!');
      closeRegisterModal();
      openLoginModal();
      // Pre-fill email in login modal
      loginEmailInput.value = email;
    } else {
      showToast(data.message || 'Registration failed.', true);
    }
  } catch (error) {
    console.error('Registration API Error:', error);
    showToast('Unable to reach server. Please ensure backend is running.', true);
  }
}

/**
 * Handle Login via POST /api/login
 */
async function handleLoginSubmit(e) {
  e.preventDefault();

  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value.trim();

  if (!email || !password) {
    showToast('Please enter both email and password.', true);
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      currentUser = data.user;
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      updateAuthUI();
      closeLoginModal();
      showToast(data.message || `Welcome, ${currentUser.name}!`);
    } else {
      showToast(data.message || 'Invalid credentials.', true);
    }
  } catch (error) {
    console.error('Login API Error:', error);
    showToast('Unable to reach server. Please ensure backend is running.', true);
  }
}

/**
 * Handle Logout
 */
function handleLogout() {
  currentUser = null;
  localStorage.removeItem(USER_KEY);
  updateAuthUI();
  showToast('Logged out successfully.');
}

/* ==========================================================================
   CRUD Operations & Blog Creation API
   ========================================================================== */

/**
 * Open Modal in "Create Post" mode
 */
function openCreateModal() {
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
  const posts = getPosts();
  const post = posts.find(p => p.id === id);
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
 * Open Read Full Post Modal
 */
function openReadModal(id) {
  const posts = getPosts();
  const post = posts.find(p => p.id === id);
  if (!post) return;

  const displayImage = post.image && post.image.trim() !== '' ? post.image : DEFAULT_IMAGE;

  readModalContent.innerHTML = `
    <img class="read-modal-image" src="${escapeHTML(displayImage)}" alt="${escapeHTML(post.title)}" onerror="this.onerror=null; this.src='${DEFAULT_IMAGE}';">
    <div class="read-modal-header">
      <span class="read-modal-badge">${escapeHTML(post.category)}</span>
      <h2 class="read-modal-title">${escapeHTML(post.title)}</h2>
      <div class="read-modal-meta">
        <span>By <strong>${escapeHTML(post.author)}</strong></span>
        <span>•</span>
        <span>${escapeHTML(post.createdAt || 'Recent')}</span>
        <span>•</span>
        <span>${calcReadTime(post.content)} min read</span>
      </div>
    </div>
    <div class="read-modal-body">
      ${escapeHTML(post.content)}
    </div>
  `;

  readModalOverlay.classList.remove('hidden');
}

/**
 * Close Read Full Post Modal
 */
function closeReadModal() {
  readModalOverlay.classList.add('hidden');
  readModalContent.innerHTML = '';
}

/**
 * Handle form submit (Both API Create and Local Edit)
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

  const posts = getPosts();

  // If editing existing post locally
  if (editingId) {
    const index = posts.findIndex(p => p.id === editingId);
    if (index !== -1) {
      posts[index] = {
        ...posts[index],
        title,
        category,
        author,
        image: image || posts[index].image || DEFAULT_IMAGE,
        content
      };
      savePosts(posts);
      showToast('Blog post updated successfully!');
      closePostModal();
      renderPosts();
    }
    return;
  }

  // Creating new post -> Call POST /api/blogs via fetch()
  try {
    const response = await fetch(`${API_BASE_URL}/blogs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        author,
        category,
        content
      })
    });

    const data = await response.json();

    if (response.ok) {
      // Backend returned created blog object
      const newPost = {
        id: 'post-' + (data.blog ? data.blog.id : Date.now()),
        title: data.blog ? data.blog.title : title,
        category: data.blog ? data.blog.category : category,
        author: data.blog ? data.blog.author : author,
        image: image || DEFAULT_IMAGE,
        content: data.blog ? data.blog.content : content,
        createdAt: getCurrentFormattedDate()
      };

      posts.unshift(newPost);
      savePosts(posts);
      showToast(data.message || 'Blog created successfully!');
      closePostModal();
      renderPosts();
    } else {
      showToast(data.message || 'Failed to create blog.', true);
    }
  } catch (error) {
    console.error('Create Blog API Error:', error);
    // Graceful fallback to local creation if backend server is unreachable
    const fallbackPost = {
      id: 'post-' + Date.now(),
      title,
      category,
      author,
      image: image || DEFAULT_IMAGE,
      content,
      createdAt: getCurrentFormattedDate()
    };
    posts.unshift(fallbackPost);
    savePosts(posts);
    showToast('Server offline: Blog saved locally!');
    closePostModal();
    renderPosts();
  }
}

/**
 * Delete a post with confirmation
 */
function deletePost(id) {
  const isConfirmed = confirm('Are you sure you want to delete this blog post? This action cannot be undone.');
  if (!isConfirmed) return;

  let posts = getPosts();
  posts = posts.filter(p => p.id !== id);
  savePosts(posts);
  showToast('Blog post deleted.');
  renderPosts();
}

/**
 * User-friendly temporary toast notification (Supports Success & Error)
 */
function showToast(message, isError = false) {
  // Remove existing toast if present
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
  }, 3000);
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

  // Initial render
  renderPosts();

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
