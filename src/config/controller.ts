import { Context } from "hono";
import {
  ActionErrorResponse,
  ActionProps,
  ActionResponseType,
  AppEnvs,
  Environments,
  ResponseStatus,
  ServiceErrorCodes,
  ServiceSuccessCodes,
} from "./types";
import verifyJwt from "utils/verify-jwt";
import db, { entityManager } from "data";
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
    meta: { code, status: ResponseStatus.SUCCCESS },
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
        status: ResponseStatus.ERROR,
        error:
          error || (typeof data === "string" ? data : "Your request failed"),
        data,
      },
    });
  }

  ctx.status(code);

  return ctx.json({
    meta: { code, status: ResponseStatus.ERROR, data },
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
      // const isDev = process.env.APP_ENV === Environments.DEV;
      let dbInstance = db();

      let dbUser: User | null = null;
      let authId: string | null = null;

      const existingTransaction = entityManager.getTransaction();

      if (existingTransaction) {
        dbInstance = existingTransaction;
      }

      if (!disableAuth) {
        const authHeader = ctx.req.raw.headers.get("Authorization");

        const token = await verifyJwt(authHeader);

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
            data: "Invalid credentials - no authid",
            code: 401,
          });
        }

        const existingUser = await dbInstance
          .select()
          .from(user)
          .where(eq(user.authId, authId));

        if (!existingUser.length) {
          const createdAt = new Date();
          const updatedAt = new Date();

          const newUser = await dbInstance.insert(user).values({
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

      let response: ActionResponseType<Result>;

      if (existingTransaction) {
        response = await action({
          body: body as Body,
          params: ctx.req.param() as Params,
          query: ctx.req.query() as Query,
          auth: dbUser,
          repo: existingTransaction,
        });
      } else {
        try {
          response = await dbInstance.transaction(async (repo) => {
            const actionResponse = await action({
              body: body as Body,
              params: ctx.req.param() as Params,
              query: ctx.req.query() as Query,
              auth: dbUser,
              repo,
            });

            if (actionResponse.isError) {
              throw actionResponse;
            }

            return actionResponse;
          });
        } catch (error) {
          const controllerError = error as ActionErrorResponse;

          const { code, data } = controllerError;

          if (!data) throw error;

          const isErrorObject = typeof data === "object";

          const stringifiedError = isErrorObject
            ? JSON.stringify(data)
            : data.toString();

          return errorResponse({
            ctx,
            data: stringifiedError,
            code,
          });
        }
      }

      if (response.isError) {
        return errorResponse({
          ctx,
          data: response.data,
          code: response.code,
        });
      }

      return successResponse({
        ctx,
        data: response.data,
        code: response.code,
      });
    } catch (error) {
      return catchControllerError({
        ctx,
        error,
      });
    }
  };

export default Controller;
