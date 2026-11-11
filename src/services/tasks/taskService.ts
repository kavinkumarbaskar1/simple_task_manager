import type {
  Task,
  TaskStatus,
  TaskValidationError,
} from "../../domain/tasks/taskTypes";
import { sortTasksByDueDateAsc } from "../../domain/tasks/taskSorting";
import { validateTaskInput, validateTaskUpdateInput } from "../../domain/tasks/taskValidation";
import {
  completeTaskInStorage,
  deleteTaskFromStorage,
  readTasksFromStorage,
  writeTasksToStorage,
} from "../../storage/localTaskStorage";
import type {
  TaskCreateInput,
  TaskListQuery,
  TaskServiceContract,
  TaskServiceError,
  TaskServiceFailure,
  TaskServiceMethod,
  TaskServiceResponse,
  TaskServiceSuccess,
  TaskUpdateInput,
} from "./taskServiceContract";

export type {
  TaskCreateInput,
  TaskListQuery,
  TaskServiceContract,
  TaskServiceError,
  TaskServiceErrorCode,
  TaskServiceFailure,
  TaskServiceMethod,
  TaskServiceResponse,
  TaskServiceSuccess,
  TaskUpdateInput,
} from "./taskServiceContract";

export const taskService: TaskServiceContract = {
  getTasks,
  postTask,
  getTask,
  putTask,
  patchTaskComplete,
  deleteTask,
};

export function getTasks(query: TaskListQuery = {}): TaskServiceResponse<Task[]> {
  if (query.status !== undefined && !isTaskStatus(query.status)) {
    return serviceError("GET", "/tasks", 400, {
      code: "invalid_request",
      message: "Task status filter must be Pending or Completed.",
    });
  }

  const storedTasks = readTasksFromStorage();

  if (!storedTasks.ok) {
    return serviceError("GET", "/tasks", 500, storedTasks.error);
  }

  const filteredTasks = hasStatusFilter(query)
    ? storedTasks.data.filter((task) => task.status === query.status)
    : [...storedTasks.data];

  return serviceSuccess("GET", taskListRoute(query), 200, sortTasksByDueDateAsc(filteredTasks));
}

export function postTask(input: TaskCreateInput): TaskServiceResponse<Task> {
  const validation = validateTaskInput(input);

  if (!validation.isValid) {
    return validationError("POST", "/tasks", validation.errors);
  }

  const storedTasks = readTasksFromStorage();

  if (!storedTasks.ok) {
    return serviceError("POST", "/tasks", 500, storedTasks.error);
  }

  const task: Task = {
    id: createTaskId(),
    title: input.title?.trim() ?? "",
    description: normalizeOptionalText(input.description),
    dueDate: input.dueDate ?? "",
    priority: input.priority as Task["priority"],
    status: "Pending",
  };
  const savedTasks = writeTasksFromService([...storedTasks.data, task], "POST", "/tasks");

  if (!savedTasks.ok) {
    return savedTasks;
  }

  return serviceSuccess("POST", "/tasks", 201, findPersistedTask(savedTasks.data, task.id) ?? task);
}

export function getTask(id: string): TaskServiceResponse<Task> {
  const route = taskRoute(id);
  const storedTasks = readTasksFromStorage();

  if (!storedTasks.ok) {
    return serviceError("GET", route, 500, storedTasks.error);
  }

  const task = storedTasks.data.find((storedTask) => storedTask.id === id);

  if (!task) {
    return serviceError("GET", route, 404, {
      code: "not_found",
      message: "Task was not found.",
    });
  }

  return serviceSuccess("GET", route, 200, task);
}

