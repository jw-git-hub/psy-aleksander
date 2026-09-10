/* =============================================
   Yandex.Metrika (счётчик 109129242)
   - только базовая аналитика: визиты, источники, цели, карта кликов

   Набор параметров совпадает с тем, что Метрика генерирует для этого счётчика.
   Раньше здесь стояли webvisor: true и ecommerce: 'dataLayer', хотя в самом
   счётчике «Вебвизор, карта скроллинга, аналитика форм» и «Электронная
   коммерция» выключены: параметры молча игнорировались, а README обещал
   записи сессий, которых не было. Включать эти опции надо парой — в коде
   и в настройках счётчика, иначе получается расхождение.

   Очередь ym объявляется сразу, синхронно с выполнением этого файла.
   Это обязательное условие: цели в main.js и quiz.js защищены проверкой
   typeof window.ym === 'function' и при её провале молча пропускают вызов —
   без очереди отложенная загрузка потеряла бы часть целей незаметно.

   Сам tag.js (88 КБ) грузится позже. Это самый тяжёлый ресурс страницы:
   47 % веса, 400 мс блокировки главного потока и +1,2 с к TTI. Ждём простоя
   браузера или первого действия человека — что случится раньше. Всё, что
   уйдёт в ym до этого момента, накопится в очереди и отправится при
   инициализации счётчика.
   ============================================= */

(function (window, document) {
  'use strict';

  var COUNTER_ID = 109129242;
  var TAG_URL = 'https://mc.yandex.ru/metrika/tag.js?id=' + COUNTER_ID;
  var IDLE_TIMEOUT_MS = 3500;
  var FALLBACK_DELAY_MS = 1000;
  var INTERACTION_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'];

  window.ym = window.ym || function () {
    (window.ym.a = window.ym.a || []).push(arguments);
  };
  window.ym.l = 1 * new Date();

  var isRequested = false;

  var loadCounter = function () {
    if (isRequested) return;
    isRequested = true;
    INTERACTION_EVENTS.forEach(function (eventName) {
      window.removeEventListener(eventName, loadCounter);
    });
    var script = document.createElement('script');
    script.async = 1;
    script.src = TAG_URL;
    document.head.appendChild(script);
  };

  window.ym(COUNTER_ID, 'init', {
    ssr: true,
    clickmap: true,
    referrer: document.referrer,
    url: location.href,
    accurateTrackBounce: true,
    trackLinks: true
  });

  // Первое действие человека — сигнал, что страница ему интересна
  INTERACTION_EVENTS.forEach(function (eventName) {
    window.addEventListener(eventName, loadCounter, { once: true, passive: true });
  });

  // Либо просто дождаться, пока браузер освободится
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(loadCounter, { timeout: IDLE_TIMEOUT_MS });
  } else {
    window.addEventListener('load', function () {
      window.setTimeout(loadCounter, FALLBACK_DELAY_MS);
    });
  }
})(window, document);
