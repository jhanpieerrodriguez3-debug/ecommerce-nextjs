import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "DigitalMarket BFF API",
      version: "1.0.0",
      description:
        "API REST del Backend For Frontend (BFF) del proyecto DigitalMarket.",
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Servidor Local",
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
  },

  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;