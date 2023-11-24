import { Context } from "hono";
import {
  ActionProps,
  ActionResponseType,
  AppEnvs,
  Environments,
  ServiceErrorCodes,
  ServiceSuccessCodes,
} from "./types";

export const successResponse = <T>({
  ctx,
  data,
  code = 200,
}: {
  ctx: Context;
  data: T;
  code?: ServiceSuccessCodes;
}) => {
  ctx.status(code);

  return ctx.json({
    meta: { code, status: "success" },
    data,
  });
};

export const errorResponse = async <E>({
  res,
  error,
  code = 400,
  data = error,
}: {
  res: Context;
  error?: string;
  code?: ServiceErrorCodes;
  data?: string | E;
}) => {
  if (process.env[AppEnvs.ENV] !== Environments.PROD) {
    res.status(code);

    return res.json({
      meta: {
        code,
        status: "error",
        error:
          error || (typeof data === "string" ? data : "Your request failed"),
        data,
      },
    });
  }

  res.status(code);

  return res.json({
    meta: { code, status: "error", data },
  });
};

type ActionFn<Params = {}, Body = {}, Query = {}, ReturnData = {}> = (
  data: ActionProps<Params, Body, Query>
) => Promise<ActionResponseType<ReturnData>>;

interface ControllerProps {
  action: ActionFn;
}
const Controller =
  ({}: ControllerProps) =>
  async (ctx: Context) => {
    return successResponse({
      ctx,
      data: "test",
      code: 200,
    });
  };

export default Controller;
