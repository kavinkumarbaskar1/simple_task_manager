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

    if (!Array.isArray(parsedTasks)) {
      return storageFailure("invalid_data", "Saved tasks could not be read.");
    }

    const storedTasks: Task[] = [];

    for (const parsedTask of parsedTasks) {
      const storedTask = toStoredTask(parsedTask);

      if (!storedTask) {
        return storageFailure("invalid_data", "Saved tasks could not be read.");
      }

      storedTasks.push(storedTask);
    }

    return { ok: true, data: storedTasks };
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
    const tasksToStore = tasks.map(toTaskStorageRecord);
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

function toStoredTask(value: unknown): Task | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const id = candidate.id;
  const title = candidate.title;
  const description = candidate.description;
  const dueDate = candidate.dueDate;
  const priority = candidate.priority;
  const status = candidate.status;

  if (
    typeof id !== "string" ||
    typeof title !== "string" ||
    (description !== undefined && typeof description !== "string") ||
    typeof dueDate !== "string" ||
    (priority !== "Low" && priority !== "Medium" && priority !== "High") ||
    (status !== "Pending" && status !== "Completed")
  ) {
    return null;
  }

  return {
    id,
    title,
    description,
    dueDate,
    priority,
    status,
  };
}

function toTaskStorageRecord(task: Task): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    priority: task.priority,
    status: task.status,
  };
}
