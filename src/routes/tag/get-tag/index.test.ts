import { Tag, tag, user } from "data/schema";
import {
  repo,
  getInsertId,
  it,
  agentRequest,
  verifyJwtMock,
  authMock,
} from "test/utils";
import { GetTagResponse } from "./types";
import { ResponseStatus } from "config/types";
import { entityManager } from "data";
import GetTag from ".";

describe("GET /tag/:tagId", () => {
  it("should return a tag by its id", async () => {
    const authId = "test-user-1";

    const userEntity = await repo().insert(user).values({
      authId,
    });

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const now = new Date();

    const tagBody: Omit<Tag, "id"> = {
      name: "Test Tag",
      background: "#FFFFFF",
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    const newTag = await repo().insert(tag).values(tagBody);

    const existingTagResponse = await agentRequest<GetTagResponse>(
      `/tag/${getInsertId(newTag)}`
    );

    const { meta, data } = existingTagResponse;

    expect(meta.code).toBe(200);
    expect(meta.status).toBe(ResponseStatus.SUCCCESS);

    expect(data).toMatchObject({
      id: getInsertId(newTag),
      name: tagBody.name,
      background: tagBody.background,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });

  it("should return 404 when task is not found", async () => {
    verifyJwtMock.mockImplementation(() => authMock("test-user-1"));

    const existingTagResponse = await agentRequest<GetTagResponse>("/tag/1000");

    const { meta } = existingTagResponse;

    expect(meta.code).toBe(404);
    expect(meta.status).toBe(ResponseStatus.ERROR);
  });

  it("should not return another user's tag", async () => {
    const primaryUser = "test-user-1";
    const secondaryUser = "test-user-2";

    const secondaryUserEntity = await repo().insert(user).values({
      authId: secondaryUser,
    });

    verifyJwtMock.mockImplementation(() => authMock(primaryUser));

    const now = new Date();

    const tagBody: Omit<Tag, "id"> = {
      name: "Test Tag",
      background: "#FFFFFF",
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(secondaryUserEntity),
    };

    const newTag = await repo().insert(tag).values(tagBody);

    const existingTagResponse = await agentRequest<GetTagResponse>(
      `/tag/${getInsertId(newTag)}`
    );

    const { meta } = existingTagResponse;

    expect(meta.code).toBe(403);
    expect(meta.status).toBe(ResponseStatus.ERROR);
  });

  it("should not accept a non-numeric tag ID", async () => {
    verifyJwtMock.mockImplementation(() => authMock("test-user-1"));

    const existingTagResponse = await agentRequest<GetTagResponse>("/tag/test");

    const { meta } = existingTagResponse;

    const invalidPatternRequirement = {
      instancePath: "/tagId",
      schemaPath: "#/properties/tagId/pattern",
      keyword: "pattern",
      params: { pattern: "^[0-9]+$" },
      message: 'must match pattern "^[0-9]+$"',
    };

    expect(meta.code).toBe(400);
    expect(meta.status).toBe(ResponseStatus.ERROR);

    if (existingTagResponse.meta.status !== "error") {
      return;
    }

    expect(existingTagResponse.meta.data).toContainEqual(
      invalidPatternRequirement
    );
  });

  it("should return 401 if jwt can't be verified", async () => {
    verifyJwtMock.mockImplementation(async () => ({
      isError: true,
      code: 403,
      data: null,
    }));

    const authId = "test-user-1";

    const userEntity = await repo().insert(user).values({
      authId,
    });

    const now = new Date();

    const tagBody: Omit<Tag, "id"> = {
      name: "Test Tag",
      background: "#FFFFFF",
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    const newTag = await repo().insert(tag).values(tagBody);

    const existingTagResponse = await agentRequest<GetTagResponse>(
      `/tag/${getInsertId(newTag)}`
    );

    expect(existingTagResponse.meta.code).toBe(401);
    expect(existingTagResponse.meta.status).toBe(ResponseStatus.ERROR);
  });

  it("should return 403 if user verification is bypassed", async () => {
    const repo = entityManager.getTransaction();

    expect(repo).not.toBeNull();

    if (repo === null) {
      return;
    }

    const getTaskResponse = await GetTag({
      body: {},
      params: {
        tagId: "1",
      },
      query: {},
      auth: null,
      repo,
    });

    const { isError, code, data } = getTaskResponse;

    expect(isError).toBe(true);
    expect(code).toBe(403);
    expect(data).toBe("Unauthorised");
  });
});
