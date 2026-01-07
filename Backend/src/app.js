const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const routes = require("./routes/index");
const swaggerUi = require("swagger-ui-express");
const { swaggerSpec } = require("./config/swagger");

const app = express();

/* ===============================
   SECURITY MIDDLEWARES
================================ */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

/* ===============================
   CORS
================================ */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ===============================
   RATE LIMITING
================================ */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later",
});
app.use("/api/v1", limiter);

/* ===============================
   BODY PARSERS  (IMPORTANT)
================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // 🔥 REQUIRED for file uploads
app.use(morgan("dev"));

/* ===============================
   SWAGGER
================================ */
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,

    swaggerOptions: {
      docExpansion: "none",               // 🔽 collapse all endpoints
      defaultModelsExpandDepth: -1,       // ❌ hide Schemas section
      filter: true,                       // 🔍 search box
      displayRequestDuration: true,       // ⏱ request time

      requestInterceptor: (req) => {
        // Fix multipart/form-data crash
        if (req.headers["Content-Type"]?.includes("multipart/form-data")) {
          delete req.headers["Content-Type"];
        }
        return req;
      },
    },

    // 🎨 UI-only styling (safe & clean)
    customCss: `
      body {
        font-family: Inter, system-ui, sans-serif;
      }

      .swagger-ui .opblock {
        border-radius: 10px;
        margin-bottom: 14px;
      }

      .swagger-ui .opblock-summary {
        padding: 12px;
        font-size: 15px;
      }

      .swagger-ui .info {
        margin-bottom: 30px;
      }

      .swagger-ui section.models {
        display: none;
      }
    `,
  })
);


/* ===============================
   API ROUTES
================================ */
app.use("/api/v1", routes);

/* ===============================
   GLOBAL ERROR HANDLER (CRITICAL)
================================ */
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);

  // Multer / Cloudinary safety
  if (err.name === "MulterError") {
    return res.status(400).json({
      status: "error",
      message: err.message,
    });
  }

  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Something went wrong",
  });
});

module.exports = app;
