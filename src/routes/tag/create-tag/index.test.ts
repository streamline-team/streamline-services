import { Tag, tag } from "data/schema";
import {
  it,
  mockBody,
  verifyJwtMock,
  authMock,
  repo,
  agentRequest,
} from "test/utils";
import { CreateTagResponse } from "./types";
import { ResponseStatus } from "config/types";

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

    const dbTagRecords = await repo()
      .select({
        id: tag.id,
      })
      .from(tag);

    expect(dbTagRecords).toHaveLength(1);
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

    const dbTagRecords = await repo()
      .select({
        id: tag.id,
      })
      .from(tag);

    expect(dbTagRecords).toHaveLength(0);
  });

  it("should not allow the same tag to be added twice for the same user", async () => {
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

    const dbTagRecords = await repo()
      .select({
        id: tag.id,
      })
      .from(tag);

    expect(dbTagRecords).toHaveLength(1);
  });

  it("should allow the same tag to be created for different users", async () => {
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

    expect(firstCreateTagResponse.meta.code).toBe(200);
    expect(firstCreateTagResponse.meta.status).toBe(ResponseStatus.SUCCCESS);

    verifyJwtMock.mockImplementation(() => authMock("test-user-2"));

    const secondCreateTagResponse = await agentRequest<CreateTagResponse>(
      "/tag",
      {
        method: "POST",
        body: mockBody(tagBody),
      }
    );
    expect(secondCreateTagResponse.meta.code).toBe(200);
    expect(secondCreateTagResponse.meta.status).toBe(ResponseStatus.SUCCCESS);

    const dbTagRecords = await repo()
      .select({
        id: tag.id,
      })
      .from(tag);

    expect(dbTagRecords).toHaveLength(2);
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

    const dbTagRecords = await repo()
      .select({
        id: tag.id,
      })
      .from(tag);

    expect(dbTagRecords).toHaveLength(0);
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

    const dbTagRecords = await repo()
      .select({
        id: tag.id,
      })
      .from(tag);

    expect(dbTagRecords).toHaveLength(0);
  });
});
