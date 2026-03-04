const config = window.ARK_CONFIG || {};
const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
const apiBaseUrl = (config.apiBaseUrl || "").replace(/\/$/, "");
const leadEndpoint = config.leadEndpoint || config.briefEndpoint || "/api/lead";

const steps = [
  {
    id: "core",
    title: "Какой формат нужен?",
    description: "Выбери точку входа. Остальной контур app соберет сам.",
    options: [
      {
        id: "mini_app",
        kicker: "core",
        title: "Mini App",
        subtitle: "внутри Telegram",
        color: "orange",
        priceDelta: 0,
        timeDelta: 0,
        layers: ["Telegram UI", "Intake flow", "Backend"],
      },
      {
        id: "automation",
        kicker: "core",
        title: "AI Flow",
        subtitle: "FAQ, routing, intake",
        color: "green",
        priceDelta: -10,
        timeDelta: -1,
        layers: ["LLM logic", "Routing", "CRM handoff"],
      },
      {
        id: "bot_payments",
        kicker: "core",
        title: "Bot + Pay",
        subtitle: "бот, оплата, тарифы",
        color: "blue",
        priceDelta: -5,
        timeDelta: 0,
        layers: ["Bot UI", "Payments", "Access control"],
      },
      {
        id: "web_app",
        kicker: "core",
        title: "Web App",
        subtitle: "кабинет или сервис",
        color: "dark",
        priceDelta: 15,
        timeDelta: 2,
        layers: ["Web UI", "API", "Business logic"],
      },
    ],
  },
  {
    id: "goal",
    title: "Что должен дать первый релиз?",
    description: "Один главный outcome, без лишнего распыления.",
    options: [
      {
        id: "leads",
        kicker: "goal",
        title: "Лиды",
        subtitle: "заявки, запись, продажи",
        color: "orange",
        priceDelta: 0,
        timeDelta: 0,
        layers: ["Lead capture", "Qualification"],
      },
      {
        id: "ops",
        kicker: "goal",
        title: "Ops",
        subtitle: "рутина, FAQ, заявки",
        color: "green",
        priceDelta: 5,
        timeDelta: 1,
        layers: ["Process flow", "Internal tooling"],
      },
      {
        id: "mvp",
        kicker: "goal",
        title: "MVP",
        subtitle: "проверка гипотезы",
        color: "blue",
        priceDelta: 10,
        timeDelta: 1,
        layers: ["Core journey", "Analytics ready"],
      },
      {
        id: "portal",
        kicker: "goal",
        title: "Portal",
        subtitle: "кабинет и статусы",
        color: "dark",
        priceDelta: 15,
        timeDelta: 2,
        layers: ["User states", "Status logic"],
      },
    ],
  },
  {
    id: "module",
    title: "Что критично внутри?",
    description: "Выбери один сильный модуль. Остальное можно добрать следующим спринтом.",
    options: [
      {
        id: "ai",
        kicker: "module",
        title: "AI",
        subtitle: "LLM, ответы, разбор",
        color: "orange",
        priceDelta: 20,
        timeDelta: 2,
        layers: ["Prompting", "LLM API", "Guardrails"],
      },
      {
        id: "payments",
        kicker: "module",
        title: "Pay",
        subtitle: "ЮKassa, Stars, тарифы",
        color: "green",
        priceDelta: 15,
        timeDelta: 1,
        layers: ["Billing", "Access rules"],
      },
      {
        id: "admin",
        kicker: "module",
        title: "Admin",
        subtitle: "роли, статусы, контент",
        color: "blue",
        priceDelta: 15,
        timeDelta: 2,
        layers: ["Admin UI", "Roles", "Content blocks"],
      },
      {
        id: "integrations",
        kicker: "module",
        title: "API",
        subtitle: "CRM, таблицы, вебхуки",
        color: "dark",
        priceDelta: 10,
        timeDelta: 1,
        layers: ["Integrations", "Webhooks"],
      },
    ],
  },
  {
    id: "mode",
    title: "Какой темп нужен?",
    description: "Определи темп запуска. Это влияет на сроки и глубину первого релиза.",
    options: [
      {
        id: "sprint",
        kicker: "mode",
        title: "Sprint",
        subtitle: "короткий рабочий релиз",
        color: "orange",
        priceDelta: 0,
        timeDelta: 0,
        layers: ["Tight scope", "Fast handoff"],
      },
      {
        id: "rush",
        kicker: "mode",
        title: "Rush",
        subtitle: "максимум скорости",
        color: "green",
        priceDelta: 10,
        timeDelta: -2,
        layers: ["Priority queue", "Daily sync"],
      },
      {
        id: "growth",
        kicker: "mode",
        title: "Growth",
        subtitle: "сразу под 2 спринта",
        color: "blue",
        priceDelta: 15,
        timeDelta: 2,
        layers: ["Scale path", "Second sprint map"],
      },
      {
        id: "prod",
        kicker: "mode",
        title: "Prod",
        subtitle: "чуть глубже архитектура",
        color: "dark",
        priceDelta: 20,
        timeDelta: 3,
        layers: ["Hardening", "Release structure"],
      },
    ],
  },
];

