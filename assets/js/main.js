/**
* Template Name: Mentor
* Template URL: https://bootstrapmade.com/mentor-free-education-bootstrap-theme/
* Updated: Aug 07 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  "use strict";

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function mobileNavToogle() {
    document.querySelector('body').classList.toggle('mobile-nav-active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
  }
  mobileNavToggleBtn.addEventListener('click', mobileNavToogle);

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        mobileNavToogle();
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

  /**
   * Initiate glightbox
   */
  const glightbox = GLightbox({
    selector: '.glightbox'
  });

  /**
   * Initiate Pure Counter
   */
  new PureCounter();

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  
  /**
   * GAGE Dark Mode Toggle
   */
  function gageSetTheme(mode) {
    if (mode === "dark") {
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
    }
    try { localStorage.setItem("gage-theme", mode); } catch (e) {}
  }

  function gageGetTheme() {
    try {
      const saved = localStorage.getItem("gage-theme");
      if (saved === "dark" || saved === "light") return saved;
    } catch (e) {}
    // fall back to system preference
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
  }

  function gageUpdateThemeToggleUI(btn) {
    if (!btn) return;
    const isDark = document.documentElement.classList.contains("dark-mode");
    btn.setAttribute("aria-pressed", isDark ? "true" : "false");
    const icon = btn.querySelector("i");
    if (icon) {
      icon.classList.remove("bi-moon-stars", "bi-sun");
      icon.classList.add(isDark ? "bi-sun" : "bi-moon-stars");
    }
    btn.title = isDark ? "Passer au mode clair" : "Passer au mode sombre";
  }

  window.addEventListener("DOMContentLoaded", function() {
    const btn = document.getElementById("theme-toggle");
    // Ensure theme is applied (in case the inline init script is missing on a page)
    gageSetTheme(gageGetTheme());
    gageUpdateThemeToggleUI(btn);

    if (btn) {
      btn.addEventListener("click", function() {
        const next = document.documentElement.classList.contains("dark-mode") ? "light" : "dark";
        gageSetTheme(next);
        gageUpdateThemeToggleUI(btn);
      });
    }

    // If user changes OS theme and they haven't explicitly chosen a theme yet, follow the system
    try {
      const hasSaved = !!localStorage.getItem("gage-theme");
      if (!hasSaved && window.matchMedia) {
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function(e) {
          gageSetTheme(e.matches ? "dark" : "light");
          gageUpdateThemeToggleUI(btn);
        });
      }
    } catch (e) {}
  });


  window.addEventListener("load", initSwiper);

})();