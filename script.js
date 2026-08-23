// Scroll reveal animation — supports all animation variants
function reveal() {
    const allAnimated = document.querySelectorAll(
        ".reveal, .reveal-fade-up, .reveal-left, .reveal-right, .reveal-scale, .reveal-flip, .reveal-blur"
    );

    const windowHeight = window.innerHeight;

    allAnimated.forEach((el) => {
        const elementTop = el.getBoundingClientRect().top;
        const elementVisible = 80;

        if (elementTop < windowHeight - elementVisible) {
            el.classList.add("active");
        }
    });
}

window.addEventListener("scroll", reveal);

// Trigger once on load
reveal();

// Add smooth hover effects to project cards
const cards = document.querySelectorAll('.project-card');

cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const glowColor = isLight ? 'rgba(255,77,0,0.06)' : 'rgba(255,77,0,0.1)';
        const hoverBg = isLight ? '#fafafa' : 'var(--bg-card-hover)';
        const baseBg = isLight ? '#ffffff' : 'var(--bg-card)';
        
        card.style.background = `radial-gradient(circle at ${x}px ${y}px, ${glowColor} 0%, ${hoverBg} 40%, ${baseBg} 100%)`;
    });
    
    card.addEventListener('mouseleave', () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        card.style.background = isLight ? '#ffffff' : 'var(--bg-card)';
    });
});

// Simple Page Loader Logic
document.addEventListener("DOMContentLoaded", () => {
    const loader = document.getElementById("simple-loader");
    
    // Minimum delay to show off the loader animation
    const minDelay = new Promise(resolve => setTimeout(resolve, 2000));
    
    // Window load event
    const loadEvent = new Promise(resolve => {
        if (document.readyState === 'complete') {
            resolve();
        } else {
            window.addEventListener('load', resolve);
        }
    });

    // Wait for both load event and minimum delay
    Promise.all([minDelay, loadEvent]).then(() => {
        if (loader) {
            loader.classList.add("loaded");
            // Remove from DOM after fade out transition (0.8s)
            setTimeout(() => {
                loader.remove();
            }, 800);
        }
    });
});

// ========== Theme Toggle ==========
(function() {
    // Apply saved theme immediately (before paint) to avoid flash
    const savedTheme = localStorage.getItem('sajan-theme') || 'dark';
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    document.addEventListener('DOMContentLoaded', () => {
        const toggleBtn = document.getElementById('theme-toggle');
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', () => {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-theme');
            
            if (currentTheme === 'light') {
                html.removeAttribute('data-theme');
                localStorage.setItem('sajan-theme', 'dark');
            } else {
                html.setAttribute('data-theme', 'light');
                localStorage.setItem('sajan-theme', 'light');
            }
        });
    });
})();
