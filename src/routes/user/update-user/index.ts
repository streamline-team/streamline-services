import { ActionProps, ActionResponse } from "config/types";
import { UpdateUserBody, UpdateUserResponse } from "./types";
import { user } from "data/schema";
import { validator } from "utils/validator";
import bodySchema from "./schema/body-schema";
import { eq } from "drizzle-orm";

const UpdateUser = async ({
  body,
  auth,
  repo,
}: ActionProps<{}, UpdateUserBody>): ActionResponse<UpdateUserResponse> => {
  if (!auth) {
    return {
      isError: true,
      code: 403,
      data: "Unauthorised",
    };
  }

  const bodyValidator = validator<UpdateUserBody>(body, bodySchema);

  if (!bodyValidator.isValid) {
    return {
      isError: true,
      code: 400,
      data: bodyValidator.errors,
    };
  }

  const { name } = body;

  await repo
    .update(user)
    .set({
      name,
      updatedAt: new Date(),
    })
    .where(eq(user.id, auth.id));

  const reloadedEntity = await repo
    .select({
      id: user.id,
      authId: user.authId,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .where(eq(user.id, auth.id));

  const updatedEntity = reloadedEntity[0];

  const data: UpdateUserResponse = {
    id: updatedEntity.id,
    authId: updatedEntity.authId,
    name: updatedEntity.name,
    createdAt: updatedEntity.createdAt.toISOString(),
    updatedAt: updatedEntity.updatedAt.toISOString(),
  };

  return {
    isError: false,
    code: 200,
    data: data,
  };
};

export default UpdateUser;
