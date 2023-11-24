import { Context } from "hono";
import {
  ActionProps,
  ActionResponseType,
  AppEnvs,
  Environments,
  ServiceErrorCodes,
  ServiceSuccessCodes,
} from "./types";
import verifyJwt from "src/utils/verify-jwt";
import db from "data";
import { User, user } from "data/schema";
import { eq } from "drizzle-orm";

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
  ctx,
  error,
  code = 400,
  data = error,
}: {
  ctx: Context;
  error?: string;
  code?: ServiceErrorCodes;
  data?: string | E;
}) => {
  if (process.env[AppEnvs.ENV] !== Environments.PROD) {
    ctx.status(code);

    return ctx.json({
      meta: {
        code,
        status: "error",
        error:
          error || (typeof data === "string" ? data : "Your request failed"),
        data,
      },
    });
  }

  ctx.status(code);

  return ctx.json({
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
  ({ action }: ControllerProps) =>
  async (ctx: Context) => {
    const repo = db();

    const authHeader = ctx.req.raw.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse({
        ctx,
        data: "Invalid credentials",
        code: 401,
      });
    }

    const bearer = authHeader.split("Bearer ")[1];

    const token = await verifyJwt(bearer);

    if (token.isError) {
      return errorResponse({
        ctx,
        data: "Invalid credentials",
        code: 401,
      });
    }
    const authId = token.data.sub;

    if (!authId) {
      return errorResponse({
        ctx,
        data: "Invalid credentials",
        code: 401,
      });
    }

    console.log("Auth ID: ", authId);

    let dbUser: User | null = null;

    const existingUser = await repo
      .select()
      .from(user)
      .where(eq(user.authId, authId));

    if (!existingUser.length) {
      const createdAt = new Date();
      const updatedAt = new Date();

      const newUser = await repo.insert(user).values({
        authId,
        createdAt,
        updatedAt,
      });

      dbUser = {
        id: newUser[0].insertId,
        name: null,
        authId,
        createdAt,
        updatedAt,
      };
    } else {
      dbUser = existingUser[0];
    }

    const response = await action({
      body: ctx.body,
      params: ctx.req.param,
      query: ctx.req.query,
      authId,
      user: dbUser,
    });

    if (response.isError) {
      return errorResponse({
        ctx,
        data: "Unknown error",
      });
    }

    return successResponse({
      ctx,
      data: response.data,
      code: response.code,
    });
  };

export default Controller;
