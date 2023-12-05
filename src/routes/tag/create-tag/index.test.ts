import { Tag, tag, user } from "data/schema";
import {
  it,
  mockBody,
  verifyJwtMock,
  authMock,
  repo,
  getInsertId,
  agentRequest,
} from "test/utils";
import { CreateTagResponse } from "./types";
import { ResponseStatus } from "config/types";
import { ListTagsResponse } from "../list-tags/types";

describe("POST /tag", () => {
  it("should create a tag", async () => {
    verifyJwtMock.mockImplementation(() => authMock("test-user-1"));

    const existingTags = await repo()
      .select({
        id: tag.id,
      })
      .from(tag);

    expect(existingTags).toHaveLength(0);

    const tagBody: Partial<Tag> = {
      name: "Test Tag",
      background: "#FFFFFF",
    };

    const createTagResponse = await agentRequest<CreateTagResponse>("/tag", {
      method: "POST",
      body: mockBody(tagBody),
    });

    const { meta, data } = createTagResponse;

    const { name, background } = data || {};

    const responseBody: Partial<Tag> = {
      name,
      background,
    };

    expect(data).toBeDefined();
    expect(meta.code).toBe(200);
    expect(meta.status).toBe(ResponseStatus.SUCCCESS);
    expect(responseBody).toStrictEqual(tagBody);

    const updatedTags = await repo()
      .select({
        id: tag.id,
      })
      .from(tag);

    expect(updatedTags).toHaveLength(1);
  });

  it("should not create a tag if unauthorised", async () => {
    verifyJwtMock.mockImplementation(async () => ({
      isError: true,
      code: 403,
      data: null,
    }));

    const tagBody: Partial<Tag> = {
      name: "Test Tag",
      background: "#FFFFFF",
    };

    const createTagResponse = await agentRequest<CreateTagResponse>("/tag", {
      method: "POST",
      body: mockBody(tagBody),
    });

    const { meta } = createTagResponse;

    expect(meta.status).toBe(ResponseStatus.ERROR);
    expect(meta.code).toBe(401);
  });

  it("should only return tags for the authenticated user", async () => {
    const primaryUserId = "test-user-1";
    const secondaryUserId = "test-user-2";

    verifyJwtMock.mockImplementation(() => authMock(primaryUserId));

    const primaryUserEntity = await repo().insert(user).values({
      authId: primaryUserId,
    });

    const secondaryUserEntity = await repo().insert(user).values({
      authId: secondaryUserId,
    });

    const now = new Date();

    const primaryUserTagBody: Tag = {
      id: 1,
      name: "Test Tag - User 1",
      background: "#FFFFFF",
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(primaryUserEntity),
    };

    const secondaryUserTagBody: Tag = {
      id: 2,
      name: "Test Tag - User 2",
      background: "#FFFFFF",
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(secondaryUserEntity),
    };

    await repo().insert(tag).values(primaryUserTagBody);

    await repo().insert(tag).values(secondaryUserTagBody);

    const allTags = await agentRequest<ListTagsResponse>("/tag");

    const { meta, data } = allTags;

    expect(meta.code).toBe(200);
    expect(data).toHaveLength(1);

    if (!data) {
      return;
    }

    expect(data[0].name).toBe(primaryUserTagBody.name);
  });

  it("should not allow the same tag to be added twice", async () => {
    verifyJwtMock.mockImplementation(() => authMock("test-user-1"));

    const tagBody: Partial<Tag> = {
      name: "Test Tag",
      background: "#FFFFFF",
    };

    const firstCreateTagResponse = await agentRequest<CreateTagResponse>(
      "/tag",
      {
        method: "POST",
        body: mockBody(tagBody),
      }
    );

    const secondCreateTagResponse = await agentRequest<CreateTagResponse>(
      "/tag",
      {
        method: "POST",
        body: mockBody(tagBody),
      }
    );

    expect(firstCreateTagResponse.meta.code).toBe(200);
    expect(secondCreateTagResponse.meta.code).toBe(400);
    expect(secondCreateTagResponse.meta.status).toBe(ResponseStatus.ERROR);
  });

  it("should not allow creating a tag with an invalid hex colour", async () => {
    verifyJwtMock.mockImplementation(() => authMock("test-user-1"));

    const tagBody: Partial<Tag> = {
      name: "Test Tag",
      background: "FFFFFF",
    };

    const invalidTagResponse = await agentRequest<CreateTagResponse>("/tag", {
      method: "POST",
      body: mockBody(tagBody),
    });

    expect(invalidTagResponse.meta.code).toBe(400);
    expect(invalidTagResponse.meta.status).toBe(ResponseStatus.ERROR);
  });

  it("should not allow a tag to be created without required fields", async () => {
    verifyJwtMock.mockImplementation(() => authMock("test-user-1"));

    const tagBody: Partial<Tag> = {
      background: "FFFFFF",
    };

    const invalidTagResponse = await agentRequest<CreateTagResponse>("/tag", {
      method: "POST",
      body: mockBody(tagBody),
    });

    expect(invalidTagResponse.meta.code).toBe(400);
    expect(invalidTagResponse.meta.status).toBe(ResponseStatus.ERROR);

    if (invalidTagResponse.meta.status !== "error") {
      return;
    }

    const missingNameRequirement = {
      instancePath: "",
      schemaPath: "#/required",
      keyword: "required",
      params: { missingProperty: "name" },
      message: "must have required property 'name'",
    };

    expect(invalidTagResponse.meta.data).toContainEqual(missingNameRequirement);
  });
});
