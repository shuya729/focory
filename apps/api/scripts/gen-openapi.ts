import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateSpecs } from "hono-openapi";
import app from "../src/routes/route";

const relativePath = "../../../openapi.json";

async function main() {
  const specs = await generateSpecs(app, {
    documentation: {
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
  });

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outputPath = resolve(__dirname, relativePath);
  await writeFile(outputPath, JSON.stringify(specs, null, 2));
}

main();