const selections = [0, 0, 0, 0];
const initialState = new URLSearchParams(window.location.search).get("state");
let stepIndex = initialState === "result" ? steps.length : 0;

const progressRail = document.getElementById("progressRail");
const stepTitle = document.getElementById("stepTitle");
const stepDescription = document.getElementById("stepDescription");
const stepKicker = document.getElementById("stepKicker");
const panelNote = document.getElementById("panelNote");
const optionsGrid = document.getElementById("optionsGrid");
const selectionPrimary = document.getElementById("selectionPrimary");
const selectionSecondary = document.getElementById("selectionSecondary");
const estimateLabel = document.getElementById("estimateLabel");
const estimateHint = document.getElementById("estimateHint");
const caseMode = document.getElementById("caseMode");
const caseTitle = document.getElementById("caseTitle");
const caseList = document.getElementById("caseList");
const livePreview = document.getElementById("livePreview");
const previewTitle = document.getElementById("previewTitle");
const previewNote = document.getElementById("previewNote");
const previewChips = document.getElementById("previewChips");
const insightGrid = document.getElementById("insightGrid");
const stackChips = document.getElementById("stackChips");
const stackNote = document.getElementById("stackNote");
const resultCard = document.getElementById("resultCard");
const resultSolution = document.getElementById("resultSolution");
const resultFlow = document.getElementById("resultFlow");
const resultTimeline = document.getElementById("resultTimeline");
const resultBudget = document.getElementById("resultBudget");
const resultModules = document.getElementById("resultModules");
const resultFit = document.getElementById("resultFit");
const resultCTA = document.getElementById("resultCTA");
const deliveryPlan = document.getElementById("deliveryPlan");
const leadRequestInput = document.getElementById("leadRequestInput");
const leadContactInput = document.getElementById("leadContactInput");
const briefOutput = document.getElementById("briefOutput");
const deliveryNote = document.getElementById("deliveryNote");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const stickyActions = document.querySelector(".sticky-actions");
const sendLeadBtn = document.getElementById("sendLeadBtn");
const newBriefBtn = document.getElementById("newBriefBtn");
let autoAdvanceTimer = null;
let isSubmittingLead = false;

function getSelected(step) {
  return steps[step].options[selections[step]];
}

function dedupe(items) {
  return [...new Set(items)];
}

function computeEstimate() {
  const core = getSelected(0);
  const goal = getSelected(1);
  const module = getSelected(2);
  const mode = getSelected(3);

  const basePrice = 65;
  const baseDays = 6;
  const totalPrice = basePrice + core.priceDelta + goal.priceDelta + module.priceDelta + mode.priceDelta;
  const totalDays = Math.max(4, baseDays + core.timeDelta + goal.timeDelta + module.timeDelta + mode.timeDelta);

  return {
    priceFrom: totalPrice,
    priceTo: totalPrice + 45,
    daysFrom: totalDays,
    daysTo: totalDays + 5,
  };
}

