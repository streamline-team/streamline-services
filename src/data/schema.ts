import { bigint, mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const tasks = mysqlTable("tasks", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  title: varchar("name", { length: 256 }),
  description: varchar("name", { length: 256 }),
});

export type Task = typeof tasks.$inferSelect;
