import {
  MySql2PreparedQueryHKT,
  MySql2QueryResultHKT,
  drizzle,
} from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import { MySqlTransaction } from "drizzle-orm/mysql-core";
import { ExtractTablesWithRelations } from "drizzle-orm";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "streamline",
  database: process.env.DB_NAME || "streamline",
  multipleStatements: true,
});

export const db = () => {
  const db = drizzle(pool, { schema, mode: "default", logger: false });

  return db;
};

let instance: TransactionState;

export type Transaction = MySqlTransaction<
  MySql2QueryResultHKT,
  MySql2PreparedQueryHKT,
  typeof import("data/schema"),
  ExtractTablesWithRelations<typeof import("data/schema")>
>;

let globalTransactionState: Transaction | null;
class TransactionState {
  constructor() {
    if (instance) {
      throw new Error("New instance cannot be created!!");
    }

    instance = this;
  }

  getTransaction() {
    return globalTransactionState;
  }

  setTransaction(transaction: Transaction) {
    globalTransactionState = transaction;
  }
}

export let entityManager = Object.freeze(new TransactionState());

export default db;
