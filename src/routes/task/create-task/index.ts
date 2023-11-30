import { ActionProps, ActionResponse } from "config/types";
import { CreateTaskBody, CreateTaskResponse } from "./types";
import { task } from "data/schema";
import { validator } from "src/utils/validator";
import bodySchema from "./schema/body-schema";
import GetTask from "../get-task";

const CreateTask = async ({
  body,
  auth,
  repo,
}: ActionProps<{}, CreateTaskBody>): ActionResponse<CreateTaskResponse> => {
  if (!auth) {
    return {
      isError: true,
      code: 403,
      data: "Unauthorised",
    };
  }

  const paramsValidator = validator<CreateTaskBody>(body, bodySchema);

  if (!paramsValidator.isValid) {
    return {
      isError: true,
      code: 400,
      data: paramsValidator.errors,
    };
  }

  const { title, description, dueAt, priority } = body;

  const insertEntity = await repo.insert(task).values({
    title,
    description,
    dueAt: dueAt ? new Date(dueAt) : null,
    priority: priority ?? 5,
    userId: auth.id,
  });

  const reloadedEntity = await GetTask({
    params: {
      taskId: insertEntity[0].insertId.toString(),
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
      data: "Unable to retrieve task after creation",
    };
  }

  const data = reloadedEntity.data;

  return {
    isError: false,
    code: 200,
    data: data,
  };
};

export default CreateTask;
