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

describe("GET /tag/:tagId", () => {
  it("should return a tag by its id", async () => {
    const authId = "test-user-1";

    const userEntity = await repo().insert(user).values({
      authId,
    });

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const now = new Date();

    const tagBody: Omit<Tag, "id"> = {
      name: "Test Tag - ID 1",
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

    console.log(existingTagResponse);

    expect(meta.code).toBe(404);
    expect(meta.status).toBe(ResponseStatus.ERROR);
  });

  it("should not return another user's tag", async () => {});

  it("should not accept a non-numeric id", async () => {});

  it("should return 401 if jwt can't be verified", async () => {});
});
