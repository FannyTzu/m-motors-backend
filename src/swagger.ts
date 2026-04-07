import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "M-Motors API",
      version: "3.0.0",
      description:
        "API pour la gestion de véhicules et commandes côté admin et côté client",
      contact: {
        name: "M-Motors Support",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Serveur de développement",
      },
      {
        url: `${process.env.API_URL || "https://api.mmotors.com"}`,
        description: "Serveur de production",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
        cookieAuth: [],
      },
    ],
  },
  apis: ["./src/routes/**/*.ts", "./dist/routes/**/*.js"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

export const setupSwagger = (app: Express) => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocs, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    }),
  );
};