function buildStack() {
  const core = getSelected(0);
  const goal = getSelected(1);
  const module = getSelected(2);
  const mode = getSelected(3);

  const goalTags = {
    leads: ["Lead form", "Qualification"],
    ops: ["Process logic", "FAQ layer"],
    mvp: ["Core flow", "Analytics ready"],
    portal: ["Cabinet", "Statuses"],
  };

  const moduleTags = {
    ai: ["LLM flow", "Prompting"],
    payments: ["Billing", "Subscriptions"],
    admin: ["Admin panel", "Roles"],
    integrations: ["CRM sync", "Webhooks"],
  };

  const modeTags = {
    sprint: ["Fast sprint"],
    rush: ["Priority mode"],
    growth: ["Scale path"],
    prod: ["Release structure"],
  };

  return dedupe([
    ...core.layers,
    ...goal.layers,
    ...module.layers,
    ...goalTags[goal.id],
    ...moduleTags[module.id],
    ...modeTags[mode.id],
  ]).slice(0, 8);
}

function buildCases() {
  const core = getSelected(0);
  const goal = getSelected(1);
  const module = getSelected(2);

  const primaryCases = {
    mini_app: {
      leads: [
        ["Mini app для эксперта", "Квиз, intake, запись и передача лида без выхода из Telegram."],
        ["Витрина услуги", "Продуктовый вход вместо лендинга с формой и перепиской."],
      ],
      ops: [
        ["Внутренний Telegram flow", "FAQ, формы, статусы и handoff в команду."],
        ["Сервисный сценарий", "Запрос, ответ, статус и передача задачи внутри одного контура."],
      ],
      mvp: [
        ["Тест новой гипотезы", "Интерактивный продуктовый вход для быстрого запуска и сбора фидбека."],
        ["Demo для инвестора", "Показывает рабочий UX, а не только слова и слайды."],
      ],
      portal: [
        ["Client area в Telegram", "Личный кабинет light, статусы, история и действия."],
        ["Сервис с ролью клиента", "Простой интерфейс без тяжелого отдельного сайта."],
      ],
    },
    automation: {
      leads: [
        ["AI intake flow", "Собирает контекст, квалифицирует лид и передает менеджеру."],
        ["AI FAQ", "Снимает повторяющиеся вопросы и не теряет входящий поток."],
      ],
      ops: [
        ["AI routing", "Маршрутизация запросов и короткий внутренний сценарий."],
        ["Support assist", "Первичная поддержка, сбор данных и handoff без хаоса."],
      ],
      mvp: [
        ["AI-first MVP", "Быстрая проверка сценария с LLM в основе продукта."],
        ["Prototype с разбором", "LLM как демонстрация нового продуктового слоя."],
      ],
      portal: [
        ["AI внутри кабинета", "Разбор заявок и подсказки в интерфейсе клиента."],
        ["Сервис с ассистентом", "AI слой на стороне пользователя или команды."],
      ],
    },
    bot_payments: {
      leads: [
        ["Платный бот", "Подписка, тарифы и путь от интереса к оплате."],
        ["Продажа через Telegram", "Бот как канал продаж с выдачей доступа."],
      ],
      ops: [
        ["Бот с сервисной оплатой", "Прием платежа, статусы и простой процесс обслуживания."],
        ["Paid flow", "Оплата и выдача доступа без ручной рутины."],
      ],
      mvp: [
        ["Монетизация MVP", "Проверка спроса через бота и paywall-механику."],
        ["Starter paid product", "Быстрый релиз с оплатой внутри Telegram."],
      ],
      portal: [
        ["Подписка + кабинет", "Доступ, тариф, история и статусы на одной связке."],
        ["Сервис с оплатой", "Клиент покупает и сразу получает понятный flow."],
      ],
    },
    web_app: {
      leads: [
        ["Web intake", "Личный кабинет light с заявкой, скорингом и follow-up."],
        ["Client portal", "Более серьезный клиентский вход для B2B сценария."],
      ],
      ops: [
        ["CRM-light", "Процессы, статусы и внутренняя логика под конкретный workflow."],
        ["Командный сервис", "Таблицы, роли и API там, где это реально нужно."],
      ],
      mvp: [
        ["SaaS-light MVP", "Первый веб-релиз без раздувания архитектуры."],
        ["Рабочий prototype", "Production-like MVP, а не просто макет."],
      ],
      portal: [
        ["Личный кабинет", "Роли, история, статусы и действия пользователя."],
        ["B2B service panel", "Клиентский интерфейс с понятным рабочим циклом."],
      ],
    },
  };

  const cases = primaryCases[core.id][goal.id].map(([title, text]) => ({ title, text }));

  if (module.id === "ai") {
    cases.push({ title: "AI слой", text: "LLM внутри сценария: разбор запроса, ответы или квалификация." });
  }
  if (module.id === "payments") {
    cases.push({ title: "Монетизация", text: "Оплата, доступ и тарифная логика прямо в потоке." });
  }
  if (module.id === "admin") {
    cases.push({ title: "Управление", text: "Контент, роли и статусы меняются без лишнего трения." });
  }
  if (module.id === "integrations") {
    cases.push({ title: "Интеграции", text: "Синхронизация с CRM, таблицами и внешними сервисами." });
  }

  return cases.slice(0, 3);
}

