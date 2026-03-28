/**
 * Wedding Website JavaScript - Artistry by Pradeep
 * Main functionality for the wedding photography website
 */

/* ---- LOADER ---- */
function hideLoader() {
    document.getElementById('loader').classList.add('hidden');
}
const loaderTimer = setTimeout(hideLoader, 3000);
window.addEventListener('load', () => {
    clearTimeout(loaderTimer);
    setTimeout(hideLoader, 400);
});

/* ---- CURSOR ---- */
const dot = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top = my + 'px';
});

(function animR() {
    rx += (mx - rx) * .12;
    ry += (my - ry) * .12;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(animR);
})();

document.querySelectorAll('a,button,.gallery-item,.service-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
        dot.style.width = '14px';
        dot.style.height = '14px';
        ring.style.transform = 'translate(-50%,-50%) scale(1.6)';
        ring.style.borderColor = 'rgba(224,84,36,.8)';
    });
    el.addEventListener('mouseleave', () => {
        dot.style.width = '8px';
        dot.style.height = '8px';
        ring.style.transform = 'translate(-50%,-50%) scale(1)';
        ring.style.borderColor = 'rgba(224,84,36,.5)';
    });
});

/* ---- NAV ---- */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 60));

document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.toggle('open');
});

function closeMobile() {
    document.getElementById('mobileMenu').classList.remove('open');
}

/* ---- SCROLL REVEAL ---- */
const revObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('visible');
            revObs.unobserve(e.target);
        }
    });
}, { threshold: .08 });

document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el => revObs.observe(el));

/* ---- LIGHTBOX ---- */
const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
const lbData = galleryItems.map(item => {
    const img = item.querySelector('img');
    return {
        src: img?.getAttribute('src') || '',
        title: item.querySelector('.got-title')?.textContent || img?.getAttribute('alt') || '',
        cat: item.dataset.category || ''
    };
});

galleryItems.forEach((item, idx) => {
    item.removeAttribute('onclick');
    item.addEventListener('click', e => {
        e.preventDefault();
        openLightbox(idx);
    });
});

let curLb = 0;

