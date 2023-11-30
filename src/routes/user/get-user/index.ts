import { ActionProps, ActionResponse } from "config/types";
import { GetUserResponse } from "./types";

const GetUser = async ({
  auth,
}: ActionProps): ActionResponse<GetUserResponse> => {
  if (!auth) {
    return {
      isError: true,
      code: 403,
      data: "Unauthorised",
    };
  }

  const data: GetUserResponse = {
    id: auth.id,
    authId: auth.authId,
    name: auth.name,
    createdAt: auth.createdAt.toISOString(),
    updatedAt: auth.updatedAt.toISOString(),
  };

  return {
    isError: false,
    code: 200,
    data,
  };
};

export default GetUser;
