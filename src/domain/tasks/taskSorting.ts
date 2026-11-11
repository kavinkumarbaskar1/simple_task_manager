import type { Task, TaskSortingContract } from "./taskTypes";
import { dueDateAscendingSort } from "./taskTypes";

export { dueDateAscendingSort };

export function compareTasksByDueDateAsc(first: Task, second: Task): number {
  const firstTime = toSortableDueDateTime(first.dueDate);
  const secondTime = toSortableDueDateTime(second.dueDate);

  if (firstTime !== secondTime) {
    return firstTime - secondTime;
  }

  return first.title.localeCompare(second.title);
}

export function sortTasksByDueDateAsc(tasks: readonly Task[]): Task[] {
  return [...tasks].sort(compareTasksByDueDateAsc);
}

export function createDueDateAscendingSort(): TaskSortingContract {
  return dueDateAscendingSort;
}

function toSortableDueDateTime(dueDate: string): number {
  const parsedTime = Date.parse(dueDate);

  return Number.isNaN(parsedTime) ? Number.POSITIVE_INFINITY : parsedTime;
}
