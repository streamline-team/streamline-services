import { Tag, tag, user } from "data/schema";
import {
  repo,
  agentRequest,
  authMock,
  getInsertId,
  verifyJwtMock,
  it,
} from "test/utils";
import { ListTagsResponse } from "./types";
import { ResponseStatus } from "config/types";

describe("GET /tag", () => {
  it("should list all tags", async () => {
    const authId = "test-user-1";

    const userEntity = await repo().insert(user).values({
      authId,
    });

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const now = new Date();

    const tagBody: Tag = {
      id: 1,
      name: "Test Tag",
      background: "#FFFFFF",
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    await repo().insert(tag).values(tagBody);

    const allTags = await agentRequest<ListTagsResponse>("/tag");

    const { meta, data } = allTags;

    expect(meta.code).toBe(200);
    expect(data).toHaveLength(1);

    const matchingTag = data ? data[0] : {};

    expect(matchingTag).toMatchObject({
      id: tagBody.id,
      name: tagBody.name,
      background: tagBody.background,
      createdAt: tagBody.createdAt.toISOString(),
      updatedAt: tagBody.updatedAt.toISOString(),
    });
  });

  it("should not list tags if unauthorised", async () => {
    verifyJwtMock.mockImplementation(async () => ({
      isError: true,
      code: 403,
      data: null,
    }));

    const allTagsResponse = await agentRequest<ListTagsResponse>("/tag");

    expect(allTagsResponse.meta.status).toBe(ResponseStatus.ERROR);
    expect(allTagsResponse.meta.code).toBe(401);
    expect(allTagsResponse.data).toBeUndefined();
  });
});