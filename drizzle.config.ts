import type { Config } from "drizzle-kit";

export default {
  schema: "./src/data/schema.ts",
  out: "./src/data/migrations",
  driver: "mysql2",
  dbCredentials: {
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "streamline",
    database: process.env.DB_NAME || "streamline",
  },
} satisfies Config;
