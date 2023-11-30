import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "streamline",
  database: process.env.DB_NAME || "streamline",
  multipleStatements: true,
});

export const db = () => {
  const db = drizzle(pool, { schema, mode: "default", logger: true });

  return db;
};

export default db;
