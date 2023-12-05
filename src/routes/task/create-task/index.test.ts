import {
  agentRequest,
  authMock,
  getInsertId,
  it,
  mockBody,
  repo,
  verifyJwtMock,
} from "test/utils";
import { CreateTaskBody, CreateTaskResponse } from "./types";
import { ResponseStatus } from "config/types";
import { Tag, tag, task, taskToTag, user } from "data/schema";
import { and, eq } from "drizzle-orm";
import { entityManager } from "data";
import CreateTask from ".";

describe("POST /task", () => {
  it("should successfully create a task", async () => {
    const authId = "test-user-1";

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const now = new Date();
    const isoDate = now.toISOString();

    const taskBody: CreateTaskBody = {
      title: "Test Task",
      description: "Test description",
      dueAt: isoDate,
      priority: 4,
    };

    const createTaskResponse = await agentRequest<CreateTaskResponse>(`/task`, {
      method: "POST",
      body: mockBody(taskBody),
    });

    const { meta, data } = createTaskResponse;

    expect(meta.status).toBe(ResponseStatus.SUCCCESS);
    expect(meta.code).toBe(200);

    expect(data).toBeDefined();

    expect(data).toMatchObject({
      title: taskBody.title,
      description: taskBody.description,
      dueAt: taskBody.dueAt,
      priority: taskBody.priority,
    });

    if (!data) {
      return;
    }

    const dbTaskRecords = await repo()
      .select({
        id: task.id,
      })
      .from(task)
      .where(eq(task.id, data.id));

    expect(dbTaskRecords).toHaveLength(1);
  });

  it("should successfully create a task with tags", async () => {
    const authId = "test-user-1";

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const userEntity = await repo().insert(user).values({
      authId,
    });

    const now = new Date();
    const isoDate = now.toISOString();

    const tagBody: Omit<Tag, "id"> = {
      name: "Test Tag",
      background: "#FFFFFF",
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(userEntity),
    };

    const newTag = await repo().insert(tag).values(tagBody);

    const tagInsertId = getInsertId(newTag);

    const taskBody: CreateTaskBody = {
      title: "Test Task",
      description: "Test description",
      dueAt: isoDate,
      priority: 4,
      tags: [tagInsertId],
    };

    const createTaskResponse = await agentRequest<CreateTaskResponse>(`/task`, {
      method: "POST",
      body: mockBody(taskBody),
    });

    const { meta, data } = createTaskResponse;

    expect(meta.status).toBe(ResponseStatus.SUCCCESS);
    expect(meta.code).toBe(200);

    expect(data).toBeDefined();

    expect(data).toMatchObject({
      title: taskBody.title,
      description: taskBody.description,
      dueAt: taskBody.dueAt,
      priority: taskBody.priority,
      tags: [
        {
          name: tagBody.name,
          background: tagBody.background,
          createdAt: isoDate,
        },
      ],
    });

    if (!data) {
      return;
    }

    const dbTaskRecords = await repo()
      .select({
        id: task.id,
      })
      .from(task)
      .where(eq(task.id, data.id));

    expect(dbTaskRecords).toHaveLength(1);

    const dbTaskToTagRecords = await repo()
      .select({
        taskId: taskToTag.taskId,
        tagId: taskToTag.tagId,
      })
      .from(taskToTag)
      .where(
        and(eq(taskToTag.taskId, data.id), eq(taskToTag.tagId, tagInsertId))
      );

    expect(dbTaskToTagRecords).toHaveLength(1);
  });

  it("should not allow a task to be created with a non-existent tag", async () => {
    const authId = "test-user-1";

    verifyJwtMock.mockImplementation(() => authMock(authId));

    const now = new Date();
    const isoDate = now.toISOString();

    const taskBody: CreateTaskBody = {
      title: "Test Task",
      description: "Test description",
      dueAt: isoDate,
      priority: 4,
      tags: [1000],
    };

    const createTaskResponse = await agentRequest<CreateTaskResponse>(`/task`, {
      method: "POST",
      body: mockBody(taskBody),
    });

    const { meta, data } = createTaskResponse;

    expect(meta.status).toBe(ResponseStatus.ERROR);
    expect(meta.code).toBe(404);

    expect(data).toBeUndefined();

    if (!data) {
      return;
    }

    const dbTaskRecords = await repo()
      .select({
        id: task.id,
      })
      .from(task)
      .where(eq(task.id, data.id));

    expect(dbTaskRecords).toHaveLength(0);
  });

  it("should not allow a task to be created with another user's tag", async () => {
    const primaryUser = "test-user-1";
    const secondaryUser = "test-user-2";

    verifyJwtMock.mockImplementation(() => authMock(primaryUser));

    const secondaryUserEntity = await repo().insert(user).values({
      authId: secondaryUser,
    });

    const now = new Date();
    const isoDate = now.toISOString();

    const tagBody: Omit<Tag, "id"> = {
      name: "Test Tag",
      background: "#FFFFFF",
      createdAt: now,
      updatedAt: now,
      userId: getInsertId(secondaryUserEntity),
    };

    const newTag = await repo().insert(tag).values(tagBody);

    const tagInsertId = getInsertId(newTag);

    const taskBody: CreateTaskBody = {
      title: "Test Task",
      description: "Test description",
      dueAt: isoDate,
      priority: 4,
      tags: [tagInsertId],
    };

    const createTaskResponse = await agentRequest<CreateTaskResponse>(`/task`, {
      method: "POST",
      body: mockBody(taskBody),
    });

    const { meta, data } = createTaskResponse;

    expect(meta.status).toBe(ResponseStatus.ERROR);
    expect(meta.code).toBe(403);

    expect(data).toBeUndefined();
  });

  it("should not create a task if unauthorised", async () => {
    verifyJwtMock.mockImplementation(async () => ({
      isError: true,
      code: 403,
      data: null,
    }));

    const now = new Date();
    const isoDate = now.toISOString();

    const taskBody: CreateTaskBody = {
      title: "Test Task",
      description: "Test description",
      dueAt: isoDate,
      priority: 4,
    };

    const createTaskResponse = await agentRequest<CreateTaskResponse>(`/task`, {
      method: "POST",
      body: mockBody(taskBody),
    });

    const { meta, data } = createTaskResponse;

    expect(meta.status).toBe(ResponseStatus.ERROR);
    expect(meta.code).toBe(401);

    expect(data).toBeUndefined();
  });

  it("should not allow creating a task without a title", async () => {
    verifyJwtMock.mockImplementation(() => authMock("test-user-1"));

    const now = new Date();
    const isoDate = now.toISOString();

    const taskBody: Partial<CreateTaskBody> = {
      description: "Test description",
      dueAt: isoDate,
      priority: 4,
    };

    const createTaskResponse = await agentRequest<CreateTaskResponse>(`/task`, {
      method: "POST",
      body: mockBody(taskBody),
    });

    const { meta, data } = createTaskResponse;

    const missingTitleRequirement = {
      instancePath: "",
      keyword: "required",
      message: "must have required property 'title'",
      params: { missingProperty: "title" },
      schemaPath: "#/required",
    };

    expect(meta.status).toBe(ResponseStatus.ERROR);
    expect(meta.code).toBe(400);

    expect(data).toBeUndefined();

    if (meta.code !== 400) {
      return;
    }

    expect(meta.data).toMatchObject([missingTitleRequirement]);
  });

  it("should not allow creating a task with an invalid priority", async () => {
    verifyJwtMock.mockImplementation(() => authMock("test-user-1"));

    const now = new Date();
    const isoDate = now.toISOString();

    const taskBody: CreateTaskBody & { invalidProperty: string } = {
      title: "Test Task",
      description: "Test description",
      dueAt: isoDate,
      priority: 4,
      invalidProperty: "Test",
    };

    const createTaskResponse = await agentRequest<CreateTaskResponse>(`/task`, {
      method: "POST",
      body: mockBody(taskBody),
    });

    const { meta, data } = createTaskResponse;

    const additionalPropertyRequirement = {
      instancePath: "",
      keyword: "additionalProperties",
      message: "must NOT have additional properties",
      schemaPath: "#/additionalProperties",
    };

    expect(meta.status).toBe(ResponseStatus.ERROR);
    expect(meta.code).toBe(400);

    expect(data).toBeUndefined();

    if (meta.code !== 400) {
      return;
    }

    expect(meta.data).toMatchObject([additionalPropertyRequirement]);
  });

  it("should return 403 if user verification is bypassed", async () => {
    const repo = entityManager.getTransaction();

    expect(repo).not.toBeNull();

    if (repo === null) {
      return;
    }

    const taskBody: CreateTaskBody = {
      title: "Test Task",
      description: "Test description",
      priority: 4,
    };

    const createTaskResponse = await CreateTask({
      body: taskBody,
      params: {},
      query: {},
      auth: null,
      repo,
    });

    const { isError, code, data } = createTaskResponse;

    expect(isError).toBe(true);
    expect(code).toBe(403);
    expect(data).toBe("Unauthorised");
  });
});
