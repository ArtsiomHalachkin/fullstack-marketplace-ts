
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

export const setupSwagger = (app: Express, port: number | string, serviceName: string) => {
  const swaggerOptions = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: `${serviceName} running on port ${port}`, // Dynamic title
        version: "1.0.0",
      },
      servers: [
        { url: `http://localhost:${port}` },
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
      security: [{ bearerAuth: [] }],
    },
    // Look for files in the current directory level
    apis: ["./src/**/*.ts", "./**/*.ts"], 
  };

  const swaggerDocs = swaggerJsdoc(swaggerOptions);
  
  // Serve the UI
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  
  // OPTIONAL: Expose the JSON so a central gateway can read it later
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerDocs);
  });

  console.log(`📄 Swagger docs available at http://localhost:${port}/api-docs`);
};