import { ResponseStatus } from "config/types";
import { Tag, tag, user } from "data/schema";
import {
  agentRequest,
  authMock,
  getInsertId,
  it,
  mockBody,
  repo,
  verifyJwtMock,
} from "test/utils";
import { UpdateTagBody, UpdateTagResponse } from "./types";

describe("PATCH /tag/:tagId", () => {
  it("should successfully return the updated tag by id", async () => {
    const authId = "test-user-1";

    verifyJwtMock.mockImplementation(() => authMock("test-user-1"));

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

    const updateTagBody: UpdateTagBody = {
      name: "Updated Tag",
      background: "#FFFFFA",
    };

    const updateTagResponse = await agentRequest<UpdateTagResponse>(
      `/tag/${getInsertId(newTag)}`,
      {
        method: "PATCH",
        body: mockBody(updateTagBody),
      }
    );

    const { meta, data } = updateTagResponse;

    expect(meta.code).toBe(200);
    expect(meta.status).toBe(ResponseStatus.SUCCCESS);

    expect(data).toMatchObject(updateTagBody);
  });

  it("should not allow updating a non-existent tag", async () => {
    verifyJwtMock.mockImplementation(() => authMock("test-user-1"));

    const updateTagBody: UpdateTagBody = {
      name: "Updated Tag",
      background: "#FFFFFA",
    };

    const updateTagResponse = await agentRequest<UpdateTagResponse>(`/tag/1`, {
      method: "PATCH",
      body: mockBody(updateTagBody),
    });

    const { meta } = updateTagResponse;

    expect(meta.code).toBe(404);
    expect(meta.status).toBe(ResponseStatus.ERROR);
  });

  it("should not allow updating another user's tag", async () => {
    const primaryUser = "test-user-1";
    const secondaryUser = "test-user-2";

    verifyJwtMock.mockImplementation(() => authMock(primaryUser));

    const secondaryUserEntity = await repo().insert(user).values({
      authId: secondaryUser,
    });

    const now = new Date();

    const tagBody: Omit<Tag, "id"> = {
      name: "Test Tag",
      background: "#FFFFFF",
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(secondaryUserEntity),
    };

    const newTag = await repo().insert(tag).values(tagBody);

    const updateTagBody: UpdateTagBody = {
      name: "Updated Tag",
      background: "#FFFFFA",
    };

    const updateTagResponse = await agentRequest<UpdateTagResponse>(
      `/tag/${getInsertId(newTag)}`,
      {
        method: "PATCH",
        body: mockBody(updateTagBody),
      }
    );

    const { meta } = updateTagResponse;

    expect(meta.code).toBe(403);
    expect(meta.status).toBe(ResponseStatus.ERROR);
  });

  it("should not allow updating a tag if not authenticated", async () => {
    verifyJwtMock.mockImplementation(async () => ({
      isError: true,
      code: 403,
      data: null,
    }));

    const userEntity = await repo().insert(user).values({
      authId: "test-user-1",
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

    const updateTagBody: UpdateTagBody = {
      name: "Updated Tag",
      background: "#FFFFFA",
    };

    const updateTagResponse = await agentRequest<UpdateTagResponse>(
      `/tag/${getInsertId(newTag)}`,
      {
        method: "PATCH",
        body: mockBody(updateTagBody),
      }
    );

    const { meta } = updateTagResponse;

    expect(meta.code).toBe(401);
    expect(meta.status).toBe(ResponseStatus.ERROR);
  });

  it("should require at least one body field for a tag update", async () => {
    const authId = "test-user-1";

    verifyJwtMock.mockImplementation(() => authMock(authId));

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

    const updateTagBody: UpdateTagBody = {};

    const updateTagResponse = await agentRequest<UpdateTagResponse>(
      `/tag/${getInsertId(newTag)}`,
      {
        method: "PATCH",
        body: mockBody(updateTagBody),
      }
    );

    const minPropertiesRequirement = {
      instancePath: "",
      schemaPath: "#/minProperties",
      keyword: "minProperties",
      message: "must NOT have fewer than 1 properties",
      params: {
        limit: 1,
      },
    };

    const { meta } = updateTagResponse;

    expect(meta.code).toBe(400);
    expect(meta.status).toBe(ResponseStatus.ERROR);

    if (meta.status !== ResponseStatus.ERROR) {
      return;
    }

    expect(meta.data).toContainEqual(minPropertiesRequirement);
  });

  it("should not allow updating a tag with an invalid hex colour", async () => {
    verifyJwtMock.mockImplementation(() => authMock("test-user-1"));

    const tagBody: Partial<Tag> = {
      name: "Test Tag",
      background: "FFFFFF",
    };

    const invalidTagResponse = await agentRequest<UpdateTagResponse>("/tag", {
      method: "POST",
      body: mockBody(tagBody),
    });

    expect(invalidTagResponse.meta.code).toBe(400);
    expect(invalidTagResponse.meta.status).toBe(ResponseStatus.ERROR);
  });
});
