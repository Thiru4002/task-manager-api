const swaggerJSDoc = require("swagger-jsdoc");
const path = require("path")

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task Manager API",
      version: "1.0.0",
      description:
        "Task Manager REST API with JWT Authentication and Role-Based Access",
    },

    servers: [
      {
        url: "/",
        description: "Current server",
      },
    ],


    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },

    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  // Swagger will read API documentation from these files
  apis: [path.join(__dirname,"../docs/*.yaml")],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

module.exports = {
  swaggerSpec,
};
