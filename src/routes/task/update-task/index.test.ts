import {
  agentRequest,
  authMock,
  getInsertId,
  it,
  mockBody,
  repo,
  verifyJwtMock,
} from "test/utils";
import { UpdateTaskBody, UpdateTaskResponse } from "./types";
import { Task, task, user } from "data/schema";
import { ResponseStatus } from "config/types";
import { eq } from "drizzle-orm";
import { entityManager } from "data";
import UpdateTask from ".";

describe("PATCH /:taskId", () => {
  it("should successfully return updated task by id", async () => {
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

    const newTaskInsertId = getInsertId(newTask);

    const updateTaskBody: UpdateTaskBody = {
      title: "Updated task",
      description: "Updated description",
      done: true,
      priority: 2,
    };

    const updateTaskResponse = await agentRequest<UpdateTaskResponse>(
      `/task/${newTaskInsertId}`,
      {
        method: "PATCH",
        body: mockBody(updateTaskBody),
      }
    );

    const { meta, data } = updateTaskResponse;

    expect(meta.code).toBe(200);
    expect(meta.status).toBe(ResponseStatus.SUCCCESS);

    expect(data).toMatchObject(updateTaskBody);

    const updatedTask = await repo()
      .select({
        title: task.title,
        description: task.description,
        done: task.done,
        priority: task.priority,
      })
      .from(task)
      .where(eq(task.id, newTaskInsertId));

    expect(updatedTask).toHaveLength(1);
    expect(updatedTask[0]).toMatchObject(updateTaskBody);
  });

  it("should not allow updating a non-existent task", async () => {
    verifyJwtMock.mockImplementation(() => authMock("test-user-1"));

    const updateTaskBody: UpdateTaskBody = {
      title: "Updated task",
      description: "Updated description",
      done: true,
      priority: 2,
    };

    const updateTaskResponse = await agentRequest<UpdateTaskResponse>(
      `/task/100`,
      {
        method: "PATCH",
        body: mockBody(updateTaskBody),
      }
    );

    const { meta, data } = updateTaskResponse;

    expect(meta.code).toBe(404);
    expect(meta.status).toBe(ResponseStatus.ERROR);

    expect(data).toBeUndefined();
  });

  it("should not allow updating another user's task", async () => {
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

    const newTaskInsertId = getInsertId(newTask);

    const updateTaskBody: UpdateTaskBody = {
      title: "Updated task",
      description: "Updated description",
      done: true,
      priority: 2,
    };

    const updateTaskResponse = await agentRequest<UpdateTaskResponse>(
      `/task/${newTaskInsertId}`,
      {
        method: "PATCH",
        body: mockBody(updateTaskBody),
      }
    );

    const { meta, data } = updateTaskResponse;

    expect(meta.code).toBe(403);
    expect(meta.status).toBe(ResponseStatus.ERROR);
    expect(data).toBeUndefined();

    const updatedTask = await repo()
      .select({
        title: task.title,
        description: task.description,
        done: task.done,
        priority: task.priority,
      })
      .from(task)
      .where(eq(task.id, newTaskInsertId));

    expect(updatedTask).toHaveLength(1);
    expect(updatedTask[0]).not.toMatchObject(updateTaskBody);
  });

  it("should not allow updating a task if not authenticated", async () => {
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

    const newTaskInsertId = getInsertId(newTask);

    const updateTaskBody: UpdateTaskBody = {
      title: "Updated task",
      description: "Updated description",
      done: true,
      priority: 2,
    };

    const updateTaskResponse = await agentRequest<UpdateTaskResponse>(
      `/task/${newTaskInsertId}`,
      {
        method: "PATCH",
        body: mockBody(updateTaskBody),
      }
    );

    const { meta, data } = updateTaskResponse;

    expect(meta.code).toBe(401);
    expect(meta.status).toBe(ResponseStatus.ERROR);
    expect(data).toBeUndefined();

    const updatedTask = await repo()
      .select({
        title: task.title,
        description: task.description,
        done: task.done,
        priority: task.priority,
      })
      .from(task)
      .where(eq(task.id, newTaskInsertId));

    expect(updatedTask).toHaveLength(1);
    expect(updatedTask[0]).not.toMatchObject(updateTaskBody);
  });

  it("should require at least 1 body property for a task update", async () => {
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

    const newTaskInsertId = getInsertId(newTask);

    const updateTaskBody: UpdateTaskBody = {};

    const updateTaskResponse = await agentRequest<UpdateTaskResponse>(
      `/task/${newTaskInsertId}`,
      {
        method: "PATCH",
        body: mockBody(updateTaskBody),
      }
    );

    const { meta, data } = updateTaskResponse;

    const minPropertiesRequirement = {
      instancePath: "",
      schemaPath: "#/minProperties",
      keyword: "minProperties",
      message: "must NOT have fewer than 1 properties",
      params: {
        limit: 1,
      },
    };

    expect(meta.code).toBe(400);
    expect(meta.status).toBe(ResponseStatus.ERROR);
    expect(data).toBeUndefined();

    if (meta.status !== ResponseStatus.ERROR) {
      return;
    }

    expect(meta.data).toContainEqual(minPropertiesRequirement);
  });

  it("should not allow updating a task with an invalid priority", async () => {
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

    const newTaskInsertId = getInsertId(newTask);

    const updateTaskBody: UpdateTaskBody & { invalidProperty: string } = {
      invalidProperty: "test",
    };

    const updateTaskResponse = await agentRequest<UpdateTaskResponse>(
      `/task/${newTaskInsertId}`,
      {
        method: "PATCH",
        body: mockBody(updateTaskBody),
      }
    );

    const { meta, data } = updateTaskResponse;

    const minPropertiesRequirement = {
      instancePath: "",
      keyword: "additionalProperties",
      message: "must NOT have additional properties",
      params: { additionalProperty: "invalidProperty" },
      schemaPath: "#/additionalProperties",
    };

    expect(meta.code).toBe(400);
    expect(meta.status).toBe(ResponseStatus.ERROR);
    expect(data).toBeUndefined();

    if (meta.status !== ResponseStatus.ERROR) {
      return;
    }

    expect(meta.data).toContainEqual(minPropertiesRequirement);
  });

  it("should not allow to set a task's title to null", async () => {
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

    const newTaskInsertId = getInsertId(newTask);

    const updateTaskBody: { title: null } = {
      title: null,
    };

    const updateTaskResponse = await agentRequest<UpdateTaskResponse>(
      `/task/${newTaskInsertId}`,
      {
        method: "PATCH",
        body: mockBody(updateTaskBody),
      }
    );

    const { meta, data } = updateTaskResponse;

    expect(meta.code).toBe(400);
    expect(meta.status).toBe(ResponseStatus.ERROR);
    expect(data).toBeUndefined();
  });

  it("should return 403 if user verification is bypassed", async () => {
    const repo = entityManager.getTransaction();

    expect(repo).not.toBeNull();

    if (repo === null) {
      return;
    }

    const updateTaskResponse = await UpdateTask({
      body: {},
      params: {
        taskId: "1",
      },
      query: {},
      auth: null,
      repo,
    });

    const { isError, code, data } = updateTaskResponse;

    expect(isError).toBe(true);
    expect(code).toBe(403);
    expect(data).toBe("Unauthorised");
  });
});
