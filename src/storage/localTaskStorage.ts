import type { Task } from "../domain/tasks/taskTypes";

const STORAGE_KEY = "simple-task-management:tasks";

export type TaskStorageErrorCode =
  | "storage_unavailable"
  | "read_failed"
  | "write_failed"
  | "clear_failed"
  | "invalid_data";

export interface TaskStorageError {
  code: TaskStorageErrorCode;
  message: string;
}

export type TaskStorageResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: TaskStorageError };

export const taskStorageKey = STORAGE_KEY;

export function readTasksFromStorage(): TaskStorageResult<Task[]> {
  const storage = getStorage();

  if (!storage) {
    return storageFailure("storage_unavailable", "Task storage is unavailable in this browser.");
  }

  try {
    const serializedTasks = storage.getItem(STORAGE_KEY);

    if (!serializedTasks) {
      return { ok: true, data: [] };
    }

    const parsedTasks: unknown = JSON.parse(serializedTasks);

    if (!Array.isArray(parsedTasks) || !parsedTasks.every(isStoredTask)) {
      return storageFailure("invalid_data", "Saved tasks could not be read.");
    }

    return { ok: true, data: parsedTasks };
  } catch {
    return storageFailure("read_failed", "Saved tasks could not be read.");
  }
}

export function writeTasksToStorage(tasks: readonly Task[]): TaskStorageResult<Task[]> {
  const storage = getStorage();

  if (!storage) {
    return storageFailure("storage_unavailable", "Task storage is unavailable in this browser.");
  }

  try {
    const tasksToStore = [...tasks];
    storage.setItem(STORAGE_KEY, JSON.stringify(tasksToStore));

    return { ok: true, data: tasksToStore };
  } catch {
    return storageFailure("write_failed", "Tasks could not be saved.");
  }
}

export function completeTaskInStorage(id: string): TaskStorageResult<Task | null> {
  const storedTasks = readTasksFromStorage();

  if (!storedTasks.ok) {
    return storedTasks;
  }

  const taskIndex = storedTasks.data.findIndex((storedTask) => storedTask.id === id);

  if (taskIndex === -1) {
    return { ok: true, data: null };
  }

  const storedTask = storedTasks.data[taskIndex];

  if (storedTask.status === "Completed") {
    return { ok: true, data: storedTask };
  }

  const completedTask: Task = {
    ...storedTask,
    status: "Completed",
  };
  const nextTasks = [...storedTasks.data];
  nextTasks[taskIndex] = completedTask;

  const savedTasks = writeTasksToStorage(nextTasks);

  if (!savedTasks.ok) {
    return savedTasks;
  }

  return { ok: true, data: completedTask };
}

export function deleteTaskFromStorage(id: string): TaskStorageResult<Task | null> {
  const storedTasks = readTasksFromStorage();

  if (!storedTasks.ok) {
    return storedTasks;
  }

  const taskIndex = storedTasks.data.findIndex((storedTask) => storedTask.id === id);

  if (taskIndex === -1) {
    return { ok: true, data: null };
  }

  const deletedTask = storedTasks.data[taskIndex];
  const nextTasks = storedTasks.data.filter((storedTask) => storedTask.id !== id);
  const savedTasks = writeTasksToStorage(nextTasks);

  if (!savedTasks.ok) {
    return savedTasks;
  }

  return { ok: true, data: deletedTask };
}

export function clearTasksFromStorage(): TaskStorageResult<null> {
  const storage = getStorage();

  if (!storage) {
    return storageFailure("storage_unavailable", "Task storage is unavailable in this browser.");
  }

  try {
    storage.removeItem(STORAGE_KEY);

    return { ok: true, data: null };
  } catch {
    return storageFailure("clear_failed", "Saved tasks could not be cleared.");
  }
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function storageFailure(code: TaskStorageErrorCode, message: string): TaskStorageResult<never> {
  return {
    ok: false,
    error: { code, message },
  };
}

function isStoredTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    (candidate.description === undefined || typeof candidate.description === "string") &&
    typeof candidate.dueDate === "string" &&
    (candidate.priority === "Low" ||
      candidate.priority === "Medium" ||
      candidate.priority === "High") &&
    (candidate.status === "Pending" || candidate.status === "Completed")
  );
}
