import { Hono } from "hono";
import db, { entityManager } from "data";
import { DatabaseError, ServiceResponse } from "config/types";
import routes from "config/routes";

import { ActionSuccessResponse } from "config/types";
import { JwtPayload } from "jsonwebtoken";
import verifyJwt from "utils/verify-jwt";
import { MySqlRawQueryResult } from "drizzle-orm/mysql2";

export const agent = new Hono();

export const agentRequest = async <T>(path: string, requestInit?: RequestInit | undefined) => {
  const response = await agent.request(path, requestInit)

  const data = await response.json()

  return data as ServiceResponse<T>
}

agent.route("/", routes);

jest.mock("utils/verify-jwt");

export const repo = () => {
  const transaction = entityManager.getTransaction();

  if (!transaction) {
    throw Error(
      "Transaction not available. Has global setup been initialised?"
    );
  }

  return transaction;
};

export const getInsertId = (result: MySqlRawQueryResult) => {
  return result[0].insertId;
};

export const verifyJwtMock = verifyJwt as jest.MockedFunction<typeof verifyJwt>;

export const authMock = async (
  authToken: string
): Promise<ActionSuccessResponse<JwtPayload>> => ({
  isError: false,
  code: 200,
  data: {
    sub: authToken,
  },
});

export const mockBody = (body: object) => {
  return JSON.stringify(body);
};

interface DoneCallback {
  (...args: any[]): any;
  fail(error?: string | { message: string }): any;
}

export const it = (
  title: string,
  fn: (doneCallback: DoneCallback) => Promise<void> | void
): void => {
  global.it(title, function () {
    return new Promise<void>((resolve, reject) => {
      const dbInstance = db();

      dbInstance
        .transaction(async (tx) => {
          entityManager.setTransaction(tx);

          const doneCallback: DoneCallback = ((err?: any) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          }) as DoneCallback;

          doneCallback.fail = () => {
            reject("Test failed");
          };

          await fn(doneCallback);
          tx.rollback();
          resolve();
        })
        .catch((err) => {
          if (err instanceof Error && err.message === DatabaseError.ROLLBACK) {
            resolve();
          } else {
            reject(err);
            console.error("Error in test:", err);
          }
        });
    });
  });
};
