import { ActionProps, ActionResponse } from "config/types";
import { UpdateTagBody, UpdateTagResponse, UpdateTagParams } from "./types";
import { tag } from "data/schema";
import { validator } from "utils/validator";
import bodySchema from "./schema/body-schema";
import GetTag from "../get-tag";
import paramsSchema from "./schema/params-schema";
import { eq } from "drizzle-orm";

const UpdateTag = async ({
  params,
  body,
  auth,
  repo,
}: ActionProps<
  UpdateTagParams,
  UpdateTagBody
>): ActionResponse<UpdateTagResponse> => {
  if (!auth) {
    return {
      isError: true,
      code: 403,
      data: "Unauthorised",
    };
  }

  const paramsValidator = validator<UpdateTagParams>(params, paramsSchema);

  if (!paramsValidator.isValid) {
    return {
      isError: true,
      code: 400,
      data: paramsValidator.errors,
    };
  }

  const bodyValidator = validator<UpdateTagBody>(body, bodySchema);

  if (!bodyValidator.isValid) {
    return {
      isError: true,
      code: 400,
      data: bodyValidator.errors,
    };
  }

  const { tagId } = params;

  const { name, background } = body;

  const parsedTagId = parseInt(tagId);

  const existingEntity = await repo
    .select({
      id: tag.id,
      userId: tag.userId,
    })
    .from(tag)
    .where(eq(tag.id, parsedTagId));

  if (existingEntity.length === 0) {
    return {
      isError: true,
      code: 404,
      data: "Could not find existing tag",
    };
  }

  if (existingEntity[0].userId !== auth.id) {
    return {
      isError: true,
      code: 403,
      data: "You are not authorised to update this tag",
    };
  }

  await repo
    .update(tag)
    .set({
      name,
      background,
      updatedAt: new Date(),
    })
    .where(eq(tag.id, parsedTagId));

  const reloadedEntity = await GetTag({
    params: {
      tagId: tagId,
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

export default UpdateTag;
