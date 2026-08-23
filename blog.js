// ========== Blog System (Firebase-based) ==========

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBYIV_5dXHhwbdHRGSBCu74nE3qHINxxoM",
  authDomain: "photobase-74197.firebaseapp.com",
  projectId: "photobase-74197",
  storageBucket: "photobase-74197.firebasestorage.app",
  messagingSenderId: "276000068558",
  appId: "1:276000068558:web:1d361abda537d48943119f",
  measurementId: "G-R1YNFFM64B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ADMIN_KEY = 'sajan-admin-mode';
const ADMIN_PASSWORD = 'sajan2026';

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

// Fetch posts from Firestore
async function getPosts() {
    try {
        const querySnapshot = await getDocs(collection(db, "blog-posts"));
        const posts = [];
        querySnapshot.forEach((doc) => {
            posts.push({ id: doc.id, ...doc.data() });
        });
        return posts;
    } catch (e) {
        console.error("Error getting documents: ", e);
        return [];
    }
}

// Save or Update post in Firestore
async function savePostToDB(postData) {
    try {
        if (postData.id && !postData.id.startsWith('post-')) {
            // Update existing Firestore document
            const postRef = doc(db, "blog-posts", postData.id);
            // Don't save the id inside the document data
            const dataToSave = { ...postData };
            delete dataToSave.id;
            await updateDoc(postRef, dataToSave);
            return postData.id;
        } else {
            // Add new document
            const dataToSave = { ...postData };
            delete dataToSave.id; // Let Firestore generate the ID
            const docRef = await addDoc(collection(db, "blog-posts"), dataToSave);
            return docRef.id;
        }
    } catch (e) {
        console.error("Error saving document: ", e);
        throw e;
    }
}

