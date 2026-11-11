import { sortTasksByDueDateAsc } from "../../domain/tasks/taskSorting";
import type {
  Task,
  TaskInput,
  TaskStatus,
  TaskValidationError,
} from "../../domain/tasks/taskTypes";
import { validateTaskInput, validateTaskUpdateInput } from "../../domain/tasks/taskValidation";
import {
  deleteTask,
  getTask,
  getTasks,
  patchTaskComplete,
  postTask,
  putTask,
  type TaskCreateInput,
  type TaskServiceError,
  type TaskUpdateInput,
} from "../../services/tasks/taskService";

export type TaskControllerErrorCode = TaskServiceError["code"] | "validation_failed";

export interface TaskControllerError {
  code: TaskControllerErrorCode;
  message: string;
  fieldErrors?: TaskValidationError[];
}

export type TaskControllerResult<T> =
  | { ok: true; data: T; error: null }
  | { ok: false; data: null; error: TaskControllerError };

export type TaskCompleteResult = TaskControllerResult<Task>;

export interface TaskListOptions {
  status?: TaskStatus;
}

export function listTasks(options: TaskListOptions = {}): TaskControllerResult<Task[]> {
  const response = options.status ? getTasks({ status: options.status }) : getTasks();

  if (!response.ok) {
    return controllerFailure(response.error);
  }

  return controllerSuccess(sortTasksByDueDateAsc(response.data));
}

export function findTask(id: string): TaskControllerResult<Task> {
  const response = getTask(id);

  if (!response.ok) {
    return controllerFailure(response.error);
  }

  return controllerSuccess(response.data);
}

export function createTask(input: TaskCreateInput): TaskControllerResult<Task> {
  const validation = validateTaskInput(input);

  if (!validation.isValid) {
    return validationFailure(validation.errors);
  }

  const response = postTask(input);

  if (!response.ok) {
    return controllerFailure(response.error);
  }

  return controllerSuccess(response.data);
}

export function updateTask(id: string, input: TaskUpdateInput): TaskControllerResult<Task> {
  const validation = validateTaskUpdateInput(input);

  if (!validation.isValid) {
    return validationFailure(validation.errors);
  }

  const response = putTask(id, input);

  if (!response.ok) {
    return controllerFailure(response.error);
  }

  return controllerSuccess(response.data);
}

export function completeTask(id: string): TaskCompleteResult {
  const response = patchTaskComplete(id);

  if (!response.ok) {
    return controllerFailure(response.error);
  }

  return controllerSuccess(response.data);
}

export function removeTask(id: string): TaskControllerResult<null> {
  const response = deleteTask(id);

  if (!response.ok) {
    return controllerFailure(response.error);
  }

  return controllerSuccess(response.data);
}

function controllerSuccess<T>(data: T): TaskControllerResult<T> {
  return {
    ok: true,
    data,
    error: null,
  };
}

function controllerFailure<T>(error: TaskServiceError | undefined): TaskControllerResult<T> {
  return {
    ok: false,
    data: null,
    error: error ?? {
      code: "invalid_request",
      message: "Task request could not be completed.",
    },
  };
}

function validationFailure<T>(fieldErrors: TaskValidationError[]): TaskControllerResult<T> {
  return {
    ok: false,
    data: null,
    error: {
      code: "validation_failed",
      message: "Task details need attention.",
      fieldErrors,
    },
  };
}
