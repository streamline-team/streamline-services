import { ActionProps, ActionResponse } from "config/types";
import { CreateTaskBody, CreateTaskResponse } from "./types";
import { tag, task, taskToTag } from "data/schema";
import { validator } from "utils/validator";
import bodySchema from "./schema/body-schema";
import GetTask from "../get-task";
import { inArray } from "drizzle-orm";

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

  const { title, description, dueAt, priority, tags } = body;

  const insertEntity = await repo.insert(task).values({
    title,
    description,
    dueAt: dueAt ? new Date(dueAt) : null,
    priority: priority ?? 5,
    userId: auth.id,
  });

  const insertId = insertEntity[0].insertId;

  if (tags && tags.length) {
    const availableTags = await repo
      .select({
        id: tag.id,
        userId: tag.userId,
      })
      .from(tag)
      .where(inArray(tag.id, tags));

    const unauthorisedTag = availableTags.find((tag) => tag.userId !== auth.id);

    if (availableTags.length !== tags.length) {
      return {
        isError: true,
        code: 404,
        data: "Could not find existing tag",
      };
    }

    if (unauthorisedTag) {
      return {
        isError: true,
        code: 403,
        data: "You are not authorised to add this tag",
      };
    }

    await repo
      .insert(taskToTag)
      .values(tags.map((tag) => ({ tagId: tag, taskId: insertId })));
  }

  const reloadedEntity = await GetTask({
    params: {
      taskId: insertId.toString(),
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
