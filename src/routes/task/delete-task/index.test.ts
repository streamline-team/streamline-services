import { ResponseStatus } from "config/types";
import { entityManager } from "data";
import { Tag, Task, TaskToTag, tag, task, taskToTag, user } from "data/schema";
import { and, eq } from "drizzle-orm";
import {
  agentRequest,
  authMock,
  getInsertId,
  it,
  repo,
  verifyJwtMock,
} from "test/utils";
import DeleteTask from ".";

describe("DELETE /:taskId", () => {
  it("should successfully delete a task by its id", async () => {
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

    const deleteTaskResponse = await agentRequest<string>(
      `/task/${getInsertId(newTask)}`,
      {
        method: "DELETE",
      }
    );

    const { meta } = deleteTaskResponse;

    expect(meta.code).toBe(200);
    expect(meta.status).toBe(ResponseStatus.SUCCCESS);

    const dbTaskRecords = await repo()
      .select({
        id: task.id,
      })
      .from(task);

    expect(dbTaskRecords).toHaveLength(0);
  });

  it("should delete a task and task to tag relations, whilst not deleting tags", async () => {
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

    const deleteTaskResponse = await agentRequest<string>(
      `/task/${getInsertId(newTask)}`,
      {
        method: "DELETE",
      }
    );

    const { meta } = deleteTaskResponse;

    expect(meta.code).toBe(200);
    expect(meta.status).toBe(ResponseStatus.SUCCCESS);

    const dbTaskRecords = await repo()
      .select({
        id: task.id,
      })
      .from(task)
      .where(eq(task.id, taskInsertId));

    expect(dbTaskRecords).toHaveLength(0);

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

    const dbTagRecords = await repo()
      .select({
        id: tag.id,
      })
      .from(tag)
      .where(eq(tag.id, tagInsertId));

    expect(dbTagRecords).toHaveLength(1);
  });

  it("should not allow a non-existent task to be deleted", async () => {
    const authId = "test-user-1";

    verifyJwtMock.mockImplementation(() => authMock(authId));
    const dbTaskRecords = await repo()
      .select({
        id: task.id,
      })
      .from(task);

    expect(dbTaskRecords).toHaveLength(0);

    const deleteTaskResponse = await agentRequest<string>(`/task/1000`, {
      method: "DELETE",
    });

    const { meta } = deleteTaskResponse;

    expect(meta.code).toBe(404);
    expect(meta.status).toBe(ResponseStatus.ERROR);
  });

  it("should not allow deletion for another user's task", async () => {
    const primaryUser = "test-user-1";
    const secondaryUser = "test-user-2";

    verifyJwtMock.mockImplementation(() => authMock(primaryUser));

    const secondaryUserEntity = await repo().insert(user).values({
      authId: secondaryUser,
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

    const deleteTaskResponse = await agentRequest<string>(
      `/task/${getInsertId(newTask)}`,
      {
        method: "DELETE",
      }
    );

    const { meta } = deleteTaskResponse;

    expect(meta.code).toBe(403);
    expect(meta.status).toBe(ResponseStatus.ERROR);

    const dbTaskRecords = await repo()
      .select({
        id: task.id,
      })
      .from(task)
      .where(eq(task.id, getInsertId(newTask)));

    expect(dbTaskRecords).toHaveLength(1);
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

    const deleteTaskResponse = await agentRequest<string>(
      `/task/${getInsertId(newTask)}`,
      {
        method: "DELETE",
      }
    );

    const { meta } = deleteTaskResponse;

    expect(meta.code).toBe(401);
    expect(meta.status).toBe(ResponseStatus.ERROR);

    const dbTaskRecords = await repo()
      .select({
        id: task.id,
      })
      .from(task)
      .where(eq(task.id, getInsertId(newTask)));

    expect(dbTaskRecords).toHaveLength(1);
  });

  it("should return 403 if user verification is bypassed", async () => {
    const repo = entityManager.getTransaction();

    expect(repo).not.toBeNull();

    if (repo === null) {
      return;
    }

    const deleteTaskResponse = await DeleteTask({
      body: {},
      params: {
        taskId: "1",
      },
      query: {},
      auth: null,
      repo,
    });

    const { isError, code, data } = deleteTaskResponse;

    expect(isError).toBe(true);
    expect(code).toBe(403);
    expect(data).toBe("Unauthorised");
  });
});
