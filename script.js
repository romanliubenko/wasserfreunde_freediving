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

  function onUserScroll() {
    // User initiated scroll — drop the lock and follow position
    programmaticTarget = null;
    const id = getActiveSectionId();
    if (id) setActiveLink(id);
  }

  window.addEventListener('wheel',      () => { programmaticTarget = null; }, { passive: true });
  window.addEventListener('touchmove',  () => { programmaticTarget = null; }, { passive: true });
  window.addEventListener('keydown', (e) => {
    const keys = ['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '];
    if (keys.includes(e.key)) programmaticTarget = null;
  });

  window.addEventListener('scroll', () => {
    if (programmaticTarget) {
      // Still in programmatic scroll — keep the clicked item active
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