// Delete post from Firestore
async function deletePostFromDB(id) {
    try {
        await deleteDoc(doc(db, "blog-posts", id));
    } catch (e) {
        console.error("Error deleting document: ", e);
        throw e;
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
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

// --- Image Resizing utility to keep Base64 size small for Firestore ---
function resizeImage(file, maxWidth, maxHeight, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// --- Blog Listing Page ---
async function initBlogListing() {
    const grid = document.getElementById('blog-posts-grid');
    const emptyState = document.getElementById('blog-empty');
    const searchInput = document.getElementById('blog-search');
    const filterBtns = document.querySelectorAll('.filter-btn');

    if (!grid) return;

    // Show loading state
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--accent-orange);">Loading posts from database...</div>';
    grid.style.display = 'block';

    let allPosts = await getPosts();
    let currentFilter = 'all';
    let searchQuery = '';

    function renderPosts() {
        let posts = [...allPosts];

        // Apply filter
        if (currentFilter !== 'all') {
            posts = posts.filter(p => p.category === currentFilter);
        }

        // Apply search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            posts = posts.filter(p =>
                p.title.toLowerCase().includes(q) ||
                (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
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
                        <span class="blog-card-category">${(post.category || 'tutorial').toUpperCase()}</span>
                        <span class="blog-card-date">${formatDate(post.createdAt)}</span>
                        <span class="blog-card-status ${post.status === 'published' ? 'status-published' : 'status-draft'}">${post.status || 'published'}</span>
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
        const post = allPosts.find(p => p.id === id);
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
                        <span class="blog-card-category">${(post.category || 'tutorial').toUpperCase()}</span>
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

    window.blogSystem.deletePost = async function (id) {
        if (!confirm('Are you sure you want to delete this post from the database?')) return;
        try {
            await deletePostFromDB(id);
            allPosts = allPosts.filter(p => p.id !== id);
            renderPosts();
            showToast('Post deleted');
        } catch (e) {
            alert('Failed to delete post: ' + e.message);
        }
    };

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.blogSystem.closeModal();
        }
    });
}

// --- Blog Write/Editor Page ---
async function initBlogEditor() {
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
    const submitBtn = form.querySelector('.btn-publish');

    let selectedCategory = 'tutorial';
    let coverImageData = null;
    let editingPostId = null;

    // Check if editing an existing post
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');

    if (editId) {
        submitBtn.textContent = "⏳ Loading post...";
        submitBtn.disabled = true;
        try {
            const posts = await getPosts();
            const post = posts.find(p => p.id === editId);
            if (post) {
                editingPostId = post.id;
                titleInput.value = post.title;
                tagsInput.value = (post.tags || []).join(', ');
                contentEditor.innerHTML = post.content;
                excerptInput.value = post.excerpt || '';
                selectedCategory = post.category || 'tutorial';
                coverImageData = post.coverImage || null;

                catBtns.forEach(b => {
                    b.classList.toggle('active', b.dataset.category === selectedCategory);
                });

                if (coverImageData) {
                    coverPreview.src = coverImageData;
                    coverPreview.style.display = 'block';
                    uploadPlaceholder.style.display = 'none';
                    removeCoverBtn.style.display = 'flex';
                    coverArea.classList.add('has-image');
                }

                if (titleCount) titleCount.textContent = post.title.length;
                if (excerptCount) excerptCount.textContent = (post.excerpt || '').length;

                const writeTitle = document.querySelector('.write-title');
                if (writeTitle) writeTitle.innerHTML = 'EDIT <span class="accent-text">POST</span>';
            }
        } catch (e) {
            console.error(e);
            alert("Failed to load post for editing");
        } finally {
            submitBtn.innerHTML = "🚀 UPDATE POST";
            submitBtn.disabled = false;
        }
    }

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

    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedCategory = btn.dataset.category;
        });
    });

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

    async function handleCoverFile(file) {
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be under 5MB before resizing.');
            return;
        }

        try {
            uploadPlaceholder.innerHTML = "⏳ Resizing image...";
            // Resize to max 1200x800, 70% quality jpeg to ensure it fits in Firestore 1MB limit
            const resizedBase64 = await resizeImage(file, 1200, 800, 0.7);
            
            coverImageData = resizedBase64;
            coverPreview.src = coverImageData;
            coverPreview.style.display = 'block';
            uploadPlaceholder.style.display = 'none';
            removeCoverBtn.style.display = 'flex';
            coverArea.classList.add('has-image');
            
            // Restore placeholder text for next time
            uploadPlaceholder.innerHTML = '<div class="upload-icon">📸</div><span>Click or drag to upload cover</span>';
        } catch (e) {
            console.error(e);
            alert("Failed to process image");
            uploadPlaceholder.innerHTML = '<div class="upload-icon">📸</div><span>Click or drag to upload cover</span>';
        }
    }

    async function savePost(status) {
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
            title: title,
            content: content,
            excerpt: excerptInput.value.trim(),
            category: selectedCategory,
            tags: tags,
            coverImage: coverImageData,
            status: status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (editingPostId) {
            postData.id = editingPostId;
            // Preserve original creation date if updating
            try {
                // Not perfectly robust without another fetch, but good enough
                const currentPosts = await getPosts();
                const existing = currentPosts.find(p => p.id === editingPostId);
                if (existing) postData.createdAt = existing.createdAt;
            } catch(e) {}
        }

        try {
            submitBtn.textContent = "⏳ Saving to cloud...";
            submitBtn.disabled = true;
            if (saveDraftBtn) saveDraftBtn.disabled = true;

            await savePostToDB(postData);
            return true;
        } catch (e) {
            alert('Error saving post: ' + e.message);
            return false;
        } finally {
            submitBtn.innerHTML = editingPostId ? "🚀 UPDATE POST" : "🚀 PUBLISH POST";
            submitBtn.disabled = false;
            if (saveDraftBtn) saveDraftBtn.disabled = false;
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (await savePost('published')) {
            showToast(editingPostId ? 'Post updated successfully!' : 'Post published successfully!');
            setTimeout(() => {
                window.location.href = 'blog.html';
            }, 1500);
        }
    });

    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', async () => {
            if (await savePost('draft')) {
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
    if (isAdmin()) {
        showAdminElements();
    }

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            e.preventDefault();

            if (isAdmin()) {
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
    if (!form) return;

    if (!isAdmin()) {
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
                initBlogEditor(); // Initialize now
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

        return false;
    }

    return true;
}

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    initAdminMode();
    initBlogListing();

    if (initWritePageGate() !== false) {
        initBlogEditor();
    }
});
