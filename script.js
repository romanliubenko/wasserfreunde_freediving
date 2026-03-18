document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const langButtons = document.querySelectorAll('[data-lang-switch]');
  const navLinks = document.querySelectorAll('[data-nav]');
  const sections = document.querySelectorAll('[data-section]');
  const navToggle = document.querySelector('.nav-toggle');
  const navList = document.querySelector('.nav-links');

  /* ─── Language ─── */
  function setLanguage(lang) {
    if (lang === 'en') {
      body.classList.remove('lang-de-active');
      body.classList.add('lang-en-active');
    } else {
      body.classList.remove('lang-en-active');
      body.classList.add('lang-de-active');
    }
    langButtons.forEach((btn) => {
      const isActive = btn.getAttribute('data-lang-switch') === lang;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
    try { localStorage.setItem('wf04-lang', lang); } catch { /* ignore */ }
  }

  const storedLang =
    (typeof window !== 'undefined' && window.localStorage &&
      window.localStorage.getItem('wf04-lang')) || 'de';
  setLanguage(storedLang === 'en' ? 'en' : 'de');

  langButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setLanguage(btn.getAttribute('data-lang-switch') === 'en' ? 'en' : 'de');
    });
  });

  /* ─── Mobile nav ─── */
  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.classList.toggle('is-open');
      navList.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  function closeMobileNav() {
    if (!navToggle || !navList || !navList.classList.contains('is-open')) return;
    navToggle.classList.remove('is-open');
    navList.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  /* ─── Nav highlight ─── */
  const navHeight = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '72', 10
  );

  function setActiveLink(id) {
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', (link.getAttribute('href') || '') === `#${id}`);
    });
  }

  function getActiveSectionId() {
    let activeSection = null;
    let closestDist = Infinity;
    sections.forEach((section) => {
      const top = section.getBoundingClientRect().top - navHeight;
      if (top <= 4 && Math.abs(top) < closestDist) {
        closestDist = Math.abs(top);
        activeSection = section;
      }
    });
    return activeSection ? activeSection.getAttribute('id') : null;
  }

  /*
   * `programmaticTarget`: set when a nav link is clicked.
   * Cleared only when the USER physically scrolls (wheel / touch),
   * not by scroll events fired by the browser during smooth-scroll animation.
   */
  let programmaticTarget = null;

  window.addEventListener('wheel',      () => { programmaticTarget = null; }, { passive: true });
  window.addEventListener('touchmove',  () => { programmaticTarget = null; }, { passive: true });
  window.addEventListener('keydown', (e) => {
    const keys = ['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '];
    if (keys.includes(e.key)) programmaticTarget = null;
  });

  window.addEventListener('scroll', () => {
    if (programmaticTarget) {
      setActiveLink(programmaticTarget);
    } else {
      const id = getActiveSectionId();
      if (id) setActiveLink(id);
    }
  }, { passive: true });

  /* ─── Nav link clicks ─── */
  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const target = document.querySelector(href);
      if (target) {
        programmaticTarget = target.getAttribute('id');
        setActiveLink(programmaticTarget);
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      closeMobileNav();
    });
  });

  /* ─── Mobile gallery slider ─── */
  const sliderInner = document.getElementById('gallery-slider-inner');
  const prevBtn     = document.getElementById('gallery-prev');
  const nextBtn     = document.getElementById('gallery-next');
  const dotsContainer = document.getElementById('gallery-dots');

  if (sliderInner && prevBtn && nextBtn && dotsContainer) {
    const slides = Array.from(sliderInner.querySelectorAll('.masonry-item'));
    const total  = slides.length;

    // Wrap each image in .img-wrap and size it correctly once loaded
    function fitImage(img) {
      const track = sliderInner.closest('.gallery-slider-track');
      const size = track ? track.offsetWidth : 300;
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      if (!nw || !nh) return;
      const isPortrait = nh > nw;
      let w, h;
      if (isPortrait) {
        h = size;
        w = Math.round(nw * size / nh);
      } else {
        w = size;
        h = Math.round(nh * size / nw);
      }
      img.style.width  = w + 'px';
      img.style.height = h + 'px';
    }

    slides.forEach(slide => {
      const img = slide.querySelector('img');
      if (img && !slide.querySelector('.img-wrap')) {
        const wrap = document.createElement('div');
        wrap.className = 'img-wrap';
        img.parentNode.insertBefore(wrap, img);
        wrap.appendChild(img);
        if (img.complete && img.naturalWidth) {
          fitImage(img);
        } else {
          img.addEventListener('load', () => fitImage(img), { once: true });
        }
      }
    });

    // Refit on resize
    let fitTimer;
    window.addEventListener('resize', () => {
      clearTimeout(fitTimer);
      fitTimer = setTimeout(() => {
        slides.forEach(slide => {
          const img = slide.querySelector('img');
          if (img && img.naturalWidth) fitImage(img);
        });
      }, 100);
    });
    let current  = 0;

    // Build dots
    slides.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = 'gallery-dot' + (i === 0 ? ' is-active' : '');
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    });
    const dots = Array.from(dotsContainer.querySelectorAll('.gallery-dot'));

    function goTo(index) {
      current = Math.max(0, Math.min(index, total - 1));
      slides.forEach((s, i) => s.classList.toggle('is-active', i === current));
      dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
      prevBtn.hidden = current === 0;
      nextBtn.hidden = current === total - 1;
    }

    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));

    // Swipe support — attach to track since sliderInner is display:contents
    const sliderTrack = sliderInner.closest('.gallery-slider-track');
    const swipeTarget = sliderTrack || sliderInner;
    let touchStartX = 0;
    let touchStartY = 0;
    let isDragging  = false;

    swipeTarget.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isDragging  = true;
    }, { passive: true });

    swipeTarget.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      // If horizontal intent dominates, block page scroll
      if (Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
      }
    }, { passive: false });

    swipeTarget.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        goTo(dx < 0 ? current + 1 : current - 1);
      }
    }, { passive: true });

    // Initialise
    goTo(0);
  }
  /* ─── Gallery expand / collapse (desktop only) ─── */
  const galleryMasonry  = document.getElementById('gallery-masonry');
  const galleryToggle   = document.getElementById('gallery-toggle');       // inline, below grid
  const galleryFixed    = document.getElementById('gallery-toggle-fixed'); // fixed overlay
  const gallerySection  = document.getElementById('galerie');

  if (galleryMasonry && galleryToggle && galleryFixed) {
    const allItems = Array.from(galleryMasonry.querySelectorAll('.masonry-item'));

    function getColumnCount() {
      const cols = parseInt(window.getComputedStyle(galleryMasonry).getPropertyValue('column-count'), 10);
      return isNaN(cols) ? 1 : cols;
    }

    function applyCollapsed() {
      const cols = getColumnCount();
      allItems.forEach((item, i) => {
        item.classList.toggle('gallery-hidden', i >= cols);
      });
    }

    function applyExpanded() {
      allItems.forEach(item => item.classList.remove('gallery-hidden'));
    }

    // Start collapsed
    applyCollapsed();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (galleryMasonry.classList.contains('is-collapsed')) applyCollapsed();
      }, 100);
    });

    const textCollapsed = { de: 'Alle Fotos anzeigen', en: 'Show all photos' };
    const textExpanded  = { de: 'Weniger anzeigen',    en: 'Show less' };

    function updateLabels(expanded) {
      // inline toggle: only visible when collapsed (it's the "expand" button)
      galleryToggle.style.display = expanded ? 'none' : 'flex';

      // update fixed button label (always "collapse")
      const de = galleryFixed.querySelector('.lang-de');
      const en = galleryFixed.querySelector('.lang-en');
      if (de) de.textContent = textExpanded.de;
      if (en) en.textContent = textExpanded.en;
    }

    function toggleGallery() {
      const isCollapsed = galleryMasonry.classList.contains('is-collapsed');
      if (isCollapsed) {
        galleryMasonry.classList.remove('is-collapsed');
        applyExpanded();
        updateLabels(true);
      } else {
        galleryMasonry.classList.add('is-collapsed');
        applyCollapsed();
        updateLabels(false);
        gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      updateFixedButton();
    }

    galleryToggle.addEventListener('click', toggleGallery);
    galleryFixed.addEventListener('click', toggleGallery);

    langButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const expanded = !galleryMasonry.classList.contains('is-collapsed');
        updateLabels(expanded);
      });
    });

    function updateFixedButton() {
      const expanded = !galleryMasonry.classList.contains('is-collapsed');
      galleryFixed.classList.toggle('is-visible', expanded && gallerySectionVisible);
    }

    let gallerySectionVisible = false;

    function checkGalleryVisibility() {
      if (!gallerySection) return;
      const rect = gallerySection.getBoundingClientRect();
      const vh = window.innerHeight;
      gallerySectionVisible = rect.top < vh && rect.bottom > 0;
      updateFixedButton();
    }

    let rafPending = false;
    window.addEventListener('scroll', () => {
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
          checkGalleryVisibility();
          rafPending = false;
        });
      }
    }, { passive: true });

    checkGalleryVisibility();
  }

  /* ─── Reveal animation ─── */
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
      },
      { threshold: 0.1 }
    );
    sections.forEach((section) => {
      section.classList.add('reveal');
      revealObserver.observe(section);
    });
  } else {
    sections.forEach((s) => s.classList.add('is-visible'));
  }

  // Initialise on load
  const id = getActiveSectionId();
  if (id) setActiveLink(id);
});