import { ActionProps, ActionResponse } from "config/types";
import { GetTagParams, GetTagResponse } from "./types";
import { tag } from "data/schema";
import { eq } from "drizzle-orm";
import { validator } from "src/utils/validator";
import paramsSchema from "./schema/params-schema";

const GetTag = async ({
  params,
  auth,
  repo,
}: ActionProps<GetTagParams>): ActionResponse<GetTagResponse> => {
  if (!auth) {
    return {
      isError: true,
      code: 403,
      data: "Unauthorised",
    };
  }

  const { tagId } = params;

  const paramsValidator = validator<GetTagParams>(params, paramsSchema);

  if (!paramsValidator.isValid) {
    return {
      isError: true,
      code: 400,
      data: paramsValidator.errors,
    };
  }

  const tagData = await repo
    .select({
      id: tag.id,
      name: tag.name,
      background: tag.background,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
      userId: tag.userId,
    })
    .from(tag)
    .where(eq(tag.id, parseInt(tagId)));

  if (!tagData.length) {
    return {
      isError: true,
      code: 404,
      data: "Tag not found",
    };
  }

  if (tagData[0].userId !== auth.id) {
    return {
      isError: true,
      code: 403,
      data: "You are not authorised to read this tag",
    };
  }

  const matchingTag = tagData[0];

  const data: GetTagResponse = {
    id: matchingTag.id,
    name: matchingTag.name,
    background: matchingTag.background,
    createdAt: matchingTag.createdAt.toISOString(),
    updatedAt: matchingTag.updatedAt.toISOString(),
  };

  return {
    isError: false,
    code: 200,
    data,
  };
};

export default GetTag;
