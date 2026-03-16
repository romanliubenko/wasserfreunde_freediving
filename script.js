document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const langButtons = document.querySelectorAll('[data-lang-switch]');
  const navLinks = document.querySelectorAll('[data-nav]');
  const sections = document.querySelectorAll('[data-section]');
  const navToggle = document.querySelector('.nav-toggle');
  const navList = document.querySelector('.nav-links');

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

    try {
      localStorage.setItem('wf04-lang', lang);
    } catch {
      /* ignore */
    }
  }

  const storedLang =
    (typeof window !== 'undefined' &&
      window.localStorage &&
      window.localStorage.getItem('wf04-lang')) || 'de';
  setLanguage(storedLang === 'en' ? 'en' : 'de');

  langButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang-switch') === 'en' ? 'en' : 'de';
      setLanguage(lang);
    });
  });

  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.classList.toggle('is-open');
      navList.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  function closeMobileNav() {
    if (!navToggle || !navList) return;
    if (!navList.classList.contains('is-open')) return;
    navToggle.classList.remove('is-open');
    navList.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      closeMobileNav();
    });
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('id');
          if (!id) return;

          if (entry.isIntersecting) {
            navLinks.forEach((link) => {
              const href = link.getAttribute('href') || '';
              const isActive = href === `#${id}`;
              link.classList.toggle('is-active', isActive);
            });

            entry.target.classList.add('is-visible');
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    sections.forEach((section) => {
      section.classList.add('reveal');
      observer.observe(section);
    });
  } else {
    sections.forEach((section) => {
      section.classList.add('is-visible');
    });
  }

});

