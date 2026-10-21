
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// ==========================================
// 1. PROGRESO DE LECTURA
// ==========================================

const progressBar = $("#progress");

window.addEventListener("scroll", () => {
  const total =
    document.documentElement.scrollHeight - window.innerHeight;

  const percentage =
    total > 0 ? (window.scrollY / total) * 100 : 0;

  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
  }
});

// ==========================================
// 2. ANIMACIONES AL APARECER EN PANTALLA
// ==========================================

const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const revealElements = $$(".reveal");

if ("IntersectionObserver" in window && !reducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealElements.forEach((element, index) => {
    // Pequeño retraso escalonado entre las apariciones.
    element.style.setProperty(
      "--reveal-delay",
      `${(index % 4) * 90}ms`
    );

    revealObserver.observe(element);
  });
} else {
  // Si el navegador no admite IntersectionObserver
  // o el usuario prefiere menos movimiento, mostramos todo.
  revealElements.forEach((element) => {
    element.classList.add("visible");
  });
}

// ==========================================
// 3. MENÚ PARA CELULARES
// ==========================================

const menuToggle = $("#menuToggle");
const navLinks = $("#navLinks");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  $$("nav a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// ==========================================
// 4. TEMA OSCURO / CLARO
// ==========================================

const themeToggle = $("#themeToggle");

function updateChartTheme() {
  if (!incidentChart) return;

  const colors = chartColors();

  incidentChart.options.scales.x.ticks.color = colors.text;
  incidentChart.options.scales.y.ticks.color = colors.text;
  incidentChart.options.scales.y.grid.color = colors.grid;

  incidentChart.update();
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");

    const isLight = document.body.classList.contains("light");

    themeToggle.textContent = isLight ? "☾" : "☼";
    themeToggle.setAttribute(
      "aria-label",
      isLight ? "Cambiar a tema oscuro" : "Cambiar a tema claro"
    );

    updateChartTheme();
    drawParticles();
  });
}

// ==========================================
// 5. FONDO ANIMADO DE PARTÍCULAS
// ==========================================

const canvas = $("#particles");
const ctx = canvas ? canvas.getContext("2d") : null;

let particles = [];
let canvasWidth = 0;
let canvasHeight = 0;
let animationFrame = null;

function setupParticles() {
  if (!canvas || !ctx) return;

  const rect = canvas.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  canvasWidth = rect.width;
  canvasHeight = rect.height;

  canvas.width = Math.floor(rect.width * pixelRatio);
  canvas.height = Math.floor(rect.height * pixelRatio);

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const count = Math.min(85, Math.floor(rect.width / 13));

  particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    radius: Math.random() * 1.7 + 0.5
  }));

  drawParticles();
}

