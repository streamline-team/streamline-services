import { ResponseStatus } from "config/types";
import { user, tag, Tag, Task, task, taskToTag } from "data/schema";
import {
  agentRequest,
  authMock,
  getInsertId,
  it,
  repo,
  verifyJwtMock,
} from "test/utils";

describe("DELETE /tag/:tagId", () => {
  it("should successfully delete a tag by its id", async () => {
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

    const deleteTagResponse = await agentRequest<string>(
      `/tag/${getInsertId(newTag)}`,
      {
        method: "DELETE",
      }
    );

    const { meta } = deleteTagResponse;

    expect(meta.code).toBe(200);

    const dbTagRecords = await repo()
      .select({
        id: tag.id,
      })
      .from(tag);

    expect(dbTagRecords).toHaveLength(0);
  });

  it("should delete a tag even if existing tasks use it", async () => {
    const authId = "test-user-1";

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const userEntity = await repo().insert(user).values({
      authId,
    });

    const now = new Date();

    const taskBody: Omit<Task, "id"> = {
      title: "Test Task",
      description: "Test description",
      dueAt: null,
      priority: 1,
      done: false,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    const newTask = await repo().insert(task).values(taskBody);

    const tagBody: Omit<Tag, "id"> = {
      name: "Test Tag",
      background: "#FFFFFF",
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    const newTag = await repo().insert(tag).values(tagBody);

    await repo()
      .insert(taskToTag)
      .values({
        taskId: getInsertId(newTask),
        tagId: getInsertId(newTag),
      });

    const deleteTagResponse = await agentRequest<string>(
      `/tag/${getInsertId(newTag)}`,
      {
        method: "DELETE",
      }
    );

    const { meta } = deleteTagResponse;

    expect(meta.code).toBe(200);
    expect(meta.status).toBe(ResponseStatus.SUCCCESS);

    const dbTagRecords = await repo()
      .select({
        id: tag.id,
      })
      .from(tag);

    expect(dbTagRecords).toHaveLength(0);
  });

  it("should not allow a non-existent tag to be deleted", async () => {
    verifyJwtMock.mockImplementation(() => authMock("test-user-1"));

    const deleteTagResponse = await agentRequest<string>(`/tag/1000`, {
      method: "DELETE",
    });

    const { meta } = deleteTagResponse;

    expect(meta.code).toBe(404);
    expect(meta.status).toBe(ResponseStatus.ERROR);
  });

  it("should not allow deletion for another user's tag", async () => {
    const primaryUser = "test-user-1";
    const secondaryUser = "test-user-2";

    verifyJwtMock.mockImplementation(() => authMock(primaryUser));

    const userEntity = await repo().insert(user).values({
      authId: secondaryUser,
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

    const deleteTagResponse = await agentRequest<string>(
      `/tag/${getInsertId(newTag)}`,
      {
        method: "DELETE",
      }
    );

    const { meta } = deleteTagResponse;

    expect(meta.code).toBe(403);
    expect(meta.status).toBe(ResponseStatus.ERROR);

    const dbTagRecords = await repo()
      .select({
        id: tag.id,
      })
      .from(tag);

    expect(dbTagRecords).toHaveLength(1);
  });

  it("should not allow deletion for an unauthenticated user", async () => {
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

    const deleteTagResponse = await agentRequest<string>(
      `/tag/${getInsertId(newTag)}`,
      {
        method: "DELETE",
      }
    );

    const { meta } = deleteTagResponse;

    expect(meta.code).toBe(401);
    expect(meta.status).toBe(ResponseStatus.ERROR);

    const dbTagRecords = await repo()
      .select({
        id: tag.id,
      })
      .from(tag);

    expect(dbTagRecords).toHaveLength(1);
  });
});
