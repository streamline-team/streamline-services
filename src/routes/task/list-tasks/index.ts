import { ActionProps, ActionResponse } from "config/types";
import db from "data";
import { task, tag, taskToTag, user, Task, Tag } from "data/schema";
import { eq } from "drizzle-orm";

interface TasksWithTags extends Omit<Task, "userId"> {
  tags: ListTag[];
}

interface ListTag extends Omit<Tag, "updatedAt"> {}

const ListTasks = async ({ authId }: ActionProps): ActionResponse<{}> => {
  if (!authId) {
    return {
      isError: true,
      code: 401,
      data: "Unauthorised",
    };
  }

  const repo = db();

  const results = await repo
    .select({
      id: task.id,
      title: task.title,
      description: task.description,
      done: task.done,
      dueDate: task.dueDate,
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
    .leftJoin(tag, eq(tag.id, taskToTag.tagId))
    .innerJoin(user, eq(user.authId, authId));

  const data = results.reduce<Record<string, TasksWithTags>>((acc, cur) => {
    const taskId = cur.id;
    const task =
      acc[taskId] ||
      (acc[taskId] = {
        id: cur.id,
        title: cur.title,
        description: cur.description,
        done: cur.done,
        dueDate: cur.dueDate,
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
