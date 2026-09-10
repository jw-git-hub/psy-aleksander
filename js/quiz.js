/* =============================================
   Квиз «Подбор формата работы»
   - 3 шага опроса + финальный экран с результатом
   - формирование текста для копирования в Telegram
   - copy-to-clipboard через navigator.clipboard
   ============================================= */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('quiz-form');
  if (!form) return;

  const steps = Array.from(form.querySelectorAll('.quiz__step'));
  const totalQuestions = steps.length - 1; // последний шаг — экран результата
  const prevBtn = document.getElementById('quiz-prev');
  const nextBtn = document.getElementById('quiz-next');
  const progressEl = document.getElementById('quiz-progress');
  const resultTextEl = document.getElementById('quiz-result-text');
  const answerTextEl = document.getElementById('quiz-answer-text');
  const copyBtn = document.getElementById('quiz-copy-btn');

  let current = 0;

  /* Карты человекочитаемых меток для финального текста */
  const Q1_LABELS = {
    couple: 'Отношения в паре или семье',
    anxiety: 'Тревога, страхи, бессонница',
    self: 'Самооценка, поиск себя',
    crisis: 'Кризис, выгорание, потеря',
    other: 'Другое — расскажу при встрече'
  };
  const Q3_LABELS = {
    never: 'Впервые обращаюсь',
    some: 'Был опыт, не подошло',
    now: 'Сейчас работаю с другим'
  };
  const Q4_LABELS = {
    now: 'На этой неделе',
    '2w': 'В ближайшие 2 недели',
    later: 'Просто изучаю'
  };

  /* Рекомендация на основе запроса */
  const buildRecommendation = (q1) => {
    const themePart = {
      couple: 'парный или семейный формат',
      anxiety: 'индивидуальные сессии с фокусом на тревоге',
      self: 'индивидуальная работа с самооценкой и поиском себя',
      crisis: 'индивидуальное кризисное сопровождение',
      other: 'индивидуальный подбор формата'
    }[q1] || 'индивидуальный подбор формата';

    return `Похоже, вам подойдёт ${themePart} (онлайн или очно на о. Самуи). На первой 20-минутной встрече мы это обсудим — без обязательств продолжать.`;
  };

  /* Текст для копирования и отправки в Telegram */
  const buildAnswerText = (data) => {
    return [
      'Здравствуйте, Александр! Я с квиза на сайте.',
      '',
      `Запрос: ${Q1_LABELS[data.q1] || '—'}`,
      `Опыт: ${Q3_LABELS[data.q3] || '—'}`,
      `Когда удобно начать: ${Q4_LABELS[data.q4] || '—'}`,
      '',
      'Хотел(а) бы записаться на бесплатную 20-минутную встречу.'
    ].join('\n');
  };

  /* Перерисовка текущего состояния */
  const render = () => {
    steps.forEach((step, idx) => {
      step.classList.toggle('quiz__step--active', idx === current);
    });

    // Кнопка "Назад" — скрыта только на первом шаге.
    // С экрана результата вернуться можно: человек мог ошибиться в ответе
    // и должен иметь возможность переписать свой запрос.
    if (prevBtn) {
      prevBtn.hidden = (current === 0);
    }

    // На финальном шаге кнопка "Далее" не нужна
    if (nextBtn) {
      nextBtn.hidden = (current >= totalQuestions);
    }

    // Прогресс
    if (progressEl) {
      if (current >= totalQuestions) {
        progressEl.textContent = 'Готово';
      } else {
        progressEl.textContent = `Шаг ${current + 1} из ${totalQuestions}`;
      }
    }

    // Включаем "Далее" только если на текущем шаге выбран радио
    if (current < totalQuestions && nextBtn) {
      const radios = steps[current].querySelectorAll('input[type="radio"]');
      const checked = Array.from(radios).some((r) => r.checked);
      nextBtn.disabled = !checked;
    }
  };

  /* Перевод фокуса на текущий шаг.
     Кнопки «Далее» и «Назад» становятся disabled или hidden прямо под фокусом,
     и браузер роняет его на <body> — клавиатурный пользователь после каждого
     вопроса начинал бы обход страницы заново. Вызываем только при явной
     навигации: на первой отрисовке фокус трогать нельзя. */
  const focusCurrentStep = () => {
    const step = steps[current];
    if (step) step.focus({ preventScroll: true });
  };

  /* Сборка результата на финальном шаге */
  let quizCompletedFired = false;

  const showResult = () => {
    // Цель quiz_completed — квиз пройден до конца. Отправляем один раз:
    // с экрана результата можно вернуться назад и прийти сюда снова.
    if (!quizCompletedFired && typeof window.ym === 'function') {
      quizCompletedFired = true;
      window.ym(109129242, 'reachGoal', 'quiz_completed');
    }
    const data = new FormData(form);
    const obj = {
      q1: data.get('q1') || '',
      q3: data.get('q3') || '',
      q4: data.get('q4') || ''
    };
    if (resultTextEl) {
      resultTextEl.textContent = buildRecommendation(obj.q1);
    }
    if (answerTextEl) {
      answerTextEl.textContent = buildAnswerText(obj);
    }
  };

  /* Слушатели */

  // Цель quiz_started — отправляем один раз при первом взаимодействии с квизом
  let quizStartFired = false;
  form.addEventListener('change', () => {
    if (!quizStartFired) {
      quizStartFired = true;
      if (typeof window.ym === 'function') {
        window.ym(109129242, 'reachGoal', 'quiz_started');
      }
    }
    render();
  });

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (current < totalQuestions - 1) {
        current += 1;
      } else if (current === totalQuestions - 1) {
        // Переход на экран результата
        current = totalQuestions;
        showResult();
      }
      render();
      focusCurrentStep();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (current > 0) {
        current -= 1;
        render();
        focusCurrentStep();
      }
    });
  }

  /* Copy-to-clipboard */
  const COPY_SUCCESS_MS = 2000;

  /* Фолбэк для старых браузеров и незащищённого контекста.
     execCommand при отказе возвращает false и не бросает исключение — без
     проверки возврата кнопка рапортовала бы об успехе на пустом буфере. */
  const copyViaExecCommand = (text) => {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.className = 'quiz__clipboard-fallback';
    document.body.appendChild(field);
    field.select();
    const isCopied = document.execCommand('copy');
    document.body.removeChild(field);
    if (!isCopied) {
      throw new Error('execCommand copy отклонён браузером');
    }
  };

  const copyToClipboard = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    copyViaExecCommand(text);
  };

  /* Выделяем текст, чтобы человеку осталось нажать Ctrl+C */
  const selectAnswerText = () => {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(answerTextEl);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const setCopyState = (state) => {
    copyBtn.classList.toggle('is-copied', state === 'copied');
    copyBtn.classList.toggle('is-copy-failed', state === 'failed');
  };

  if (copyBtn && answerTextEl) {
    copyBtn.addEventListener('click', async () => {
      const text = answerTextEl.textContent || '';
      try {
        await copyToClipboard(text);
        setCopyState('copied');
        setTimeout(() => setCopyState('idle'), COPY_SUCCESS_MS);
      } catch (err) {
        // Отказ буфера обмена — во встроенном браузере мессенджера или при
        // отклонённом разрешении. Молчать нельзя: это ключевой шаг воронки.
        selectAnswerText();
        setCopyState('failed');
      }
    });
  }

  // Инициализация
  render();
});