function drawParticles() {
  if (!canvas || !ctx) return;

  cancelAnimationFrame(animationFrame);

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const isLight = document.body.classList.contains("light");
  const color = isLight ? "40,120,145" : "112,240,237";

  particles.forEach((particle, index) => {
    if (!reducedMotion) {
      particle.x += particle.vx;
      particle.y += particle.vy;
    }

    if (particle.x < 0 || particle.x > canvasWidth) {
      particle.vx *= -1;
    }

    if (particle.y < 0 || particle.y > canvasHeight) {
      particle.vy *= -1;
    }

    ctx.beginPath();
    ctx.arc(
      particle.x,
      particle.y,
      particle.radius,
      0,
      Math.PI * 2
    );

    ctx.fillStyle = `rgba(${color}, 0.7)`;
    ctx.fill();

    for (let j = index + 1; j < particles.length; j++) {
      const other = particles[j];

      const dx = particle.x - other.x;
      const dy = particle.y - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 115) {
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(other.x, other.y);

        const opacity = (1 - distance / 115) * 0.15;

        ctx.strokeStyle = `rgba(${color}, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  });

  if (!reducedMotion && !document.hidden) {
    animationFrame = requestAnimationFrame(drawParticles);
  }
}

if (canvas && ctx) {
  setupParticles();

  window.addEventListener("resize", setupParticles);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(animationFrame);
    } else {
      drawParticles();
    }
  });
}

// ==========================================
// 6. ESTADÍSTICAS ANIMADAS
// ==========================================

const statsElements = $$("[data-count]");

if ("IntersectionObserver" in window) {
  const statsObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const element = entry.target;
        const target = Number(element.dataset.count);
        const suffix = element.dataset.suffix || "";

        if (reducedMotion) {
          element.textContent = `${target}${suffix}`;
          observer.unobserve(element);
          return;
        }

        const start = performance.now();
        const duration = 1200;

        function updateNumber(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);

          element.textContent =
            `${Math.round(target * eased)}${suffix}`;

          if (progress < 1) {
            requestAnimationFrame(updateNumber);
          }
        }

        requestAnimationFrame(updateNumber);
        observer.unobserve(element);
      });
    },
    { threshold: 0.4 }
  );

  statsElements.forEach((element) => {
    statsObserver.observe(element);
  });
} else {
  statsElements.forEach((element) => {
    const target = Number(element.dataset.count);
    const suffix = element.dataset.suffix || "";

    element.textContent = `${target}${suffix}`;
  });
}

// ==========================================
// 7. GRÁFICO DE INCIDENTES DOCUMENTADOS
// ==========================================

let incidentChart = null;

function chartColors() {
  const isLight = document.body.classList.contains("light");

  return {
    text: isLight ? "#586477" : "#929daf",
    grid: isLight
      ? "rgba(30,45,70,.12)"
      : "rgba(180,197,222,.12)"
  };
}

const incidentCanvas = $("#incidentChart");

if (incidentCanvas && window.Chart) {
  const colors = chartColors();

  incidentChart = new Chart(incidentCanvas, {
    type: "bar",

    data: {
      labels: ["2024", "2025"],

      datasets: [
        {
          label: "Incidentes documentados",
          data: [233, 362],
          backgroundColor: ["#9b8cff", "#70f0ed"],
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 90
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: true,

      plugins: {
        legend: {
          display: false
        },

        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.raw} incidentes documentados`
          }
        }
      },

      scales: {
        x: {
          grid: { display: false },

          ticks: {
            color: colors.text,
            font: {
              family: "DM Mono",
              size: 11
            }
          }
        },

        y: {
          beginAtZero: true,
          max: 400,

          ticks: {
            stepSize: 100,
            color: colors.text,
            font: {
              family: "DM Mono",
              size: 10
            }
          },

          grid: {
            color: colors.grid
          },

          border: {
            display: false
          }
        }
      }
    }
  });
}

// ==========================================
// 8. CHAT CON IA REAL
// ==========================================

const chatForm = $("#chatForm");
const chatInput = $("#chatInput");
const chatMessages = $("#chatMessages");
const sendButton = $("#sendButton");
const chatConnection = $("#chatConnection");

