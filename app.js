/**
 * ============================================================================
 * PORTFOLIO APPLICATION LOGIC
 * Theme toggle, contact form submission, and clipboard copy interactions.
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // ==========================================================================
  // 1. THEME TOGGLE (Dark / Light Mode)
  // ==========================================================================
  const themeToggle = document.getElementById('themeToggle');
  const htmlRoot = document.documentElement;

  // Retrieve saved theme preference or default to dark
  const savedTheme = localStorage.getItem('portfolio_theme') || 'dark';
  htmlRoot.setAttribute('data-theme', savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const currentTheme = htmlRoot.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      htmlRoot.setAttribute('data-theme', newTheme);
      localStorage.setItem('portfolio_theme', newTheme);
    });
  }

  // ==========================================================================
  // 2. CONTACT FORM & CLIPBOARD COPY
  // ==========================================================================
  const contactForm = document.getElementById('contactForm');
  const formNotification = document.getElementById('formNotification');
  const copyBtns = document.querySelectorAll('.copy-btn');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const btnSubmit = document.getElementById('btnSubmitContact');
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span>Transmitting Message...</span>';
      }

      setTimeout(() => {
        if (formNotification) {
          formNotification.className = 'form-notification success';
          formNotification.innerHTML = '✓ Message delivered successfully. Thank you! I will respond to your inquiry within 24 hours.';
          formNotification.style.display = 'block';
        }
        contactForm.reset();
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = `<span>Send Infrastructure Inquiry</span>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>`;
        }
      }, 900);
    });
  }

  copyBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      const textToCopy = this.dataset.copy;
      if (!textToCopy) return;

      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = this.textContent;
        this.textContent = 'Copied!';
        this.style.color = 'var(--accent-emerald)';
        this.style.borderColor = 'var(--accent-emerald)';

        setTimeout(() => {
          this.textContent = originalText;
          this.style.color = '';
          this.style.borderColor = '';
        }, 2000);
      });
    });
  });

  // ==========================================================================
  // 3. INTERACTIVE HERO CURSOR COLOR REVEAL
  // ==========================================================================
  const heroSection = document.getElementById('hero');
  const heroCursorGlow = document.getElementById('heroCursorGlow');

  if (heroSection) {
    heroSection.addEventListener('mouseenter', function () {
      heroSection.classList.add('is-color-active');
    });

    heroSection.addEventListener('mousemove', function (e) {
      heroSection.classList.add('is-color-active');
      if (heroCursorGlow) {
        const rect = heroSection.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        heroCursorGlow.style.left = x + 'px';
        heroCursorGlow.style.top = y + 'px';
      }
    });

    heroSection.addEventListener('mouseleave', function () {
      heroSection.classList.remove('is-color-active');
    });

    // Touch support for mobile tap
    heroSection.addEventListener('touchstart', function () {
      heroSection.classList.toggle('is-color-active');
    }, { passive: true });
  }

  // ==========================================================================
  // 4. INTERACTIVE MIDDLE (CONTACT) SECTION CURSOR COLOR REVEAL
  // ==========================================================================
  const contactSection = document.getElementById('contact');
  if (contactSection) {
    contactSection.addEventListener('mouseenter', function () {
      contactSection.classList.add('is-color-active');
    });

    contactSection.addEventListener('mouseleave', function () {
      contactSection.classList.remove('is-color-active');
    });

    // Touch support for mobile tap
    contactSection.addEventListener('touchstart', function () {
      contactSection.classList.toggle('is-color-active');
    }, { passive: true });
  }

  // ==========================================================================
  // 5. INTERACTIVE FOOTER CURSOR COLOR REVEAL
  // ==========================================================================
  const footerSection = document.getElementById('footer');
  if (footerSection) {
    footerSection.addEventListener('mouseenter', function () {
      footerSection.classList.add('is-color-active');
    });

    footerSection.addEventListener('mouseleave', function () {
      footerSection.classList.remove('is-color-active');
    });

    // Touch support for mobile tap
    footerSection.addEventListener('touchstart', function () {
      footerSection.classList.toggle('is-color-active');
    }, { passive: true });
  }

  // ==========================================================================
  // 6. HEADER SCROLL EFFECT & MOBILE NAVIGATION DRAWER
  // ==========================================================================
  const header = document.getElementById('header');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');

  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 15) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', function () {
      const isOpen = mobileDrawer.classList.toggle('open');
      mobileMenuBtn.classList.toggle('active', isOpen);
      mobileMenuBtn.setAttribute('aria-expanded', isOpen);
    });

    mobileDrawer.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', function () {
        mobileDrawer.classList.remove('open');
        mobileMenuBtn.classList.remove('active');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ==========================================================================
  // 7. SKILLS FILTER TABS
  // ==========================================================================
  const filterBtns = document.querySelectorAll('.filter-btn');
  const skillCards = document.querySelectorAll('.skill-card');

  if (filterBtns.length > 0 && skillCards.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        filterBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        const category = this.dataset.filter || 'all';

        skillCards.forEach(card => {
          const cardCat = card.dataset.category || '';
          if (category === 'all' || cardCat.includes(category)) {
            card.classList.remove('is-hidden');
          } else {
            card.classList.add('is-hidden');
          }
        });
      });
    });
  }

  // ==========================================================================
  // 8. INTERACTIVE PORTION CARDS CURSOR COLOR REVEAL
  // ==========================================================================
  const portionCards = document.querySelectorAll('.portion-card');
  portionCards.forEach(card => {
    card.addEventListener('mouseenter', function () {
      this.classList.add('is-color-active');
    });

    card.addEventListener('mousemove', function () {
      this.classList.add('is-color-active');
    });

    card.addEventListener('mouseleave', function () {
      this.classList.remove('is-color-active');
    });

    card.addEventListener('touchstart', function () {
      this.classList.toggle('is-color-active');
    }, { passive: true });
  });

});