function openLightbox(i) {
    curLb = i;
    updateLb();
    document.getElementById('lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
}

function navLightbox(d) {
    curLb = (curLb + d + lbData.length) % lbData.length;
    updateLb();
}

function updateLb() {
    const d = lbData[curLb];
    document.getElementById('lbImg').src = d.src;
    document.getElementById('lbImg').alt = d.title;
    document.getElementById('lbCaption').textContent = 'Artistry by Pradeep';
}

document.getElementById('lightbox').addEventListener('click', function(e) {
    if (e.target === this) closeLightbox();
});

document.addEventListener('keydown', e => {
    if (!document.getElementById('lightbox').classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navLightbox(-1);
    if (e.key === 'ArrowRight') navLightbox(1);
});

/* ---- FORM ---- */
function submitForm(e) {
    e.preventDefault();
    const f = document.getElementById('bookingForm');
    const s = document.getElementById('formSuccess');
    const formData = new FormData(f);
    const data = Object.fromEntries(formData.entries());

    // Send to WhatsApp
    const waNumber = "919176797802";
    let message = `*New Wedding Enquiry!*%0A%0A`;
    message += `*Name:* ${data.name}%0A`;
    message += `*Phone:* ${data.phone}%0A`;
    message += `*Email:* ${data.email}%0A`;
    message += `*Date:* ${data.wedding_date || 'Not specified'}%0A`;
    message += `*Service:* ${data.service || 'Not specified'}%0A`;
    message += `*Location:* ${data.location || 'Not specified'}%0A`;
    message += `*Story:* ${data.story || 'No story provided'}`;
    
    window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');

    // Send to Email (FormSubmit)
    fetch(f.action, {
        method: "POST",
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .catch(err => console.error("Email send error:", err));

    // Show Success UI
    f.style.opacity = '0';
    f.style.transition = 'opacity .4s';
    setTimeout(() => {
        f.style.display = 'none';
        s.style.display = 'block';
    }, 400);
}

/* ---- REVIEW SYSTEM ---- */
// Configuration - Update these URLs in config.js
const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeKN35AI7PjKHWEh3KVM1wTXy4RPdsKXFnKZKjdDXVXIiae4A/viewform";
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwEZ1HY18Y4_nLqFJ4ndJbCv5BApf34iRLhMBYnsLQ2TwIALgaoLyrkaQVTcjZ2glcK/exec";

// Generate QR code pointing directly to the Google Form
function setupReviewQRCode() {
    const qrEl = document.getElementById("reviewQRCode");
    if (!qrEl) return;
    const configured = GOOGLE_FORM_URL && !GOOGLE_FORM_URL.includes("YOUR_FORM_URL_HERE");
    const url = configured ? GOOGLE_FORM_URL : "https://forms.google.com";
    qrEl.src = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=" + encodeURIComponent(url);
}

// Fetch approved reviews from Google Sheets via Apps Script
async function loadApprovedReviews() {
    const container = document.getElementById("approvedReviewsList");
    const inner = document.getElementById("testimonialsInner");
    if (!container) return;

    const configured = APPS_SCRIPT_URL && !APPS_SCRIPT_URL.includes("YOUR_SCRIPT_ID");
    let reviews = [];

    if (configured) {
        try {
            const res = await fetch(APPS_SCRIPT_URL + "?t=" + Date.now());
            const data = await res.json();
            reviews = Array.isArray(data) ? data : [];
        } catch(err) {
            reviews = [];
        }
    }
    container.innerHTML = "";

    // Initial state: show only QR block until at least one approved review exists.
    if (!reviews.length) {
        container.style.display = "none";
        if (inner) inner.classList.add("only-qr");
        return;
    }

    container.style.display = "";
    if (inner) inner.classList.remove("only-qr");

    reviews.forEach((r, i) => {
        const stars = Math.min(5, Math.max(1, parseInt(r.stars, 10) || 5));
        const initials = (r.name || "A").split(/\s+/).map(w => w[0]).join("").slice(0,2).toUpperCase();
        const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
        const card = document.createElement("div");
        card.className = "testimonial-card reveal";
        card.style.transitionDelay = (i * 0.12).toFixed(2) + "s";
        card.innerHTML =
            '<div class="t-stars">' + "★".repeat(stars) + "☆".repeat(5-stars) + '</div>' +
            '<p class="t-text">&ldquo;' + esc(r.comment) + '&rdquo;</p>' +
            '<div class="t-author">' +
                '<div class="t-avatar">' + esc(initials) + '</div>' +
                '<div><div class="t-name">' + esc(r.name) + '</div>' +
                '<div class="t-date">' + esc(r.date || "") + '</div></div>' +
            '</div>';
        container.appendChild(card);
        revObs.observe(card);
    });
}

/* ---- PARALLAX ORBS ---- */
document.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth - .5) * 18;
    const y = (e.clientY / window.innerHeight - .5) * 18;
    const o1 = document.querySelector('.orb1');
    const o2 = document.querySelector('.orb2');
    if (o1) o1.style.transform = 'translate(' + (x * .5) + 'px,' + (y * .5) + 'px)';
    if (o2) o2.style.transform = 'translate(' + (-x * .3) + 'px,' + (-y * .3) + 'px)';
});

/* ---- EXPERIENCE YEAR AUTO-UPDATE ---- */
const startYear = 2016;
const currentYear = new Date().getFullYear();
const experience = currentYear - startYear;
document.querySelectorAll('.exp-years').forEach(el => {
    el.textContent = experience + '+';
});

/* ---- INITIALIZATION ---- */
document.addEventListener('DOMContentLoaded', function() {
    setupReviewQRCode();
    loadApprovedReviews();
});
