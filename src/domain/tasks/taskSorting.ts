import type { Task, TaskSortingContract } from "./taskTypes";
import { dueDateAscendingSort } from "./taskTypes";

export { dueDateAscendingSort };

export function compareTasksByDueDateAsc(first: Task, second: Task): number {
  const firstTime = toSortableDueDateValue(first.dueDate);
  const secondTime = toSortableDueDateValue(second.dueDate);

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

function toSortableDueDateValue(dueDate: string): number {
  const parsedTime = Date.parse(`${dueDate}T00:00:00Z`);

  return Number.isNaN(parsedTime) ? Number.POSITIVE_INFINITY : parsedTime;
}
