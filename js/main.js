/* =============================================
   Основной скрипт — Сайт психолога
   Модули: бургер-меню, smooth scroll, header-scroll,
           scroll-анимации, активный пункт навигации
   ============================================= */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* =============================================
     1. Бургер-меню (мобильное)
     - переключает классы на nav, body, burger, backdrop
     - управляет атрибутами aria-expanded и aria-label
     - управляет inert: закрытое меню становится непрозрачным для Tab
     ============================================= */
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.nav');
  const navBackdrop = document.querySelector('.nav-backdrop');
  const navLinks = document.querySelectorAll('.nav__link');
  const MOBILE_BREAKPOINT = 1024;

  // Синхронизирует состояние мобильного меню при ресайзе.
  // - На десктопе: nav всегда доступен, обязательно снимаем
  //   .nav--open и body.is-locked, иначе после ресайза с открытого
  //   мобильного меню скролл остаётся заблокирован.
  // - На мобильном: nav без класса .nav--open получает inert,
  //   чтобы Tab пропускал скрытое меню.
  const syncNavInert = () => {
    if (!nav) return;
    const isDesktop = window.innerWidth >= MOBILE_BREAKPOINT;
    if (isDesktop) {
      nav.classList.remove('nav--open');
      nav.removeAttribute('inert');
      if (burger) {
        burger.classList.remove('is-active');
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Открыть меню');
      }
      if (navBackdrop) navBackdrop.classList.remove('is-visible');
      document.body.classList.remove('is-locked');
      return;
    }
    const isOpen = nav.classList.contains('nav--open');
    if (isOpen) {
      nav.removeAttribute('inert');
    } else {
      nav.setAttribute('inert', '');
    }
  };

  const openMenu = () => {
    if (!nav || !burger) return;
    nav.classList.add('nav--open');
    burger.classList.add('is-active');
    if (navBackdrop) navBackdrop.classList.add('is-visible');
    document.body.classList.add('is-locked');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Закрыть меню');
    syncNavInert();
  };

  const closeMenu = () => {
    if (!nav || !burger) return;
    nav.classList.remove('nav--open');
    burger.classList.remove('is-active');
    if (navBackdrop) navBackdrop.classList.remove('is-visible');
    document.body.classList.remove('is-locked');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    syncNavInert();
  };

  if (burger && nav) {
    burger.addEventListener('click', () => {
      const isOpen = nav.classList.contains('nav--open');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  // Клик по затемнению — закрыть меню
  if (navBackdrop) {
    navBackdrop.addEventListener('click', closeMenu);
  }

  // Инициализация и реакция на ресайз окна
  syncNavInert();
  window.addEventListener('resize', syncNavInert);


  /* =============================================
     2. Smooth scroll по якорям
     - перехватываем клики по ссылкам с href="#..."
     - закрываем мобильное меню при переходе
     - учитываем фиксированную шапку при позиционировании
     ============================================= */
  const header = document.querySelector('.header');

  const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');

  smoothScrollLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      // Пропускаем пустые/некорректные якоря
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();

      // Закрываем мобильное меню перед прокруткой
      if (nav && nav.classList.contains('nav--open')) {
        closeMenu();
      }

      // Учитываем высоту шапки, чтобы заголовок секции не уезжал под неё
      const headerOffset = header ? header.offsetHeight : 0;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;

      window.scrollTo({
        top: targetTop,
        behavior: 'smooth'
      });
    });
  });


  /* =============================================
     3. Header scroll — добавляем тень при скролле > 50px
     + замер высоты шапки в --header-height для CSS
       (нужно hero, чтобы корректно вычислить min-height
        с учётом sticky-шапки)
     ============================================= */
  const SCROLL_THRESHOLD = 50;

  const updateHeaderState = () => {
    if (!header) return;
    if (window.scrollY > SCROLL_THRESHOLD) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
  };

  const updateHeaderHeightVar = () => {
    if (!header) return;
    const height = header.offsetHeight;
    document.documentElement.style.setProperty('--header-height', `${height}px`);
  };

  // Инициализация при загрузке + слушатели скролла/ресайза
  updateHeaderState();
  updateHeaderHeightVar();
  window.addEventListener('scroll', updateHeaderState, { passive: true });
  window.addEventListener('resize', updateHeaderHeightVar);
  window.addEventListener('load', updateHeaderHeightVar);


  /* =============================================
     4. Scroll-анимации через IntersectionObserver
     - элементы с .animate-on-scroll получают .is-visible
       при попадании во вьюпорт
     ============================================= */
  const animatedElements = document.querySelectorAll('.animate-on-scroll');

  if ('IntersectionObserver' in window && animatedElements.length > 0) {
    const animationObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    animatedElements.forEach((el) => animationObserver.observe(el));
  } else {
    // Фолбэк: если IntersectionObserver не поддерживается — показать сразу
    animatedElements.forEach((el) => el.classList.add('is-visible'));
  }


  /* =============================================
     5. Lightbox для документов
     - клик по миниатюре открывает полноэкранный просмотр
     - закрытие по кнопке, клику по фону или Esc
     - inert на закрытой модалке + ловушка фокуса на открытой
     ============================================= */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = lightbox ? lightbox.querySelector('.lightbox__img') : null;
  const lightboxCaption = lightbox ? lightbox.querySelector('.lightbox__caption') : null;
  const lightboxCloseBtn = lightbox ? lightbox.querySelector('.lightbox__close') : null;
  const docButtons = document.querySelectorAll('.doc-card__btn');

  // Соседи модалки, которым нужно ставить inert на время её открытия —
  // так Tab не сможет уйти на скрытый контент за фоном
  const lightboxSiblings = [
    document.querySelector('header.header'),
    document.querySelector('main'),
    document.querySelector('footer.footer')
  ].filter(Boolean);

  // Закрытая модалка не должна попадать в порядок Tab.
  if (lightbox && !lightbox.classList.contains('is-open')) {
    lightbox.setAttribute('inert', '');
  }

  let lastFocusedDocBtn = null;

  const openLightbox = (src, caption, alt, sourceBtn) => {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    if (lightboxCaption) {
      lightboxCaption.textContent = caption || '';
    }
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    lightbox.removeAttribute('inert');
    // Делаем остальной контент недоступным для фокуса и скринридеров
    lightboxSiblings.forEach((el) => el.setAttribute('inert', ''));
    document.body.classList.add('is-locked');
    lastFocusedDocBtn = sourceBtn || null;
    if (lightboxCloseBtn) {
      lightboxCloseBtn.focus();
    }
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.setAttribute('inert', '');
    lightboxSiblings.forEach((el) => el.removeAttribute('inert'));
    document.body.classList.remove('is-locked');
    // Очищаем src, чтобы не держать большой ресурс в памяти
    if (lightboxImg) {
      lightboxImg.removeAttribute('src');
      lightboxImg.alt = '';
    }
    if (lastFocusedDocBtn) {
      lastFocusedDocBtn.focus();
      lastFocusedDocBtn = null;
    }
  };

  docButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const src = btn.dataset.docSrc;
      const caption = btn.dataset.docCaption || '';
      const img = btn.querySelector('img');
      const alt = img ? img.alt : '';
      if (src) {
        openLightbox(src, caption, alt, btn);
      }
    });
  });

  if (lightboxCloseBtn) {
    lightboxCloseBtn.addEventListener('click', closeLightbox);
  }

  // Клик по фону модалки (но не по картинке/тексту) — закрыть
  if (lightbox) {
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });
  }


  /* =============================================
     6. Глобальный Esc-обработчик
     - сначала закрываем lightbox (если открыт)
     - затем мобильное меню
     ============================================= */
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (lightbox && lightbox.classList.contains('is-open')) {
      closeLightbox();
      return;
    }
    if (nav && nav.classList.contains('nav--open')) {
      closeMenu();
    }
  });


  /* =============================================
     7. Активный пункт навигации при скролле
     - наблюдаем только секции, у которых есть соответствующая ссылка в nav
     - так избегаем сброса подсветки при прокрутке через #process,
       у которого нет nav-link
     ============================================= */
  const navLinkHrefs = new Set(
    Array.from(navLinks).map((link) => link.getAttribute('href'))
  );
  const observableSections = Array.from(
    document.querySelectorAll('main section[id]')
  ).filter((section) => navLinkHrefs.has(`#${section.id}`));

  if ('IntersectionObserver' in window && observableSections.length > 0 && navLinks.length > 0) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            const isMatch = link.getAttribute('href') === `#${id}`;
            link.classList.toggle('is-active', isMatch);
          });
        }
      });
    }, {
      // Учитываем шапку в верхнем отступе и оставляем нижнюю границу,
      // чтобы переключение происходило, когда секция занимает основную часть экрана
      rootMargin: '-30% 0px -50% 0px',
      threshold: 0
    });

    observableSections.forEach((section) => navObserver.observe(section));
  }


  /* =============================================
     8. Аккордеон «Мой подход» — фолбэк «один открыт за раз»
     - современные движки делают это сами через name="approach-method"
       на <details>, но Safari < 17 и старые мобильные браузеры эту
       группировку не поддерживают — закрываем соседние явно
     ============================================= */
  const approachCards = document.querySelectorAll('details[name="approach-method"]');
  approachCards.forEach((card) => {
    card.addEventListener('toggle', () => {
      if (!card.open) return;
      approachCards.forEach((other) => {
        if (other !== card && other.open) {
          other.open = false;
        }
      });
    });
  });


  /* =============================================
     9. Sticky CTA (мобильный) — показ после hero,
        скрытие у футера и при открытом меню/лайтбоксе
     ============================================= */
  const stickyCta = document.getElementById('sticky-cta');
  const heroSection = document.querySelector('.hero');
  const footerEl = document.querySelector('.footer');

  if (stickyCta && heroSection) {
    let scheduled = false;

    const updateStickyCta = () => {
      scheduled = false;
      // Если открыто меню или лайтбокс — body получает класс .is-locked.
      // В этих состояниях sticky-CTA не показываем, чтобы не перекрывать оверлей.
      if (document.body.classList.contains('is-locked')) {
        stickyCta.classList.remove('is-visible');
        stickyCta.setAttribute('aria-hidden', 'true');
        return;
      }

      const heroBottom = heroSection.getBoundingClientRect().bottom;
      const footerTop = footerEl ? footerEl.getBoundingClientRect().top : Number.POSITIVE_INFINITY;
      const viewportH = window.innerHeight;

      // Показываем, когда hero ушёл вверх и футер ещё не близко (зазор 80px)
      const shouldShow = heroBottom < 0 && footerTop > viewportH + 80;

      if (shouldShow) {
        stickyCta.classList.add('is-visible');
        stickyCta.setAttribute('aria-hidden', 'false');
      } else {
        stickyCta.classList.remove('is-visible');
        stickyCta.setAttribute('aria-hidden', 'true');
      }
    };

    const requestStickyCtaUpdate = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(updateStickyCta);
    };

    window.addEventListener('scroll', requestStickyCtaUpdate, { passive: true });
    window.addEventListener('resize', requestStickyCtaUpdate);
    // Также реагируем на открытие/закрытие меню и лайтбокса —
    // они меняют body.is-locked. MutationObserver на классе body.
    const bodyClassObserver = new MutationObserver(requestStickyCtaUpdate);
    bodyClassObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Первичная инициализация
    updateStickyCta();
  }


  /* =============================================
     10. UTM-метки — сохранение в sessionStorage
     - При загрузке читаем utm_source/medium/campaign/term/content + yclid/gclid
       из URL и сохраняем в sessionStorage.
     - В ссылки на t.me/lex4747 параметры НЕ дописываем
       (Telegram-личка их игнорирует, а deep-link к боту мы не используем).
     - Эти данные пригодятся, когда подключим Метрику/VK Pixel в analytics.js
     ============================================= */
  try {
    const params = new URLSearchParams(window.location.search);
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'yclid', 'gclid'];
    const collected = {};
    utmKeys.forEach((key) => {
      const value = params.get(key);
      if (value) collected[key] = value;
    });
    if (Object.keys(collected).length > 0) {
      sessionStorage.setItem('utm', JSON.stringify(collected));
    }
  } catch (err) {
    // sessionStorage может быть недоступен (приватный режим, отключён) — молча игнорируем
  }

});

/* =============================================
   Модуль 11: Делегированный трекинг кликов через Яндекс.Метрику
   Любой клик по элементу с data-analytics="goal_id" отправляет цель.
   ============================================= */

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-analytics]');
  if (!target) return;
  const goal = target.dataset.analytics;
  if (typeof window.ym !== 'function' || !goal) return;
  window.ym(109129242, 'reachGoal', goal);
});
