
import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";
import rateLimit from "express-rate-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar el .env ubicado dentro de nexus_ia.
dotenv.config({
  path: path.join(__dirname, ".env")
});

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const publicPath = __dirname;

app.disable("x-powered-by");
app.use(express.json({ limit: "12kb" }));
app.use(express.static(publicPath));

const limitarChat = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Llegaste al límite temporal. Esperá unos minutos."
  }
});


const instrucciones = `
Sos NEXUS, un asistente educativo en español sobre el impacto
de la inteligencia artificial.

IDENTIDAD DE NEXUS
- NEXUS es un proyecto desarrollado por alumnos de quinto año
  del Colegio Santísimo Rosario.
- Si te preguntan quién te desarrolló, respondé que fuiste
  creado por alumnos de quinto año del Colegio Santísimo Rosario.
- Si te preguntan dónde nació el proyecto, mencioná el Colegio
  Santísimo Rosario.
- No inventes los nombres de los estudiantes desarrolladores,
  sus funciones ni otros detalles del proyecto que no conozcas.
- No afirmes que fuiste desarrollado por Google u OpenAI:
  esas empresas proporcionan tecnología, no la identidad del proyecto.

TU PROPÓSITO
Ayudar a comprender el impacto de la inteligencia artificial
en la educación, la medicina, la ciencia, el trabajo y la sociedad.

CÓMO RESPONDER
- Respondé en español claro, amable y conciso.
- Explicá beneficios, límites, riesgos, privacidad y sesgos.
- No inventes estadísticas ni fuentes.
- Si no estás seguro de un dato, decilo.
- Diferenciá los hechos comprobados de las opiniones.
- No pidas datos personales sensibles.
- Recordá que una respuesta generada puede contener errores.
`;


app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    servicio: "NEXUS API",
    iaConfigurada: Boolean(process.env.GEMINI_API_KEY)
  });
});

app.post("/api/chat", limitarChat, async (req, res) => {
  const mensaje =
    typeof req.body?.message === "string"
      ? req.body.message.trim()
      : "";

  if (!mensaje) {
    return res.status(400).json({
      error: "Escribí una pregunta para conversar con NEXUS."
    });
  }

  if (mensaje.length > 1200) {
    return res.status(400).json({
      error: "El mensaje puede tener hasta 1200 caracteres."
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      error: "Falta configurar GEMINI_API_KEY en nexus_ia/.env."
    });
  }

  try {
    const cliente = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const respuesta = await cliente.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      contents: mensaje,
      config: {
        systemInstruction: instrucciones,
        maxOutputTokens: 450
      }
    });

    const texto = respuesta.text?.trim();

    if (!texto) {
      return res.status(502).json({
        error: "Gemini no devolvió una respuesta. Intentá de nuevo."
      });
    }

    return res.json({ answer: texto });
  } catch (error) {
    console.error("Error completo de Gemini:", error);

    const codigo = Number(error?.status);

    if (codigo === 429) {
      return res.status(429).json({
        error: "Gemini alcanzó su límite de uso. Esperá y volvé a intentar."
      });
    }

    if (codigo === 401 || codigo === 403) {
      return res.status(502).json({
        error: "Gemini rechazó la clave. Revisá tu API key y sus permisos."
      });
    }

    return res.status(502).json({
      error: "No se pudo obtener una respuesta de Gemini. Revisá la terminal."
    });
  }
});

app.listen(PORT, () => {
  console.log(`NEXUS funcionando en http://localhost:${PORT}`);

  console.log(
    `API de Gemini: ${
      process.env.GEMINI_API_KEY
        ? "configurada"
        : "falta configurar nexus_ia/.env"
    }`
  );
});