export function putTask(id: string, input: TaskUpdateInput): TaskServiceResponse<Task> {
  const route = taskRoute(id);

  if (!isTaskStatus(input.status)) {
    return serviceError("PUT", route, 400, {
      code: "invalid_request",
      message: "Task status must be Pending or Completed.",
    });
  }

  const validation = validateTaskUpdateInput(input);

  if (!validation.isValid) {
    return validationError("PUT", route, validation.errors);
  }

  const storedTasks = readTasksFromStorage();

  if (!storedTasks.ok) {
    return serviceError("PUT", route, 500, storedTasks.error);
  }

  const taskIndex = storedTasks.data.findIndex((storedTask) => storedTask.id === id);

  if (taskIndex === -1) {
    return serviceError("PUT", route, 404, {
      code: "not_found",
      message: "Task was not found.",
    });
  }

  const updatedTask: Task = {
    id,
    title: input.title.trim(),
    description: normalizeOptionalText(input.description),
    dueDate: input.dueDate,
    priority: input.priority as Task["priority"],
    status: storedTasks.data[taskIndex].status,
  };
  const nextTasks = [...storedTasks.data];
  nextTasks[taskIndex] = updatedTask;

  const savedTasks = writeTasksFromService(nextTasks, "PUT", route);

  if (!savedTasks.ok) {
    return savedTasks;
  }

  return serviceSuccess("PUT", route, 200, findPersistedTask(savedTasks.data, id) ?? updatedTask);
}

export function patchTaskComplete(id: string): TaskServiceResponse<Task> {
  const route = `${taskRoute(id)}/complete`;
  const completedTask = completeTaskInStorage(id);

  if (!completedTask.ok) {
    return serviceError("PATCH", route, 500, completedTask.error);
  }

  if (!completedTask.data) {
    return serviceError("PATCH", route, 404, {
      code: "not_found",
      message: "Task was not found.",
    });
  }

  return serviceSuccess("PATCH", route, 200, completedTask.data);
}

export function deleteTask(id: string): TaskServiceResponse<null> {
  const route = taskRoute(id);
  const deletedTask = deleteTaskFromStorage(id);

  if (!deletedTask.ok) {
    return serviceError("DELETE", route, 500, deletedTask.error);
  }

  if (!deletedTask.data) {
    return serviceError("DELETE", route, 404, {
      code: "not_found",
      message: "Task was not found.",
    });
  }

  return serviceSuccess("DELETE", route, 204, null);
}

function writeTasksFromService(
  tasks: readonly Task[],
  method: TaskServiceMethod,
  route: string,
): TaskServiceResponse<Task[]> {
  const savedTasks = writeTasksToStorage(tasks);

  if (!savedTasks.ok) {
    return serviceError(method, route, 500, savedTasks.error);
  }

  return serviceSuccess(method, route, 200, savedTasks.data);
}

function findPersistedTask(tasks: readonly Task[], id: string): Task | undefined {
  return tasks.find((task) => task.id === id);
}

function serviceSuccess<T>(
  method: TaskServiceMethod,
  route: string,
  status: number,
  data: T,
): TaskServiceSuccess<T> {
  return {
    ok: true,
    status,
    route,
    method,
    data,
  };
}

function serviceError(
  method: TaskServiceMethod,
  route: string,
  status: number,
  error: TaskServiceError,
): TaskServiceFailure {
  return {
    ok: false,
    status,
    route,
    method,
    error,
  };
}

function validationError(
  method: TaskServiceMethod,
  route: string,
  fieldErrors: TaskValidationError[],
): TaskServiceFailure {
  return serviceError(method, route, 400, {
    code: "validation_failed",
    message: "Task details need attention.",
    fieldErrors,
  });
}

function taskListRoute(query: TaskListQuery): string {
  return hasStatusFilter(query) ? `/tasks?status=${query.status}` : "/tasks";
}

function taskRoute(id: string): string {
  return `/tasks/${encodeURIComponent(id)}`;
}

function hasStatusFilter(query: TaskListQuery): query is { status: TaskStatus } {
  return isTaskStatus(query.status);
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === "Pending" || value === "Completed";
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : undefined;
}

function createTaskId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    return [...bytes]
      .map((byte, index) => {
        const value = byte.toString(16).padStart(2, "0");
        return [4, 6, 8, 10].includes(index) ? `-${value}` : value;
      })
      .join("");
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (token) => {
    const randomValue = Math.floor(Math.random() * 16);
    const value = token === "x" ? randomValue : (randomValue & 0x3) | 0x8;

    return value.toString(16);
  });
}
