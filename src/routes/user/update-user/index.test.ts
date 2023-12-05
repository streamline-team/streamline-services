import { ResponseStatus } from "config/types";
import {
  agentRequest,
  authMock,
  getInsertId,
  it,
  mockBody,
  repo,
  verifyJwtMock,
} from "test/utils";
import { UpdateUserBody, UpdateUserResponse } from "./types";
import { user } from "data/schema";
import { entityManager } from "data";
import UpdateUser from ".";

describe("PATCH /user", () => {
  it("should successfully return updated user", async () => {
    const authId = "test-user-1";

    const now = new Date();
    const isoDate = now.toISOString();

    const userEntity = await repo().insert(user).values({
      authId,
      createdAt: now,
      updatedAt: now,
    });

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const updateUserBody: UpdateUserBody = {
      name: "Test Name",
    };

    const updateUserResponse = await agentRequest<UpdateUserResponse>(`/user`, {
      method: "PATCH",
      body: mockBody(updateUserBody),
    });

    const { meta, data } = updateUserResponse;

    expect(meta.status).toBe(ResponseStatus.SUCCCESS);
    expect(meta.code).toBe(200);

    expect(data).toMatchObject({
      id: getInsertId(userEntity),
      name: updateUserBody.name,
      authId,
      createdAt: isoDate,
    });
  });

  it("should update user without a record created prior to request", async () => {
    const authId = "test-user-1";

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const updateUserBody: UpdateUserBody = {
      name: "Test Name",
    };

    const updateUserResponse = await agentRequest<UpdateUserResponse>(`/user`, {
      method: "PATCH",
      body: mockBody(updateUserBody),
    });

    const { meta, data } = updateUserResponse;

    expect(meta.status).toBe(ResponseStatus.SUCCCESS);
    expect(meta.code).toBe(200);

    expect(data).toMatchObject({
      name: updateUserBody.name,
      authId,
    });
  });

  it("should not allow an unauthenticated user to update", async () => {
    verifyJwtMock.mockImplementation(async () => ({
      isError: true,
      code: 403,
      data: null,
    }));

    const updateUserBody: UpdateUserBody = {
      name: "Test Name",
    };

    const updateUserResponse = await agentRequest<UpdateUserResponse>(`/user`, {
      method: "PATCH",
      body: mockBody(updateUserBody),
    });

    const { meta } = updateUserResponse;

    expect(meta.status).toBe(ResponseStatus.ERROR);
    expect(meta.code).toBe(401);
  });

  it("should not allow user update without a minimum of 1 body prop", async () => {
    const authId = "test-user-1";

    const now = new Date();

    await repo().insert(user).values({
      authId,
      createdAt: now,
      updatedAt: now,
    });

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const updateUserBody: UpdateUserBody = {};

    const updateUserResponse = await agentRequest<UpdateUserResponse>(`/user`, {
      method: "PATCH",
      body: mockBody(updateUserBody),
    });

    const { meta, data } = updateUserResponse;

    const minPropertiesRequirement = {
      instancePath: "",
      schemaPath: "#/minProperties",
      keyword: "minProperties",
      message: "must NOT have fewer than 1 properties",
      params: {
        limit: 1,
      },
    };

    expect(meta.status).toBe(ResponseStatus.ERROR);
    expect(meta.code).toBe(400);
    expect(data).toBeUndefined();

    expect(updateUserResponse.meta).toMatchObject({
      data: [minPropertiesRequirement],
    });
  });

  it("should not allow user update with an invalid body prop", async () => {
    const authId = "test-user-1";

    const now = new Date();

    await repo().insert(user).values({
      authId,
      createdAt: now,
      updatedAt: now,
    });

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const updateUserBody: UpdateUserBody & { invalidProperty: string } = {
      invalidProperty: "Test",
    };

    const updateUserResponse = await agentRequest<UpdateUserResponse>(`/user`, {
      method: "PATCH",
      body: mockBody(updateUserBody),
    });

    const { meta, data } = updateUserResponse;

    const additionalPropertyRequirement = {
      instancePath: "",
      keyword: "additionalProperties",
      message: "must NOT have additional properties",
      schemaPath: "#/additionalProperties",
    };

    expect(meta.status).toBe(ResponseStatus.ERROR);
    expect(meta.code).toBe(400);
    expect(data).toBeUndefined();

    expect(updateUserResponse.meta).toMatchObject({
      data: [additionalPropertyRequirement],
    });
  });

  it("should return 403 if user verification is bypassed", async () => {
    const repo = entityManager.getTransaction();

    expect(repo).not.toBeNull();

    if (repo === null) {
      return;
    }

    const updateUserResponse = await UpdateUser({
      body: {},
      params: {},
      query: {},
      auth: null,
      repo,
    });

    const { isError, code, data } = updateUserResponse;

    expect(isError).toBe(true);
    expect(code).toBe(403);
    expect(data).toBe("Unauthorised");
  });
});
