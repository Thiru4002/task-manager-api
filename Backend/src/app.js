const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const routes = require('./routes/index');
const swaggerUi = require("swagger-ui-express");
const { swaggerSpec } = require("./config/swagger");

const app = express();

//security middlewares..
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// enable CORS for frontend
app.use(
  cors({
    origin: "*", // allow all origins
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


// rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later"
});
app.use("/api/v1", limiter);

// parse JSON()..
app.use(express.json());
app.use(morgan('dev'));

//swagger setup..
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      requestInterceptor: (req) => {
        // 🔥 Fix Swagger multipart issue
        if (req.headers["Content-Type"]?.includes("multipart/form-data")) {
          delete req.headers["Content-Type"];
        }
        return req;
      }
    }
  })
);


//Swagger Middleware..
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


//API routes..
app.use('/api/v1',routes);

//global error handereler..
app.use((err,req,res,next)=>{
    console.error(err.stack || err);
    res.status(500).json({err:err.message || "something went wrong"});
})

module.exports = app;