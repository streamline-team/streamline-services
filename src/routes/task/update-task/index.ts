import { ActionProps, ActionResponse } from "config/types";
import { UpdateTaskBody, UpdateTaskResponse, UpdateTaskParams } from "./types";
import { task } from "data/schema";
import { validator } from "src/utils/validator";
import bodySchema from "./schema/body-schema";
import GetTask from "../get-task";
import paramsSchema from "./schema/params-schema";
import { eq } from "drizzle-orm";

const UpdateTask = async ({
  params,
  body,
  auth,
  repo,
}: ActionProps<
  UpdateTaskParams,
  UpdateTaskBody
>): ActionResponse<UpdateTaskResponse> => {
  if (!auth) {
    return {
      isError: true,
      code: 403,
      data: "Unauthorised",
    };
  }

  const paramsValidator = validator<UpdateTaskParams>(params, paramsSchema);

  if (!paramsValidator.isValid) {
    return {
      isError: true,
      code: 400,
      data: paramsValidator.errors,
    };
  }

  const bodyValidator = validator<UpdateTaskBody>(body, bodySchema);

  if (!bodyValidator.isValid) {
    return {
      isError: true,
      code: 400,
      data: bodyValidator.errors,
    };
  }

  const { taskId } = params;

  const { title, description, dueAt, priority, done } = body;

  const parsedTaskId = parseInt(taskId);

  const existingEntity = await repo
    .select({
      id: task.id,
      userId: task.userId,
    })
    .from(task)
    .where(eq(task.id, parsedTaskId));

  if (existingEntity.length === 0) {
    return {
      isError: true,
      code: 404,
      data: "Could not find existing task",
    };
  }

  if (existingEntity[0].userId !== auth.id) {
    return {
      isError: true,
      code: 403,
      data: "You are not authorised to update this task",
    };
  }

  await repo
    .update(task)
    .set({
      title,
      description,
      done,
      dueAt: dueAt ? new Date(dueAt) : undefined,
      priority: priority ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(task.id, parsedTaskId));

  const reloadedEntity = await GetTask({
    params: {
      taskId: taskId,
    },
    query: {},
    body: {},
    auth,
    repo,
  });

  if (reloadedEntity.isError) {
    return {
      isError: true,
      code: reloadedEntity.code,
      data: "Unable to retrieve task after updating",
    };
  }

  const data = reloadedEntity.data;

  return {
    isError: false,
    code: 200,
    data: data,
  };
};

export default UpdateTask;