function buildSolution() {
  const core = getSelected(0);
  const goal = getSelected(1);
  const module = getSelected(2);

  const coreNames = {
    mini_app: "Mini App",
    automation: "AI Flow",
    bot_payments: "Bot + Pay",
    web_app: "Web App",
  };

  const goalNames = {
    leads: "под лиды и intake",
    ops: "под процесс и FAQ",
    mvp: "под MVP и гипотезу",
    portal: "под кабинет и статусы",
  };

  return `${coreNames[core.id]} + ${module.title} ${goalNames[goal.id]}`;
}

function buildFlow() {
  const goal = getSelected(1);
  const module = getSelected(2);
  const mode = getSelected(3);

  const goalText = {
    leads: "Вход через короткий сценарий, квалификация и передача в продажу.",
    ops: "Пользователь или команда проходят понятный рабочий flow без хаоса.",
    mvp: "Запускаем основной путь пользователя и быстро проверяем спрос.",
    portal: "Собираем легкий кабинет с нужными статусами и действиями.",
  };

  const moduleText = {
    ai: "AI слой усиливает разбор, ответы или intake.",
    payments: "Платежи и выдача доступа встроены в контур.",
    admin: "Есть точка управления контентом, ролями и статусами.",
    integrations: "Нужные внешние сервисы подключаются без лишней прослойки.",
  };

  const modeText = {
    sprint: "Первый релиз держим компактным.",
    rush: "Ставим скорость выше идеальности.",
    growth: "Сразу проектируем продолжение на второй спринт.",
    prod: "Чуть глубже закладываем структуру релиза.",
  };

  return `${goalText[goal.id]} ${moduleText[module.id]} ${modeText[mode.id]}`;
}

function buildFit() {
  const core = getSelected(0);
  const goal = getSelected(1);

  if (core.id === "mini_app") {
    return "Интерактив прямо в Telegram показывает уровень и переводит интерес в заявку без лишнего трения.";
  }
  if (core.id === "automation") {
    return "Лучше всего работает там, где надо разгрузить людей и ускорить первичный ответ.";
  }
  if (core.id === "bot_payments") {
    return "Сильный формат для paid-flow, когда нужна быстрая монетизация и понятный доступ.";
  }
  if (goal.id === "portal") {
    return "Подходит, когда уже нужен не просто лидоген, а рабочий клиентский слой.";
  }
  return "Это выглядит как настоящий продукт, а не как обещание в переписке.";
}

