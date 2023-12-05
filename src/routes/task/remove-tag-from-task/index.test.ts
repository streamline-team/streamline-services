import { ResponseStatus } from "config/types";
import { entityManager } from "data";
import { user, Task, task, Tag, tag, taskToTag, TaskToTag } from "data/schema";
import { and, eq } from "drizzle-orm";
import {
  agentRequest,
  authMock,
  getInsertId,
  it,
  repo,
  verifyJwtMock,
} from "test/utils";
import RemoveTagFromTask from ".";

describe("DELETE /:taskId/tag/:tagId", () => {
  it("should successfully remove an existing tag from a task", async () => {
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

    const tagInsertId = getInsertId(newTag);
    const taskInsertId = getInsertId(newTask);

    const taskToTagBody: TaskToTag = {
      tagId: tagInsertId,
      taskId: taskInsertId,
    };

    await repo().insert(taskToTag).values(taskToTagBody);

    const removeTagFromTaskResponse = await agentRequest<string>(
      `/task/${taskInsertId}/tag/${tagInsertId}`,
      {
        method: "DELETE",
      }
    );

    const { meta, data } = removeTagFromTaskResponse;

    expect(meta.code).toBe(200);
    expect(meta.status).toBe(ResponseStatus.SUCCCESS);

    expect(data).toMatchObject({
      id: taskInsertId,
      tags: [],
    });

    const dbTaskToTagRecords = await repo()
      .select({
        taskId: taskToTag.taskId,
        tagId: taskToTag.tagId,
      })
      .from(taskToTag)
      .where(
        and(
          eq(taskToTag.taskId, taskInsertId),
          eq(taskToTag.tagId, tagInsertId)
        )
      );

    expect(dbTaskToTagRecords).toHaveLength(0);
  });

  it("should not allow a user to remove another user's tag from their own task", async () => {
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

    const taskBody: Omit<Task, "id"> = {
      title: "Test Task",
      description: "Test description",
      dueAt: null,
      priority: 1,
      done: false,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(primaryUserEntity),
    };

    const newTask = await repo().insert(task).values(taskBody);

    const tagBody: Omit<Tag, "id"> = {
      name: "Test Tag",
      background: "#FFFFFF",
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(secondaryUserEntity),
    };

    const newTag = await repo().insert(tag).values(tagBody);

    const tagInsertId = getInsertId(newTag);
    const taskInsertId = getInsertId(newTask);

    const taskToTagBody: TaskToTag = {
      tagId: tagInsertId,
      taskId: taskInsertId,
    };

    await repo().insert(taskToTag).values(taskToTagBody);

    const removeTagFromTaskResponse = await agentRequest<string>(
      `/task/${taskInsertId}/tag/${tagInsertId}`,
      {
        method: "DELETE",
      }
    );

    const { meta, data } = removeTagFromTaskResponse;

    expect(meta.code).toBe(403);
    expect(meta.status).toBe(ResponseStatus.ERROR);

    expect(data).toBeUndefined();

    const dbTaskToTagRecords = await repo()
      .select({
        taskId: taskToTag.taskId,
        tagId: taskToTag.tagId,
      })
      .from(taskToTag)
      .where(
        and(
          eq(taskToTag.taskId, taskInsertId),
          eq(taskToTag.tagId, tagInsertId)
        )
      );

    expect(dbTaskToTagRecords).toHaveLength(1);
  });

  it("should not allow a user to remove their own tag from another user's task", async () => {
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

    const taskBody: Omit<Task, "id"> = {
      title: "Test Task",
      description: "Test description",
      dueAt: null,
      priority: 1,
      done: false,
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(secondaryUserEntity),
    };

    const newTask = await repo().insert(task).values(taskBody);

    const tagBody: Omit<Tag, "id"> = {
      name: "Test Tag",
      background: "#FFFFFF",
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(primaryUserEntity),
    };

    const newTag = await repo().insert(tag).values(tagBody);

    const tagInsertId = getInsertId(newTag);
    const taskInsertId = getInsertId(newTask);

    const taskToTagBody: TaskToTag = {
      tagId: tagInsertId,
      taskId: taskInsertId,
    };

    await repo().insert(taskToTag).values(taskToTagBody);

    const removeTagFromTaskResponse = await agentRequest<string>(
      `/task/${taskInsertId}/tag/${tagInsertId}`,
      {
        method: "DELETE",
      }
    );

    const { meta, data } = removeTagFromTaskResponse;

    expect(meta.code).toBe(403);
    expect(meta.status).toBe(ResponseStatus.ERROR);

    expect(data).toBeUndefined();

    const dbTaskToTagRecords = await repo()
      .select({
        taskId: taskToTag.taskId,
        tagId: taskToTag.tagId,
      })
      .from(taskToTag)
      .where(
        and(
          eq(taskToTag.taskId, taskInsertId),
          eq(taskToTag.tagId, tagInsertId)
        )
      );

    expect(dbTaskToTagRecords).toHaveLength(1);
  });

  it("should not allow a user to remove a non-existent tag from a task", async () => {
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

    const taskInsertId = getInsertId(newTask);

    const removeTagFromTaskResponse = await agentRequest<string>(
      `/task/${taskInsertId}/tag/1000`,
      {
        method: "DELETE",
      }
    );

    const { meta, data } = removeTagFromTaskResponse;

    expect(meta.code).toBe(404);
    expect(meta.status).toBe(ResponseStatus.ERROR);

    expect(data).toBeUndefined();
  });

  it("should not allow a user to remove a tag from a non-existent task", async () => {
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

    const tagInsertId = getInsertId(newTag);

    const removeTagFromTaskResponse = await agentRequest<string>(
      `/task/1000/tag/${tagInsertId}`,
      {
        method: "DELETE",
      }
    );

    const { meta, data } = removeTagFromTaskResponse;

    expect(meta.code).toBe(404);
    expect(meta.status).toBe(ResponseStatus.ERROR);

    expect(data).toBeUndefined();
  });

  it("should not accept a non-numeric task ID", async () => {
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

    const tagInsertId = getInsertId(newTag);

    const removeTagFromTaskResponse = await agentRequest<string>(
      `/task/test/tag/${tagInsertId}`,
      {
        method: "DELETE",
      }
    );

    const invalidPatternRequirement = {
      instancePath: "/taskId",
      schemaPath: "#/properties/taskId/pattern",
      keyword: "pattern",
      params: { pattern: "^[0-9]+$" },
      message: 'must match pattern "^[0-9]+$"',
    };

    const { meta } = removeTagFromTaskResponse;

    expect(meta.code).toBe(400);
    expect(meta.status).toBe(ResponseStatus.ERROR);

    if (removeTagFromTaskResponse.meta.status !== "error") {
      return;
    }

    expect(removeTagFromTaskResponse.meta.data).toContainEqual(
      invalidPatternRequirement
    );
  });

  it("should not accept a non-numeric tag ID", async () => {
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

    const taskInsertId = getInsertId(newTask);

    const removeTagFromTaskResponse = await agentRequest<string>(
      `/task/${taskInsertId}/tag/test`,
      {
        method: "DELETE",
      }
    );

    const invalidPatternRequirement = {
      instancePath: "/tagId",
      schemaPath: "#/properties/tagId/pattern",
      keyword: "pattern",
      params: { pattern: "^[0-9]+$" },
      message: 'must match pattern "^[0-9]+$"',
    };

    const { meta } = removeTagFromTaskResponse;

    expect(meta.code).toBe(400);
    expect(meta.status).toBe(ResponseStatus.ERROR);

    if (removeTagFromTaskResponse.meta.status !== "error") {
      return;
    }

    expect(removeTagFromTaskResponse.meta.data).toContainEqual(
      invalidPatternRequirement
    );
  });

  it("should not allow an unauthenticated user to remove a tag", async () => {
    verifyJwtMock.mockImplementation(async () => ({
      isError: true,
      code: 403,
      data: null,
    }));

    const userEntity = await repo().insert(user).values({
      authId: "test-user-1",
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

    const tagInsertId = getInsertId(newTag);
    const taskInsertId = getInsertId(newTask);

    const removeTagFromTaskResponse = await agentRequest<string>(
      `/task/${taskInsertId}/tag/${tagInsertId}`,
      {
        method: "DELETE",
      }
    );

    const { meta } = removeTagFromTaskResponse;

    expect(meta.code).toBe(401);
    expect(meta.status).toBe(ResponseStatus.ERROR);
  });

  it("should return 403 if user verification is bypassed", async () => {
    const repo = entityManager.getTransaction();

    expect(repo).not.toBeNull();

    if (repo === null) {
      return;
    }

    const removeTagFromTaskResponse = await RemoveTagFromTask({
      body: {},
      params: {
        tagId: "1",
        taskId: "1",
      },
      query: {},
      auth: null,
      repo,
    });

    const { isError, code, data } = removeTagFromTaskResponse;

    expect(isError).toBe(true);
    expect(code).toBe(403);
    expect(data).toBe("Unauthorised");
  });
});