function addMessage(role, text) {
  if (!chatMessages) return;

  const message = document.createElement("div");
  message.className = `message ${role}`;

  const avatar = document.createElement("span");
  avatar.className = "message-avatar";
  avatar.textContent = role === "assistant" ? "N" : "T";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  // textContent evita interpretar la respuesta como HTML.
  bubble.textContent = text;

  message.append(avatar, bubble);
  chatMessages.append(message);

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function checkServer() {
  if (!chatConnection) return;

  try {
    const response = await fetch("/api/health");
    const data = await response.json();

    if (data.iaConfigurada) {
      chatConnection.textContent = "IA CONECTADA";
      chatConnection.style.color = "var(--cyan)";
    } else {
      chatConnection.textContent = "FALTA CONFIGURAR CLAVE";
      chatConnection.style.color = "var(--violet)";
    }
  } catch {
    chatConnection.textContent = "SERVIDOR DESCONECTADO";
    chatConnection.style.color = "var(--violet)";
  }
}

if (chatForm && chatInput && chatMessages && sendButton) {
  checkServer();

  async function sendChatMessage(message) {
    const cleanMessage = message.trim();

    if (!cleanMessage || sendButton.disabled) return;

    addMessage("user", cleanMessage);
    chatInput.value = "";

    sendButton.disabled = true;
    sendButton.textContent = "…";
    sendButton.setAttribute("aria-label", "Enviando mensaje");

    const loadingMessage = document.createElement("div");
    loadingMessage.className = "message assistant";

    const avatar = document.createElement("span");
    avatar.className = "message-avatar";
    avatar.textContent = "N";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble loading";
    bubble.textContent = "Pensando";

    loadingMessage.append(avatar, bubble);
    chatMessages.append(loadingMessage);

    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          message: cleanMessage
        })
      });

      const data = await response.json();

      loadingMessage.remove();

      if (!response.ok) {
        throw new Error(
          data.error || "No se pudo completar la consulta."
        );
      }

      addMessage(
        "assistant",
        data.answer || "No recibí una respuesta válida."
      );
    } catch (error) {
      loadingMessage.remove();

      addMessage(
        "assistant",
        error.message ||
          "No pude conectar con el servidor. Comprobá que esté encendido."
      );
    } finally {
      sendButton.disabled = false;
      sendButton.textContent = "↑";
      sendButton.setAttribute("aria-label", "Enviar mensaje");
      chatInput.focus();

      checkServer();
    }
  }

  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendChatMessage(chatInput.value);
  });

  $$(".suggestion").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.prompt) {
        chatInput.value = button.dataset.prompt;
        sendChatMessage(chatInput.value);
      }
    });
  });
}

// ==========================================
// 9. EXAMEN FINAL CON PUNTUACIÓN
// ==========================================

const questions = [
  {
    category: "VERIFICACIÓN",

    question:
      "Una IA responde con mucha seguridad y da una cifra sorprendente. ¿Qué conviene hacer?",

    options: [
      "Creerla porque suena profesional.",
      "Buscar la fuente original y contrastarla con fuentes confiables.",
      "Compartirla rápido antes de que se pierda."
    ],

    answer: 1,

    explanation:
      "Un tono seguro no garantiza que una respuesta sea correcta. Las cifras importantes deben verificarse con fuentes originales."
  },

  {
    category: "EDUCACIÓN",

    question:
      "¿Cuál es una forma más útil de usar IA para estudiar?",

    options: [
      "Pedirle que haga todo y copiarlo.",
      "Pedir una explicación, practicar y comprobar si entendiste.",
      "Usarla como única fuente para cualquier tema."
    ],

    answer: 1,

    explanation:
      "Usarla como tutor, verificar la información y resolver por tu cuenta favorece el aprendizaje activo."
  },

  {
    category: "PRIVACIDAD",

    question:
      "Una web de IA te pide tu contraseña personal para responder mejor. ¿Qué hacés?",

    options: [
      "No la comparto: es información sensible.",
      "La envío si la página tiene un diseño moderno.",
      "La envío y después veo qué pasa."
    ],

    answer: 0,

    explanation:
      "No compartas contraseñas ni datos sensibles en un chat. El diseño de una página no demuestra que sea confiable."
  },

  {
    category: "SESGOS",

    question:
      "¿Por qué una IA podría producir resultados injustos?",

    options: [
      "Porque siempre tiene intenciones propias.",
      "Porque los datos o el diseño pueden reflejar sesgos humanos.",
      "Porque toda IA da exactamente la misma respuesta."
    ],

    answer: 1,

    explanation:
      "Los datos de entrenamiento, las decisiones de diseño y el contexto pueden reproducir o amplificar sesgos."
  },

  {
    category: "RESPONSABILIDAD",

    question:
      "¿Cuál describe mejor una actitud crítica frente a la IA?",

    options: [
      "Aceptar toda respuesta generada.",
      "Rechazar cualquier herramienta automáticamente.",
      "Evaluar el propósito, verificar resultados y considerar consecuencias."
    ],

    answer: 2,

    explanation:
      "Pensamiento crítico no significa creer ni rechazar todo: significa evaluar la evidencia, el contexto, los límites y las consecuencias."
  }
];