function buildPreviewTitle() {
  const core = getSelected(0);
  const goal = getSelected(1);
  return `${core.title} под ${goal.subtitle}`;
}

function buildPreviewNote() {
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const notes = {
    core: "Сначала выбираем формат. App уже держит в голове будущий stack и estimate.",
    goal: "Теперь фиксируем результат первого релиза. Это сильнее влияет на UX, чем стек сам по себе.",
    module: "Один модуль усиливает релиз сильнее всего. Не пытаемся впихнуть все сразу.",
    mode: "Последний выбор: насколько жестко ускоряемся и сколько глубины берем в первый спринт.",
  };
  return notes[step.id] || "Контур решения и estimate собираются автоматически.";
}

function getTelegramUser() {
  if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user) {
    return null;
  }

  const user = tg.initDataUnsafe.user;
  return {
    id: user.id || null,
    username: user.username ? `@${user.username}` : "",
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    language_code: user.language_code || "",
  };
}

function buildClientLabel(user) {
  if (!user) return "";
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  if (fullName && user.username) return `${fullName} (${user.username})`;
  return fullName || user.username || "";
}

function buildBriefText() {
  const core = getSelected(0);
  const goal = getSelected(1);
  const module = getSelected(2);
  const mode = getSelected(3);
  const estimate = computeEstimate();
  const stack = buildStack();

  return [
    `${config.brandName || "ARK LAB"} / lead preview`,
    "",
    `Точка входа: ${core.title} (${core.subtitle})`,
    `Цель: ${goal.title} (${goal.subtitle})`,
    `Критичный модуль: ${module.title} (${module.subtitle})`,
    `Режим: ${mode.title} (${mode.subtitle})`,
    "",
    `Формат решения: ${buildSolution()}`,
    `Estimate: ${estimate.priceFrom}-${estimate.priceTo}k / ${estimate.daysFrom}-${estimate.daysTo} дней`,
    `Почему зайдет: ${buildFit()}`,
    "",
    `Stack: ${stack.join(", ")}`,
  ].join("\n");
}

function getBriefUrl() {
  if (!leadEndpoint) return "";
  if (/^https?:\/\//.test(leadEndpoint)) return leadEndpoint;
  return `${apiBaseUrl}${leadEndpoint}`;
}

function renderProgress() {
  progressRail.innerHTML = "";
  for (let index = 0; index < steps.length + 1; index += 1) {
    const pill = document.createElement("span");
    pill.className = "progress-pill";
    if (index < stepIndex) {
      pill.classList.add("is-done");
    } else if (index === stepIndex || (stepIndex === steps.length && index === steps.length)) {
      pill.classList.add("is-current");
    }
    progressRail.appendChild(pill);
  }
}

function renderOptions() {
  const step = steps[stepIndex];
  optionsGrid.innerHTML = "";

  step.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `option-card option-${option.color}${selections[stepIndex] === index ? " is-selected" : ""}`;
    button.innerHTML = `
      <span class="option-kicker">${option.kicker}</span>
      <strong>${option.title}</strong>
      <span>${option.subtitle}</span>
    `;
    button.addEventListener("click", () => {
      if (autoAdvanceTimer) {
        window.clearTimeout(autoAdvanceTimer);
      }
      selections[stepIndex] = index;
      render();
      if (stepIndex < steps.length) {
        autoAdvanceTimer = window.setTimeout(() => {
          if (stepIndex < steps.length) {
            stepIndex += 1;
            renderState();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }, 140);
      }
    });
    optionsGrid.appendChild(button);
  });
}

