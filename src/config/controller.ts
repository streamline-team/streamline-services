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

async function catchControllerError({
  ctx,
  error,
}: {
  ctx: Context;
  error: any;
}) {
  if (error instanceof Error) {
    return errorResponse<Error>({
      ctx,
      error: error.message,
      code: 400,
      data: error.stack,
    });
  }

  return errorResponse({ ctx, error, code: 400, data: error });
}

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

interface ControllerProps<Params = {}, Body = {}, Query = {}, ReturnData = {}> {
  action: ActionFn<Params, Body, Query, ReturnData>;
  disableAuth?: boolean;
}
const Controller =
  <Params = {}, Body = {}, Query = {}, Result = {}>({
    action,
    disableAuth,
  }: ControllerProps<Params, Body, Query, Result>) =>
  async (ctx: Context) => {
    try {
      const repo = db();

      let dbUser: User | null = null;
      let authId: string | null = null;

      if (!disableAuth) {
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
        authId = token.data.sub || null;

        if (!authId) {
          return errorResponse({
            ctx,
            data: "Invalid credentials",
            code: 401,
          });
        }

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
      }

      let body: Record<string, unknown>;

      try {
        body = await ctx.req.json();
      } catch {
        body = {};
      }

      const response = await action({
        body: body as Body,
        params: ctx.req.param() as Params,
        query: ctx.req.query() as Query,
        auth: dbUser,
        repo,
      });

      if (response.isError) {
        return errorResponse({
          ctx,
          data: response.data,
        });
      }

      return successResponse({
        ctx,
        data: response.data,
        code: response.code,
      });
    } catch (error) {
      console.log(error);

      return catchControllerError({
        ctx,
        error,
      });
    }
  };

export default Controller;
