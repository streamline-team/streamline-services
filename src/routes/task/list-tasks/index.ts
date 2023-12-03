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

  const { title, priority, done, dueAt, sortColumn, sortOrder } = query;

  const where: SQL[] = [];

  where.push(eq(task.userId, auth.id));

  if (title) {
    where.push(like(task.title, `%${title}%`));
  }

  if (priority) {
    where.push(eq(task.priority, parseInt(priority, 10)));
  }

  if (done) {
    where.push(eq(task.done, parseInt(done, 10) === 1));
  }

  if (dueAt) {
    where.push(eq(task.dueAt, new Date(dueAt)));
  }

  queryBuilder.where(and(...where));

  if (sortColumn) {
    if (sortOrder && sortOrder === "DESC") {
      queryBuilder.orderBy(desc(task[sortColumn]));
    } else {
      queryBuilder.orderBy(asc(task[sortColumn]));
    }
  }

  const results = await queryBuilder;

  const convertRowToResult = (row: (typeof results)[0]): TasksWithTags => {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      done: row.done,
      dueAt: row.dueAt,
      priority: row.priority,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      tags: [],
    };
  };

  const data: TasksWithTags[] = [];

  const mappedEntities: Map<number, number> = new Map();

  results.forEach((result) => {
    const currentTransformed = mappedEntities.get(result.id);

    const nextIndex = data.length;

    if (currentTransformed === undefined) {
      mappedEntities.set(result.id, nextIndex);
      data.push(convertRowToResult(result));
    }

    const activeIndex =
      currentTransformed !== undefined ? currentTransformed : nextIndex;

    if (result.tag) {
      data[activeIndex].tags.push(result.tag);
    }
  });

  return {
    isError: false,
    data,
    code: 200,
  };
};

export default ListTasks;
