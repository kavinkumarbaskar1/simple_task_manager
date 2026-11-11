import type {
  TaskInput,
  TaskPriority,
  TaskRequiredField,
  TaskValidationError,
  TaskValidationResult,
} from "./taskTypes";
import { taskPriorities } from "./taskTypes";

const requiredFieldMessages: Record<TaskRequiredField, string> = {
  title: "Title is required.",
  dueDate: "Due date is required.",
  priority: "Priority is required.",
};

export function isTaskPriority(value: string): value is TaskPriority {
  return taskPriorities.includes(value as TaskPriority);
}

export function validateRequiredTaskFields(
  input: Pick<TaskInput, TaskRequiredField>,
): TaskValidationError[] {
  const errors: TaskValidationError[] = [];

  if (!input.title.trim()) {
    errors.push({ field: "title", message: requiredFieldMessages.title });
  }

  if (!input.dueDate.trim()) {
    errors.push({ field: "dueDate", message: requiredFieldMessages.dueDate });
  }

  if (!input.priority || !isTaskPriority(input.priority)) {
    errors.push({ field: "priority", message: requiredFieldMessages.priority });
  }

  return errors;
}

export function validateTaskInput(input: TaskInput): TaskValidationResult {
  const errors = validateRequiredTaskFields(input);

  return {
    isValid: errors.length === 0,
    errors,
  };
}
