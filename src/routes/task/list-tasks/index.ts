import { ActionProps, ActionResponse } from "config/types";
import { task, tag, taskToTag, Task, Tag } from "data/schema";
import { SQL, and, asc, desc, eq, like } from "drizzle-orm";
import { ListTasksQuery } from "./types";
import { validator } from "src/utils/validator";
import querySchema from "./schema/query-schema";

interface TasksWithTags extends Omit<Task, "userId"> {
  tags: ListTag[];
}

interface ListTag extends Omit<Tag, "updatedAt" | "userId"> {}

const ListTasks = async ({
  query,
  auth,
  repo,
}: ActionProps<{}, {}, ListTasksQuery>): ActionResponse<{}> => {
  if (!auth) {
    return {
      isError: true,
      code: 403,
      data: "Unauthorised",
    };
  }

  const paramsValidator = validator<ListTasksQuery>(query, querySchema);

  if (!paramsValidator.isValid) {
    return {
      isError: true,
      code: 400,
      data: paramsValidator.errors,
    };
  }

  const queryBuilder = repo
    .select({
      id: task.id,
      title: task.title,
      description: task.description,
      done: task.done,
      dueAt: task.dueAt,
      priority: task.priority,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      tag: {
        id: tag.id,
        name: tag.name,
        background: tag.background,
        createdAt: tag.createdAt,
      },
    })
    .from(task)
    .leftJoin(taskToTag, eq(taskToTag.taskId, task.id))
    .leftJoin(tag, eq(tag.id, taskToTag.tagId));

  const { title, priority, done, dueAt, sort } = query;

  const where: SQL[] = [];

  where.push(eq(task.userId, auth.id));

  if (title) {
    where.push(like(task.title, `%${title}%`));
  }

  if (priority) {
    where.push(eq(task.priority, priority));
  }

  if (done) {
    where.push(eq(task.done, done));
  }

  if (dueAt) {
    where.push(eq(task.dueAt, new Date(dueAt)));
  }

  queryBuilder.where(and(...where));

  if (sort) {
    const { column, order } = sort;

    if (order && order === "ASC") {
      queryBuilder.orderBy(asc(task[column]));
    } else {
      queryBuilder.orderBy(desc(task[column]));
    }
  }

  const results = await queryBuilder;

  const data = results.reduce<Record<string, TasksWithTags>>((acc, cur) => {
    const taskId = cur.id;
    const task =
      acc[taskId] ||
      (acc[taskId] = {
        id: cur.id,
        title: cur.title,
        description: cur.description,
        done: cur.done,
        dueAt: cur.dueAt,
        priority: cur.priority,
        createdAt: cur.createdAt,
        updatedAt: cur.updatedAt,
        tags: [],
      });

    if (cur.tag) {
      task.tags.push(cur.tag);
    }

    return acc;
  }, {});

  return {
    isError: false,
    data: Object.values(data),
    code: 200,
  };
};

export default ListTasks;
