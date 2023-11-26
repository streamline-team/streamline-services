import { ActionProps, ActionResponse } from "config/types";
import { GetTaskParams, GetTaskResponse } from "./types";
import db from "data";
import { tag, task, taskToTag } from "data/schema";
import { eq } from "drizzle-orm";
import { validator } from "src/utils/validator";
import paramsSchema from "./schema/params-schema";

const GetTask = async ({
  params,
  user,
}: ActionProps<GetTaskParams>): ActionResponse<GetTaskResponse> => {
  if (!user) {
    return {
      isError: true,
      code: 403,
      data: "Unauthorised",
    };
  }

  const { taskId } = params;

  const paramsValidator = validator<GetTaskParams>(params, paramsSchema);

  if (!paramsValidator.isValid) {
    return {
      isError: true,
      code: 400,
      data: paramsValidator.errors,
    };
  }

  const repo = db();

  const taskData = await repo
    .select({
      id: task.id,
      title: task.title,
      description: task.description,
      done: task.done,
      dueDate: task.dueDate,
      priority: task.priority,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      userId: task.userId,
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
    .where(eq(task.id, parseInt(taskId)));

  if (!taskData.length) {
    return {
      isError: true,
      code: 404,
      data: "Task not found",
    };
  }

  const matchingTask = taskData[0];

  if (matchingTask.userId !== user.id) {
    return {
      isError: true,
      code: 403,
      data: "You are not allowed to access this resource",
    };
  }

  const data: GetTaskResponse = {
    id: matchingTask.id,
    title: matchingTask.title,
    description: matchingTask.description,
    done: matchingTask.done,
    dueDate: matchingTask.dueDate,
    priority: matchingTask.priority,
    createdAt: matchingTask.createdAt,
    updatedAt: matchingTask.updatedAt,
    tags: [],
  };

  taskData.map((taskRecord) => {
    if (taskRecord.tag) {
      data.tags.push(taskRecord.tag);
    }
  });

  return {
    isError: false,
    code: 200,
    data,
  };
};

export default GetTask;
