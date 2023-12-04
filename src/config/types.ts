import { ErrorObject } from "ajv";
import { Transaction } from "data";
import { User } from "data/schema";

export enum Environments {
  DEV = "dev",
  STAGE = "stage",
  PROD = "prod",
}

export enum AppEnvs {
  ENV = "APP_ENV",
}

export enum DatabaseError {
  ROLLBACK = "Rollback",
}

/* Error Response */
export type ValidatorErrors = ErrorObject[] | null | undefined;
export type ActionErrorResponsePayload = ValidatorErrors | object | string;

export type ServiceErrorCodes =
  | 400
  | 401
  | 403
  | 404
  | 409
  | 422
  | 428
  | 429
  | 500;
export interface ActionErrorResponse {
  isError: true;
  code: ServiceErrorCodes;
  data: ActionErrorResponsePayload;
}

/* Success Response */
export type ServiceSuccessCodes = 200 | 201 | 204;
export interface ActionSuccessResponse<T> {
  isError: false;
  data: T;
  code?: ServiceSuccessCodes;
}

export type ActionResponseType<T> =
  | ActionErrorResponse
  | ActionSuccessResponse<T>;

export type ServiceResponse<T> =
  | {
      meta: {
        code: ServiceSuccessCodes;
        status: "success";
      };
      data: T;
    }
  | {
      meta: {
        code: ServiceErrorCodes;
        status: "error";
        errors: ValidatorErrors;
        data?: T;
        error?: string;
      };
      data: undefined;
    };

export interface Shared {
  auth: User | null;
}

export type ActionProps<Params = {}, Body = {}, Query = {}> = {
  params: Params;
  body: Body;
  query: Query;
  repo: Transaction;
} & Shared;

export type ActionResponse<T> = Promise<ActionResponseType<T>>;
