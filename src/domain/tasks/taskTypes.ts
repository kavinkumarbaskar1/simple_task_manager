export const taskPriorities = ["Low", "Medium", "High"] as const;
export const taskStatuses = ["Pending", "Completed"] as const;

export type TaskPriority = (typeof taskPriorities)[number];
export type TaskStatus = (typeof taskStatuses)[number];

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
}

export interface TaskInput {
  title: string;
  description?: string;
  dueDate: string;
  priority: TaskPriority | "";
}

export type TaskRequiredField = "title" | "dueDate" | "priority";
export type TaskValidationField = TaskRequiredField;

export interface TaskValidationError {
  field: TaskValidationField;
  message: string;
}

export type TaskValidationResult = {
  isValid: boolean;
  errors: TaskValidationError[];
};

export type TaskSortDirection = "asc" | "desc";

export interface TaskSortingContract {
  field: "dueDate";
  direction: TaskSortDirection;
}

export const dueDateAscendingSort: TaskSortingContract = {
  field: "dueDate",
  direction: "asc",
};
