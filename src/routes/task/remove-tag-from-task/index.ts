import { ActionProps, ActionResponse } from "config/types";
import { RemoveTagFromTaskParams, RemoveTagFromTaskResponse } from "./types";
import { tag, task, taskToTag } from "data/schema";
import { validator } from "src/utils/validator";
import GetTask from "../get-task";
import paramsSchema from "./schema/params-schema";
import { and, eq } from "drizzle-orm";

const RemoveTagFromTask = async ({
  params,
  auth,
  repo,
}: ActionProps<RemoveTagFromTaskParams>): ActionResponse<RemoveTagFromTaskResponse> => {
  if (!auth) {
    return {
      isError: true,
      code: 403,
      data: "Unauthorised",
    };
  }

  const paramsValidator = validator<RemoveTagFromTaskParams>(
    params,
    paramsSchema
  );

  if (!paramsValidator.isValid) {
    return {
      isError: true,
      code: 400,
      data: paramsValidator.errors,
    };
  }

  const { taskId, tagId } = params;

  const parsedTaskId = parseInt(taskId);
  const parsedTagId = parseInt(tagId);

  const existingTaskEntityPromise = repo
    .select({
      id: task.id,
      userId: task.userId,
    })
    .from(task)
    .where(eq(task.id, parsedTaskId));

  const existingTagEntityPromise = repo
    .select({
      id: tag.id,
      userId: tag.userId,
    })
    .from(tag)
    .where(eq(tag.id, parsedTagId));

  const [existingTaskEntity, existingTagEntity] = await Promise.all([
    existingTaskEntityPromise,
    existingTagEntityPromise,
  ]);

  if (existingTaskEntity.length === 0) {
    return {
      isError: true,
      code: 404,
      data: "Could not find existing task",
    };
  }

  if (existingTaskEntity[0].userId !== auth.id) {
    return {
      isError: true,
      code: 403,
      data: "You are not authorised to update this task",
    };
  }

  if (existingTagEntity.length === 0) {
    return {
      isError: true,
      code: 404,
      data: "Could not find existing tag",
    };
  }

  if (existingTagEntity[0].userId !== auth.id) {
    return {
      isError: true,
      code: 403,
      data: "You are not authorised to use this tag",
    };
  }

  await repo
    .delete(taskToTag)
    .where(
      and(eq(taskToTag.taskId, parsedTaskId), eq(taskToTag.tagId, parsedTagId))
    );

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
      data: "Unable to retrieve task removing tag",
    };
  }

  const data = reloadedEntity.data;

  return {
    isError: false,
    code: 200,
    data: data,
  };
};

export default RemoveTagFromTask;