import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

export const connection = (): mysql.Pool => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "streamline",
    database: process.env.DB_NAME || "streamline",
    multipleStatements: true,
  });

  return pool;
};

export const db = () => {
  const pool = connection();

  const db = drizzle(pool, { schema, mode: "default" });

  return db;
};

export default db;
