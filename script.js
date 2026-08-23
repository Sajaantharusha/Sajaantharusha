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
        
        // This adds a subtle radial gradient that follows the mouse
        card.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,77,0,0.1) 0%, var(--bg-card-hover) 40%, var(--bg-card) 100%)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.background = 'var(--bg-card)';
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
