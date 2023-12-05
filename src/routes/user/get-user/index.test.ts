import {
  agentRequest,
  authMock,
  getInsertId,
  it,
  repo,
  verifyJwtMock,
} from "test/utils";
import { GetUserResponse } from "./types";
import { ResponseStatus } from "config/types";
import { user } from "data/schema";
import GetUser from ".";
import { entityManager } from "data";

describe("GET /user", () => {
  it("should successfully return user from authentication", async () => {
    const authId = "test-user-1";

    const now = new Date();
    const isoDate = now.toISOString();

    const userEntity = await repo().insert(user).values({
      authId,
      createdAt: now,
      updatedAt: now,
    });

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const getUserResponse = await agentRequest<GetUserResponse>(`/user`, {
      method: "GET",
    });

    const { meta, data } = getUserResponse;

    expect(meta.status).toBe(ResponseStatus.SUCCCESS);
    expect(meta.code).toBe(200);

    expect(data).toMatchObject({
      id: getInsertId(userEntity),
      name: null,
      authId,
      createdAt: isoDate,
      updatedAt: isoDate,
    });
  });

  it("should return user without a record created prior to request", async () => {
    const authId = "test-user-1";

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const getUserResponse = await agentRequest<GetUserResponse>(`/user`, {
      method: "GET",
    });

    const { meta, data } = getUserResponse;

    expect(meta.status).toBe(ResponseStatus.SUCCCESS);
    expect(meta.code).toBe(200);

    expect(data).toMatchObject({
      name: null,
      authId,
    });
  });

  it("should not allow an unauthenticated user", async () => {
    verifyJwtMock.mockImplementation(async () => ({
      isError: true,
      code: 403,
      data: null,
    }));

    const getUserResponse = await agentRequest<GetUserResponse>(`/user`, {
      method: "GET",
    });

    const { meta } = getUserResponse;

    expect(meta.status).toBe(ResponseStatus.ERROR);
    expect(meta.code).toBe(401);
  });

  it("should return 403 if user verification is bypassed", async () => {
    const repo = entityManager.getTransaction();

    expect(repo).not.toBeNull();

    if (repo === null) {
      return;
    }

    const getUserResponse = await GetUser({
      body: {},
      params: {},
      query: {},
      auth: null,
      repo,
    });

    const { isError, code, data } = getUserResponse;

    expect(isError).toBe(true);
    expect(code).toBe(403);
    expect(data).toBe("Unauthorised");
  });
});
