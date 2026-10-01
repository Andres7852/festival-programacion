import "dotenv/config";
import { createPrismaClient } from "./infrastructure/database/prisma-client.js";
import { PrismaShowsRepository } from "./infrastructure/repositories/prisma-shows.repository.js";
import { createApp } from "./interface/http/create-app.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Falta configurar DATABASE_URL");
}

const prisma = createPrismaClient(connectionString);
const app = createApp(new PrismaShowsRepository(prisma));
const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`API escuchando en el puerto ${port}`);
});