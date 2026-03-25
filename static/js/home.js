/* =========================
   HIGHLIGHT CAROUSEL
   (SIMPLE FADE/GALLERY + DOTS)
========================= */


const slides = document.querySelectorAll("[data-highlight-slide]");
const prevBtn = document.querySelector("[data-highlight-prev]");
const nextBtn = document.querySelector("[data-highlight-next]");
const dotsContainer = document.querySelector("[data-highlight-dots]");


let currentIndex = 0;


// Initialize
function initCarousel() {
  if (slides.length === 0) return;


  // Create dots
  if (dotsContainer) {
    dotsContainer.innerHTML = ''; // Clear existing
    slides.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.classList.add('dot');
      if (i === 0) dot.classList.add('is-active');
      dot.addEventListener('click', () => showSlide(i));
      dotsContainer.appendChild(dot);
    });
  }


  // Show first slide
  slides[0].classList.add('is-active');
}


function updateDots(index) {
  if (!dotsContainer) return;
  const dots = dotsContainer.querySelectorAll('.dot');
  dots.forEach(dot => dot.classList.remove('is-active'));
  if (dots[index]) dots[index].classList.add('is-active');
}


function showSlide(index) {
  // Wrap around index
  if (index >= slides.length) index = 0;
  if (index < 0) index = slides.length - 1;


  // Remove active class from all slides
  slides.forEach(slide => {
    slide.classList.remove('is-active');
  });


  // Add active class to new slide
  slides[index].classList.add('is-active');


  // Update dots
  updateDots(index);


  currentIndex = index;
}


function nextSlide() {
  showSlide(currentIndex + 1);
}


function prevSlide() {
  showSlide(currentIndex - 1);
}


nextBtn?.addEventListener("click", nextSlide);
prevBtn?.addEventListener("click", prevSlide);


// Auto-advance
let autoSlide = setInterval(nextSlide, 8000);


// Pause on hover (optional, good for UX)
const wrapper = document.querySelector('.highlightWrap');
wrapper?.addEventListener('mouseenter', () => clearInterval(autoSlide));
wrapper?.addEventListener('mouseleave', () => autoSlide = setInterval(nextSlide, 8000));


// Run init
initCarousel();




/* =========================
   DIVERSITY FADE-IN
========================= */


const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("fade-in");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.3 }
);


document
  .querySelectorAll(".diversity__stats, .diversity__art, .diversity__badge, .card")
  .forEach(el => observer.observe(el));


document.querySelectorAll(".fade-in-item").forEach(el => observer.observe(el));


/* =========================
   STAT BLOCKS — FADE + COUNT-UP
========================= */

/**
 * Animates a number from 0 to `target` over `duration` ms,
 * writing the result into `el` with optional prefix/suffix.
 * Adds comma formatting when `format === 'comma'`.
 */
function countUp(el, target, prefix, suffix, format, duration) {
  const start = performance.now();

  function formatNum(n) {
    if (format === 'comma') {
      return Math.floor(n).toLocaleString('en-US');
    }
    return Math.floor(n).toString();
  }

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = eased * target;

    el.textContent = prefix + formatNum(value) + suffix;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = prefix + formatNum(target) + suffix;
    }
  }

  requestAnimationFrame(step);
}

const statObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const block = entry.target;
      block.classList.add('show');

      // Find all countable elements inside this block
      block.querySelectorAll('[data-count]').forEach(el => {
        const target = parseFloat(el.dataset.count);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const format = el.dataset.format || '';
        const duration = 1800;

        // Small delay so the fade-in starts first
        setTimeout(() => countUp(el, target, prefix, suffix, format, duration), 300);
      });

      statObserver.unobserve(block);
    });
  },
  { threshold: 0.25 }
);

document.querySelectorAll('.stat-block').forEach(el => statObserver.observe(el));