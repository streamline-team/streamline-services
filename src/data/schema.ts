import { relations } from "drizzle-orm";
import {
  boolean,
  datetime,
  index,
  int,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  tinyint,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

export const task = mysqlTable(
  "task",
  {
    id: int("id").primaryKey().autoincrement(),
    title: varchar("title", { length: 120 }).notNull(),
    description: text("description"),
    done: boolean("done").default(false).notNull(),
    dueAt: datetime("dueAt", {
      fsp: 3
    }),
    priority: tinyint("priority").default(5).notNull(),
    userId: int("userId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt", {
      fsp: 3
    }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", {
      fsp: 3
    }).defaultNow().notNull(),
  },
  (task) => {
    return {
      titleIndex: index("titleIdx").on(task.title),
      doneIdx: index("doneIdx").on(task.done),
      dueAtIdx: index("dueAtIdx").on(task.dueAt),
      priorityIdx: index("priorityIdx").on(task.priority),
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
      .references(() => task.id, { onDelete: "cascade" }),
    tagId: int("tagId")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (taskToTag) => ({
    pk: primaryKey({ columns: [taskToTag.taskId, taskToTag.tagId] }),
  })
);

export type Task = typeof task.$inferSelect;

export const tag = mysqlTable(
  "tag",
  {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 256 }).notNull(),
    background: varchar("background", { length: 9 }),
    userId: int("userId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt", {
      fsp: 3
    }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", {
      fsp: 3
    }).defaultNow().notNull(),
  },
  (tag) => ({
    pk: unique().on(tag.name, tag.background, tag.userId),
  })
);

export const tagRelations = relations(tag, ({ many, one }) => ({
  taskToTag: many(taskToTag),
  user: one(user, {
    fields: [tag.userId],
    references: [user.id],
  }),
}));

export type Tag = typeof tag.$inferSelect;

export const user = mysqlTable("user", {
  id: int("id").primaryKey().autoincrement(),
  authId: varchar("authId", { length: 40 }).notNull(),
  name: varchar("name", { length: 256 }),
  createdAt: timestamp("createdAt", {
    fsp: 3
  }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", {
    fsp: 3
  }).defaultNow().notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
  tasks: many(task),
}));

export type User = typeof user.$inferSelect;
