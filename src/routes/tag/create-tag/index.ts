import { ActionProps, ActionResponse } from "config/types";
import { CreateTagBody, CreateTagResponse } from "./types";
import { tag } from "data/schema";
import { validator } from "utils/validator";
import bodySchema from "./schema/body-schema";
import GetTag from "../get-tag";

const CreateTag = async ({
  body,
  auth,
  repo,
}: ActionProps<{}, CreateTagBody>): ActionResponse<CreateTagResponse> => {
  if (!auth) {
    return {
      isError: true,
      code: 403,
      data: "Unauthorised",
    };
  }

  const paramsValidator = validator<CreateTagBody>(body, bodySchema);

  if (!paramsValidator.isValid) {
    return {
      isError: true,
      code: 400,
      data: paramsValidator.errors,
    };
  }

  const { name, background } = body;

  const insertEntity = await repo.insert(tag).values({
    name,
    background,
    userId: auth.id,
  });

  const reloadedEntity = await GetTag({
    params: {
      tagId: insertEntity[0].insertId.toString(),
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
      data: "Unable to retrieve tag after creation",
    };
  }

  const data = reloadedEntity.data;

  return {
    isError: false,
    code: 200,
    data: data,
  };
};

export default CreateTag;