function renderSummary() {
  const core = getSelected(0);
  const goal = getSelected(1);
  const module = getSelected(2);
  const mode = getSelected(3);
  const estimate = computeEstimate();
  const stack = buildStack();
  const cases = buildCases();

  selectionPrimary.textContent = `${core.title} + ${goal.title}`;
  selectionSecondary.textContent = `${module.subtitle}, ${mode.subtitle}`;
  estimateLabel.textContent = `${estimate.priceFrom}-${estimate.priceTo}k`;
  estimateHint.textContent = `${estimate.daysFrom}-${estimate.daysTo} дней`;

  caseMode.textContent = `${core.title} / ${goal.title}`;
  caseTitle.textContent = goal.id === "ops" ? "Где это разгружает сильнее всего" : "Где это заходит лучше всего";
  caseList.innerHTML = "";

  cases.forEach((item) => {
    const article = document.createElement("article");
    article.className = "case-item";
    article.innerHTML = `<strong>${item.title}</strong><span>${item.text}</span>`;
    caseList.appendChild(article);
  });

  stackChips.innerHTML = "";
  stack.forEach((item) => {
    const chip = document.createElement("span");
    chip.className = "stack-chip";
    chip.textContent = item;
    stackChips.appendChild(chip);
  });

  stackNote.textContent = mode.id === "prod"
    ? "Релиз чуть глубже по структуре, но все еще без раздувания."
    : "Первый спринт остается компактным и заточенным под результат.";

  previewTitle.textContent = buildPreviewTitle();
  previewNote.textContent = buildPreviewNote();
  previewChips.innerHTML = "";
  stack.slice(0, 4).forEach((item) => {
    const chip = document.createElement("span");
    chip.className = "stack-chip";
    chip.textContent = item;
    previewChips.appendChild(chip);
  });

  resultSolution.textContent = buildSolution();
  resultFlow.textContent = buildFlow();
  resultTimeline.textContent = `${estimate.daysFrom}-${estimate.daysTo} дней`;
  resultBudget.textContent = `${estimate.priceFrom}-${estimate.priceTo}k`;
  resultFit.textContent = buildFit();
  resultCTA.textContent = "Оставить заявку";
  deliveryPlan.textContent = "Опишите задачу и оставьте контакт. Заявка уйдет напрямую в ARK LAB, а мы вернемся с ответом в Telegram.";
  briefOutput.value = buildBriefText();

  resultModules.innerHTML = "";
  stack.slice(0, 6).forEach((item) => {
    const tag = document.createElement("span");
    tag.className = "result-tag";
    tag.textContent = item;
    resultModules.appendChild(tag);
  });
}

function renderState() {
  const isResultStep = stepIndex === steps.length;
  renderProgress();
  renderSummary();

  if (isResultStep) {
    stepTitle.textContent = "Вот уже почти готовый pre-sale product";
    stepDescription.textContent = "Формат решения, fit, stack, estimate и brief собираются в одном потоке.";
    stepKicker.textContent = "RESULT";
    panelNote.textContent = "review + send";
    optionsGrid.innerHTML = "";
  } else {
    const step = steps[stepIndex];
    stepTitle.textContent = step.title;
    stepDescription.textContent = step.description;
    stepKicker.textContent = `STEP ${String(stepIndex + 1).padStart(2, "0")}`;
    panelNote.textContent = `1 tap -> ${stepIndex === steps.length - 1 ? "result" : "next step"}`;
    renderOptions();
  }

  livePreview.classList.toggle("hidden", isResultStep);
  insightGrid.classList.toggle("hidden", !isResultStep);
  resultCard.classList.toggle("hidden", !isResultStep);
  stickyActions.classList.toggle("hidden", isResultStep);
  backBtn.disabled = stepIndex === 0;
  nextBtn.textContent = isResultStep ? "Новый разбор" : stepIndex === steps.length - 1 ? "Собрать контур" : "Дальше";
  updateTelegramUi(isResultStep);
}

