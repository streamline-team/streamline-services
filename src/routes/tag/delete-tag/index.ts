import { ActionProps, ActionResponse } from "config/types";
import { DeleteTagParams } from "./types";
import { tag } from "data/schema";
import { eq } from "drizzle-orm";
import { validator } from "utils/validator";
import paramsSchema from "./schema/params-schema";

const DeleteTag = async ({
  params,
  auth,
  repo,
}: ActionProps<DeleteTagParams>): ActionResponse<{}> => {
  if (!auth) {
    return {
      isError: true,
      code: 403,
      data: "Unauthorised",
    };
  }

  const paramsValidator = validator<DeleteTagParams>(params, paramsSchema);

  if (!paramsValidator.isValid) {
    return {
      isError: true,
      code: 400,
      data: paramsValidator.errors,
    };
  }

  const { tagId } = params;

  const parsedTagId = parseInt(tagId, 10);

  const existingTag = await repo
    .select({
      id: tag.id,
      userId: tag.userId,
    })
    .from(tag)
    .where(eq(tag.id, parsedTagId));

  if (existingTag.length === 0) {
    return {
      isError: true,
      code: 404,
      data: "Tag not found",
    };
  }

  const matchingTag = existingTag[0];

  if (matchingTag.userId !== auth.id) {
    return {
      isError: true,
      code: 403,
      data: "You are not authorised to delete this tag",
    };
  }

  await repo.delete(tag).where(eq(tag.id, parsedTagId));

  return {
    isError: false,
    code: 200,
    data: "Successfully deleted tag",
  };
};

export default DeleteTag;
