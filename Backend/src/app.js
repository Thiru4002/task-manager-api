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
    swaggerOptions: {
      requestInterceptor: (req) => {
        // Fix multipart/form-data crash
        if (req.headers["Content-Type"]?.includes("multipart/form-data")) {
          delete req.headers["Content-Type"];
        }
        return req;
      },
    },
  })
);

app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Task Manager API',
    status: 'running',
    version: 'v1',
    docs: '/api-docs',
    basePath: '/api/v1'
  });
});


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