async function postLeadToBackend() {
  const url = getBriefUrl();
  if (!url) return false;

  const telegramUser = getTelegramUser();
  const payload = {
    type: "purchase_request",
    solution: buildSolution(),
    estimate: computeEstimate(),
    source: tg ? "telegram-webapp" : "browser",
    text: briefOutput.value,
    requestText: leadRequestInput.value.trim(),
    contact: leadContactInput.value.trim(),
    telegramUser,
    selections: {
      core: getSelected(0),
      goal: getSelected(1),
      module: getSelected(2),
      mode: getSelected(3),
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

async function submitLead() {
  if (isSubmittingLead) {
    return;
  }

  const requestText = leadRequestInput.value.trim();
  const contactText = leadContactInput.value.trim();
  const telegramUser = getTelegramUser();

  if (!requestText) {
    deliveryNote.textContent = "Нужно коротко описать задачу.";
    leadRequestInput.focus();
    return;
  }

  if (!contactText && !(telegramUser && telegramUser.username)) {
    deliveryNote.textContent = "Добавь контакт для ответа: @telegram, телефон или email.";
    leadContactInput.focus();
    return;
  }

  isSubmittingLead = true;
  sendLeadBtn.disabled = true;
  sendLeadBtn.textContent = "Отправляем...";

  try {
    const response = await postLeadToBackend();
    const leadId = response.leadId ? ` #${response.leadId}` : "";
    deliveryNote.textContent = `Готово. Заявка${leadId} отправлена. Мы получили ее и вернемся с ответом.`;
    sendLeadBtn.textContent = "Заявка отправлена";
    leadRequestInput.disabled = true;
    leadContactInput.disabled = true;
    isSubmittingLead = false;
    return;
  } catch (error) {
    deliveryNote.textContent = "Не удалось отправить заявку. Попробуй еще раз.";
  }

  sendLeadBtn.disabled = false;
  sendLeadBtn.textContent = "Отправить заявку";
  isSubmittingLead = false;
}

function updateTelegramUi(isResultStep) {
  if (!tg) {
    deliveryNote.textContent = apiBaseUrl || leadEndpoint
      ? "При нажатии заявка уйдет напрямую в ARK LAB через backend."
      : (config.contactHint || "Обнови контакты в config.js перед деплоем.");
    return;
  }

  tg.ready();
  tg.expand();

  if (typeof tg.enableClosingConfirmation === "function") {
    tg.enableClosingConfirmation();
  }

  if (tg.MainButton) {
    tg.MainButton.hide();
  }

  deliveryNote.textContent = isResultStep
    ? "Заполните заявку ниже. Она уйдет напрямую в ARK LAB."
    : "Пройдите 4 коротких шага. В конце app предложит оставить заявку.";
}

backBtn.addEventListener("click", () => {
  if (autoAdvanceTimer) {
    window.clearTimeout(autoAdvanceTimer);
  }
  if (stepIndex > 0) {
    stepIndex -= 1;
    renderState();
  }
});

nextBtn.addEventListener("click", () => {
  if (autoAdvanceTimer) {
    window.clearTimeout(autoAdvanceTimer);
  }
  if (stepIndex < steps.length) {
    stepIndex += 1;
  } else {
    stepIndex = 0;
  }
  renderState();
});

sendLeadBtn.addEventListener("click", submitLead);
newBriefBtn.addEventListener("click", () => {
  if (autoAdvanceTimer) {
    window.clearTimeout(autoAdvanceTimer);
  }
  stepIndex = 0;
  isSubmittingLead = false;
  sendLeadBtn.disabled = false;
  sendLeadBtn.textContent = "Отправить заявку";
  leadRequestInput.disabled = false;
  leadContactInput.disabled = false;
  leadRequestInput.value = "";
  const telegramUser = getTelegramUser();
  leadContactInput.value = telegramUser && telegramUser.username ? telegramUser.username : "";
  deliveryNote.textContent = "Пройдите 4 коротких шага. В конце app предложит оставить заявку.";
  renderState();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

const initialTelegramUser = getTelegramUser();
if (initialTelegramUser && initialTelegramUser.username) {
  leadContactInput.value = initialTelegramUser.username;
}

renderState();