let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;

const quizContent = $("#quizContent");
const quizFeedback = $("#quizFeedback");
const quizNext = $("#quizNext");
const quizRestart = $("#quizRestart");

function renderQuestion() {
  if (
    !quizContent ||
    !quizFeedback ||
    !quizNext ||
    !quizRestart
  ) {
    return;
  }

  quizAnswered = false;

  const question = questions[quizIndex];

  quizFeedback.hidden = true;
  quizNext.hidden = true;
  quizRestart.hidden = true;

  $("#quizStep").textContent =
    `PREGUNTA ${String(quizIndex + 1).padStart(2, "0")} / ${String(questions.length).padStart(2, "0")}`;

  $("#quizProgressBar").style.width =
    `${(quizIndex / questions.length) * 100}%`;

  quizContent.innerHTML = `
    <div class="quiz-category">${question.category}</div>
    <h3>${question.question}</h3>

    <div class="quiz-options">
      ${question.options.map((option, index) => `
        <button class="quiz-option" data-choice="${index}">
          <span>${String.fromCharCode(65 + index)}</span>
          ${option}
        </button>
      `).join("")}
    </div>
  `;

  $$(".quiz-option").forEach((button) => {
    button.addEventListener("click", () => {
      answerQuestion(Number(button.dataset.choice));
    });
  });
}

function answerQuestion(choice) {
  if (quizAnswered) return;

  quizAnswered = true;

  const question = questions[quizIndex];
  const correct = choice === question.answer;

  if (correct) {
    quizScore++;
  }

  $$(".quiz-option").forEach((button, index) => {
    button.disabled = true;

    if (index === question.answer) {
      button.classList.add("correct");
    }

    if (index === choice && !correct) {
      button.classList.add("wrong");
    }
  });

  quizFeedback.replaceChildren();

  const title = document.createElement("strong");
  title.textContent = correct ? "¡Correcto!" : "No exactamente.";

  const explanation = document.createElement("p");
  explanation.textContent = question.explanation;
  explanation.style.marginBottom = "0";

  quizFeedback.append(title, explanation);
  quizFeedback.hidden = false;

  if (quizIndex === questions.length - 1) {
    showQuizResult();
  } else {
    quizNext.hidden = false;
  }
}

function showQuizResult() {
  quizNext.hidden = true;
  quizRestart.hidden = false;

  $("#quizProgressBar").style.width = "100%";
  $("#quizStep").textContent = "RESULTADO FINAL";

  let title;

  if (quizScore === questions.length) {
    title = "¡Pensamiento crítico de nivel experto!";
  } else if (quizScore >= 3) {
    title = "¡Buen trabajo! Seguí cuestionando.";
  } else {
    title = "Cada pregunta es una oportunidad para aprender.";
  }

  const result = document.createElement("div");
  result.className = "quiz-result";

  const score = document.createElement("div");
  score.className = "result-score";
  score.textContent = `${quizScore} / ${questions.length}`;

  const heading = document.createElement("h3");
  heading.textContent = title;

  const message = document.createElement("p");
  message.textContent =
    "Tu resultado es privado y no se guarda en ningún servidor.";

  result.append(score, heading, message);
  quizContent.replaceChildren(result);
}

if (quizContent && quizFeedback && quizNext && quizRestart) {
  quizNext.addEventListener("click", () => {
    if (quizIndex < questions.length - 1) {
      quizIndex++;
      renderQuestion();
    }
  });

  quizRestart.addEventListener("click", () => {
    quizIndex = 0;
    quizScore = 0;
    renderQuestion();
  });

  renderQuestion();
}
