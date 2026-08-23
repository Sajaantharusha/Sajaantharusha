// ========== Blog System (localStorage-based) ==========

(function () {
    'use strict';

    const STORAGE_KEY = 'sajan-blog-posts';
    const ADMIN_KEY = 'sajan-admin-mode';
    const ADMIN_PASSWORD = 'sajan2026'; // Change this to your secret password

    function isAdmin() {
        return sessionStorage.getItem(ADMIN_KEY) === 'true';
    }

    function setAdmin(val) {
        if (val) {
            sessionStorage.setItem(ADMIN_KEY, 'true');
        } else {
            sessionStorage.removeItem(ADMIN_KEY);
        }
    }

    function showAdminElements() {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = '';
        });
    }

    function hideAdminElements() {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
    }

    // --- Utility Functions ---
    function getPosts() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }

    function savePosts(posts) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    }

    function generateId() {
        return 'post-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr);
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }

    function getCategoryIcon(cat) {
        const icons = { tutorial: '📚', devlog: '🛠️', thoughts: '💭', news: '📰' };
        return icons[cat] || '📝';
    }

    function showToast(message) {
        const toast = document.getElementById('toast');
        const msg = document.getElementById('toast-message');
        if (!toast || !msg) return;
        msg.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // --- Blog Listing Page ---
    function initBlogListing() {
        const grid = document.getElementById('blog-posts-grid');
        const emptyState = document.getElementById('blog-empty');
        const searchInput = document.getElementById('blog-search');
        const filterBtns = document.querySelectorAll('.filter-btn');

        if (!grid) return;

        let currentFilter = 'all';
        let searchQuery = '';

        function renderPosts() {
            let posts = getPosts();

            // Apply filter
            if (currentFilter !== 'all') {
                posts = posts.filter(p => p.category === currentFilter);
            }

            // Apply search
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                posts = posts.filter(p =>
                    p.title.toLowerCase().includes(q) ||
                    p.excerpt.toLowerCase().includes(q) ||
                    (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
                );
            }

            // Sort by date (newest first)
            posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            if (posts.length === 0) {
                grid.style.display = 'none';
                if (emptyState) emptyState.style.display = 'block';
                return;
            }

            grid.style.display = 'grid';
            if (emptyState) emptyState.style.display = 'none';

            grid.innerHTML = posts.map(post => `
                <div class="blog-card" data-id="${post.id}" onclick="window.blogSystem.openPost('${post.id}')">
                    <div class="blog-card-actions admin-only" ${!isAdmin() ? 'style="display:none"' : ''}>
                        <button class="card-action-btn btn-edit-card" onclick="event.stopPropagation(); window.blogSystem.editPost('${post.id}')" title="Edit">✏️</button>
                        <button class="card-action-btn btn-delete-card" onclick="event.stopPropagation(); window.blogSystem.deletePost('${post.id}')" title="Delete">🗑️</button>
                    </div>
                    ${post.coverImage
                    ? `<img src="${post.coverImage}" alt="${post.title}" class="blog-card-cover">`
                    : `<div class="blog-card-cover-placeholder">${getCategoryIcon(post.category)}</div>`
                }
                    <div class="blog-card-body">
                        <div class="blog-card-meta">
                            <span class="blog-card-category">${post.category.toUpperCase()}</span>
                            <span class="blog-card-date">${formatDate(post.createdAt)}</span>
                            <span class="blog-card-status ${post.status === 'published' ? 'status-published' : 'status-draft'}">${post.status}</span>
                        </div>
                        <h3 class="blog-card-title">${post.title}</h3>
                        <p class="blog-card-excerpt">${post.excerpt || ''}</p>
                        ${post.tags && post.tags.length > 0
                    ? `<div class="blog-card-tags">${post.tags.map(t => `<span class="blog-tag">#${t}</span>`).join('')}</div>`
                    : ''
                }
                        <div class="blog-card-footer">
                            <span class="blog-read-more">READ_MORE →</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Filter buttons
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderPosts();
            });
        });

        // Search
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                searchQuery = searchInput.value.trim();
                renderPosts();
            });
        }

        // Initial render
        renderPosts();

        // Expose globally for card actions
        window.blogSystem = window.blogSystem || {};

        window.blogSystem.openPost = function (id) {
            const posts = getPosts();
            const post = posts.find(p => p.id === id);
            if (!post) return;

            // Create modal
            let modal = document.querySelector('.blog-post-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.className = 'blog-post-modal';
                document.body.appendChild(modal);
            }

            modal.innerHTML = `
                <button class="modal-close" onclick="window.blogSystem.closeModal()">✕</button>
                <div class="blog-post-modal-content">
                    ${post.coverImage
                    ? `<img src="${post.coverImage}" alt="${post.title}" class="modal-cover">`
                    : `<div class="modal-cover-placeholder">${getCategoryIcon(post.category)}</div>`
                }
                    <div class="modal-body">
                        <div class="modal-meta">
                            <span class="blog-card-category">${post.category.toUpperCase()}</span>
                            <span class="blog-card-date">${formatDate(post.createdAt)}</span>
                        </div>
                        <h1 class="modal-title">${post.title}</h1>
                        <div class="modal-content-body">${post.content}</div>
                        ${post.tags && post.tags.length > 0
                    ? `<div class="modal-tags">${post.tags.map(t => `<span class="blog-tag">#${t}</span>`).join('')}</div>`
                    : ''
                }
                    </div>
                </div>
            `;

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Close on backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) window.blogSystem.closeModal();
            });
        };

        window.blogSystem.closeModal = function () {
            const modal = document.querySelector('.blog-post-modal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        };

        window.blogSystem.editPost = function (id) {
            window.location.href = `blog-write.html?edit=${id}`;
        };

        window.blogSystem.deletePost = function (id) {
            if (!confirm('Are you sure you want to delete this post?')) return;
            let posts = getPosts();
            posts = posts.filter(p => p.id !== id);
            savePosts(posts);
            renderPosts();
        };

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                window.blogSystem.closeModal();
            }
        });
    }

    // --- Blog Write/Editor Page ---
    function initBlogEditor() {
        const form = document.getElementById('blog-form');
        if (!form) return;

        const titleInput = document.getElementById('post-title');
        const tagsInput = document.getElementById('post-tags');
        const contentEditor = document.getElementById('post-content');
        const excerptInput = document.getElementById('post-excerpt');
        const titleCount = document.getElementById('title-count');
        const excerptCount = document.getElementById('excerpt-count');
        const coverInput = document.getElementById('cover-input');
        const coverArea = document.getElementById('cover-upload-area');
        const coverPreview = document.getElementById('cover-preview');
        const uploadPlaceholder = document.getElementById('upload-placeholder');
        const removeCoverBtn = document.getElementById('remove-cover');
        const catBtns = document.querySelectorAll('.cat-btn');
        const toolbarBtns = document.querySelectorAll('.toolbar-btn');
        const saveDraftBtn = document.getElementById('save-draft');

        let selectedCategory = 'tutorial';
        let coverImageData = null;
        let editingPostId = null;

        // Check if editing an existing post
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');

        if (editId) {
            const posts = getPosts();
            const post = posts.find(p => p.id === editId);
            if (post) {
                editingPostId = post.id;
                titleInput.value = post.title;
                tagsInput.value = (post.tags || []).join(', ');
                contentEditor.innerHTML = post.content;
                excerptInput.value = post.excerpt || '';
                selectedCategory = post.category;
                coverImageData = post.coverImage || null;

                // Update category buttons
                catBtns.forEach(b => {
                    b.classList.toggle('active', b.dataset.category === selectedCategory);
                });

                // Show cover if exists
                if (coverImageData) {
                    coverPreview.src = coverImageData;
                    coverPreview.style.display = 'block';
                    uploadPlaceholder.style.display = 'none';
                    removeCoverBtn.style.display = 'flex';
                    coverArea.classList.add('has-image');
                }

                // Update counts
                if (titleCount) titleCount.textContent = post.title.length;
                if (excerptCount) excerptCount.textContent = (post.excerpt || '').length;

                // Update page title
                const writeTitle = document.querySelector('.write-title');
                if (writeTitle) writeTitle.innerHTML = 'EDIT <span class="accent-text">POST</span>';
            }
        }

        // Character counters
        if (titleInput && titleCount) {
            titleInput.addEventListener('input', () => {
                titleCount.textContent = titleInput.value.length;
            });
        }

        if (excerptInput && excerptCount) {
            excerptInput.addEventListener('input', () => {
                excerptCount.textContent = excerptInput.value.length;
            });
        }

        // Category selection
        catBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                catBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedCategory = btn.dataset.category;
            });
        });

        // Toolbar commands
        toolbarBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const cmd = btn.dataset.cmd;
                const value = btn.dataset.value || null;

                if (cmd === 'createLink') {
                    const url = prompt('Enter URL:');
                    if (url) document.execCommand(cmd, false, url);
                } else if (cmd === 'formatBlock') {
                    document.execCommand(cmd, false, value);
                } else {
                    document.execCommand(cmd, false, null);
                }

                contentEditor.focus();
            });
        });

        // Cover image upload
        if (coverArea && coverInput) {
            coverArea.addEventListener('click', (e) => {
                if (e.target === removeCoverBtn || removeCoverBtn.contains(e.target)) return;
                coverInput.click();
            });

            coverArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                coverArea.style.borderColor = 'var(--accent-orange)';
            });

            coverArea.addEventListener('dragleave', () => {
                coverArea.style.borderColor = '';
            });

            coverArea.addEventListener('drop', (e) => {
                e.preventDefault();
                coverArea.style.borderColor = '';
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    handleCoverFile(file);
                }
            });

            coverInput.addEventListener('change', () => {
                const file = coverInput.files[0];
                if (file) handleCoverFile(file);
            });

            if (removeCoverBtn) {
                removeCoverBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    coverImageData = null;
                    coverPreview.style.display = 'none';
                    uploadPlaceholder.style.display = 'block';
                    removeCoverBtn.style.display = 'none';
                    coverArea.classList.remove('has-image');
                    coverInput.value = '';
                });
            }
        }

        function handleCoverFile(file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Image must be under 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                coverImageData = e.target.result;
                coverPreview.src = coverImageData;
                coverPreview.style.display = 'block';
                uploadPlaceholder.style.display = 'none';
                removeCoverBtn.style.display = 'flex';
                coverArea.classList.add('has-image');
            };
            reader.readAsDataURL(file);
        }

        // Save post helper
        function savePost(status) {
            const title = titleInput.value.trim();
            if (!title) {
                titleInput.focus();
                titleInput.style.borderColor = '#ff4444';
                setTimeout(() => titleInput.style.borderColor = '', 2000);
                return false;
            }

            const content = contentEditor.innerHTML.trim();
            if (!content || content === '<br>') {
                contentEditor.focus();
                contentEditor.style.borderColor = '#ff4444';
                setTimeout(() => contentEditor.style.borderColor = '', 2000);
                return false;
            }

            const tags = tagsInput.value
                .split(',')
                .map(t => t.trim().toLowerCase())
                .filter(t => t.length > 0);

            const postData = {
                id: editingPostId || generateId(),
                title: title,
                content: content,
                excerpt: excerptInput.value.trim(),
                category: selectedCategory,
                tags: tags,
                coverImage: coverImageData,
                status: status,
                createdAt: editingPostId ? undefined : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            let posts = getPosts();

            if (editingPostId) {
                const idx = posts.findIndex(p => p.id === editingPostId);
                if (idx !== -1) {
                    postData.createdAt = posts[idx].createdAt;
                    posts[idx] = postData;
                }
            } else {
                posts.push(postData);
            }

            savePosts(posts);
            return true;
        }

        // Publish
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (savePost('published')) {
                showToast(editingPostId ? 'Post updated successfully!' : 'Post published successfully!');
                setTimeout(() => {
                    window.location.href = 'blog.html';
                }, 1500);
            }
        });

        // Save Draft
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => {
                if (savePost('draft')) {
                    showToast('Draft saved!');
                    setTimeout(() => {
                        window.location.href = 'blog.html';
                    }, 1500);
                }
            });
        }
    }

    // --- Admin Mode (Ctrl+Shift+A) ---
    function initAdminMode() {
        // Show admin elements if already authenticated this session
        if (isAdmin()) {
            showAdminElements();
        }

        // Secret keyboard shortcut: Ctrl+Shift+A
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();

                if (isAdmin()) {
                    // Toggle off admin mode
                    setAdmin(false);
                    hideAdminElements();
                    showToast('Admin mode deactivated');
                    return;
                }

                const pwd = prompt('🔐 Enter admin password:');
                if (pwd === ADMIN_PASSWORD) {
                    setAdmin(true);
                    showAdminElements();
                    showToast('Admin mode activated ✅');
                    // Re-render posts to show edit/delete
                    const grid = document.getElementById('blog-posts-grid');
                    if (grid) {
                        initBlogListing();
                    }
                } else if (pwd !== null) {
                    alert('❌ Incorrect password');
                }
            }
        });
    }

    // --- Password Gate for Write Page ---
    function initWritePageGate() {
        const form = document.getElementById('blog-form');
        if (!form) return; // Not on write page

        if (!isAdmin()) {
            // Show password prompt
            form.style.display = 'none';
            const writeHeader = document.querySelector('.write-header');
            if (writeHeader) writeHeader.style.display = 'none';

            const gate = document.createElement('div');
            gate.className = 'admin-gate';
            gate.innerHTML = `
                <div class="gate-content">
                    <div class="gate-icon">🔒</div>
                    <h2>ADMIN ACCESS REQUIRED</h2>
                    <p>Enter the admin password to write blog posts.</p>
                    <div class="gate-form">
                        <input type="password" id="gate-password" class="editor-input" placeholder="Enter password..." autocomplete="off">
                        <button type="button" id="gate-submit" class="btn-publish">🔓 UNLOCK</button>
                    </div>
                    <a href="blog.html" class="back-link" style="margin-top: 2rem;">← BACK TO BLOG</a>
                </div>
            `;

            const writeSection = document.querySelector('.write-section');
            if (writeSection) writeSection.appendChild(gate);

            const gateSubmit = document.getElementById('gate-submit');
            const gateInput = document.getElementById('gate-password');

            function attemptUnlock() {
                if (gateInput.value === ADMIN_PASSWORD) {
                    setAdmin(true);
                    gate.remove();
                    form.style.display = '';
                    if (writeHeader) writeHeader.style.display = '';
                    showToast('Access granted ✅');
                } else {
                    gateInput.style.borderColor = '#ff4444';
                    gateInput.value = '';
                    gateInput.placeholder = 'Incorrect password...';
                    setTimeout(() => {
                        gateInput.style.borderColor = '';
                        gateInput.placeholder = 'Enter password...';
                    }, 2000);
                }
            }

            gateSubmit.addEventListener('click', attemptUnlock);
            gateInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') attemptUnlock();
            });

            return false; // Don't init editor yet
        }

        return true; // Admin is authenticated
    }

    // --- Initialize ---
    document.addEventListener('DOMContentLoaded', () => {
        initAdminMode();
        initBlogListing();

        // Only init editor if admin is authenticated (or gets authenticated via gate)
        if (initWritePageGate() !== false) {
            initBlogEditor();
        }
    });

})();
