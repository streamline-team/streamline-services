import { ActionProps, ActionResponse } from "config/types";
import { DeleteTaskParams } from "./types";
import { task } from "data/schema";
import { eq } from "drizzle-orm";
import { validator } from "src/utils/validator";
import paramsSchema from "./schema/params-schema";

const DeleteTask = async ({
  params,
  auth,
  repo,
}: ActionProps<DeleteTaskParams>): ActionResponse<{}> => {
  if (!auth) {
    return {
      isError: true,
      code: 403,
      data: "Unauthorised",
    };
  }

  const paramsValidator = validator<DeleteTaskParams>(params, paramsSchema);

  if (!paramsValidator.isValid) {
    return {
      isError: true,
      code: 400,
      data: paramsValidator.errors,
    };
  }

  const { taskId } = params;

  const parsedTaskId = parseInt(taskId, 10);

  const existingTask = await repo
    .select({
      id: task.id,
      userId: task.userId,
    })
    .from(task)
    .where(eq(task.id, parsedTaskId));

  if (existingTask.length === 0) {
    return {
      isError: true,
      code: 404,
      data: "Task not found",
    };
  }

  const matchingTask = existingTask[0];

  if (matchingTask.userId !== auth.id) {
    return {
      isError: true,
      code: 403,
      data: "You are not authorised to delete this task",
    };
  }

  await repo.delete(task).where(eq(task.id, parsedTaskId));

  return {
    isError: false,
    code: 200,
    data: "Successfully deleted task",
  };
};

export default DeleteTask;
