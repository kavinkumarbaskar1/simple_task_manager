import type {
  Task,
  TaskInput,
  TaskStatus,
  TaskValidationError,
} from "../../domain/tasks/taskTypes";
import type { TaskStorageError } from "../../storage/localTaskStorage";

export type TaskServiceErrorCode =
  | TaskStorageError["code"]
  | "not_found"
  | "invalid_request"
  | "validation_failed";

export interface TaskServiceError {
  code: TaskServiceErrorCode;
  message: string;
  fieldErrors?: TaskValidationError[];
}

export type TaskServiceMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface TaskServiceSuccess<T> {
  ok: true;
  status: number;
  route: string;
  method: TaskServiceMethod;
  data: T;
}

export interface TaskServiceFailure {
  ok: false;
  status: number;
  route: string;
  method: TaskServiceMethod;
  error: TaskServiceError;
}

export type TaskServiceResponse<T> = TaskServiceSuccess<T> | TaskServiceFailure;

export interface TaskListQuery {
  status?: TaskStatus;
}

export type TaskCreateInput = Partial<TaskInput>;

export type TaskUpdateInput = TaskInput & {
  status: TaskStatus;
};

export interface TaskServiceContract {
  /**
   * GET /tasks?status={Pending|Completed}
   * Returns all locally stored tasks or only tasks matching the optional status filter.
   */
  getTasks(query?: TaskListQuery): TaskServiceResponse<Task[]>;

  /**
   * POST /tasks
   * Creates a local task from title, optional description, dueDate, and priority.
   */
  postTask(input: TaskCreateInput): TaskServiceResponse<Task>;

  /**
   * GET /tasks/{id}
   * Returns one locally stored task by id.
   */
  getTask(id: string): TaskServiceResponse<Task>;

  /**
   * PUT /tasks/{id}
   * Replaces editable task fields after required-field validation and preserves stored status.
   */
  putTask(id: string, input: TaskUpdateInput): TaskServiceResponse<Task>;

  /**
   * PATCH /tasks/{id}/complete
   * Marks one locally stored task as Completed.
   */
  patchTaskComplete(id: string): TaskServiceResponse<Task>;

  /**
   * DELETE /tasks/{id}
   * Removes one locally stored task from subsequent list results.
   */
  deleteTask(id: string): TaskServiceResponse<null>;
}

export const taskServiceRoutes = {
  list: {
    method: "GET",
    path: "/tasks?status={Pending|Completed}",
  },
  create: {
    method: "POST",
    path: "/tasks",
  },
  read: {
    method: "GET",
    path: "/tasks/{id}",
  },
  update: {
    method: "PUT",
    path: "/tasks/{id}",
  },
  complete: {
    method: "PATCH",
    path: "/tasks/{id}/complete",
  },
  delete: {
    method: "DELETE",
    path: "/tasks/{id}",
  },
} as const satisfies Record<string, { method: TaskServiceMethod; path: string }>;
