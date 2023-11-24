import { relations } from "drizzle-orm";
import {
  boolean,
  datetime,
  int,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  tinyint,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const task = mysqlTable(
  "task",
  {
    id: int("id").primaryKey().autoincrement(),
    title: varchar("title", { length: 120 }).notNull(),
    description: text("description"),
    done: boolean("done").default(false).notNull(),
    dueDate: datetime("dueAt"),
    priority: tinyint("priority").default(5).notNull(),
    userId: int("userId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (task) => {
    return {
      titleIndex: uniqueIndex("titleIdx").on(task.title),
      doneIdx: uniqueIndex("doneIdx").on(task.done),
      dueDateIdx: uniqueIndex("dueDateIdx").on(task.dueDate),
      priorityIdx: uniqueIndex("priorityIdx").on(task.priority),
    };
  }
);

export const taskRelations = relations(task, ({ one, many }) => ({
  user: one(user, {
    fields: [task.userId],
    references: [user.id],
  }),
  taskToTag: many(taskToTag),
}));

export const taskToTag = mysqlTable(
  "taskToTag",
  {
    taskId: int("taskId")
      .notNull()
      .references(() => task.id),
    tagId: int("tagId")
      .notNull()
      .references(() => tag.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.taskId, table.tagId] }),
  })
);

export type Task = typeof task.$inferSelect;

export const tag = mysqlTable("tag", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 256 }).notNull(),
  background: varchar("background", { length: 9 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const tagRelations = relations(tag, ({ many }) => ({
  taskToTag: many(taskToTag),
}));

export type Tag = typeof tag.$inferSelect;

export const user = mysqlTable("user", {
  id: int("id").primaryKey().autoincrement(),
  authId: varchar("authId", { length: 40 }).notNull(),
  name: varchar("name", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
  tasks: many(task),
}));

export type User = typeof user.$inferSelect;
