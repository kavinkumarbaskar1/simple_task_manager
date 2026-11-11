import { useId, useState, type FormEvent } from "react";

import {
  taskPriorities,
  type Task,
  type TaskInput,
  type TaskValidationError,
} from "../../domain/tasks/taskTypes";
import { updateTask } from "../../features/tasks/taskController";

type EditTaskFormValues = TaskInput & {
  status: Task["status"];
};

interface EditTaskFormProps {
  task: Task;
  onCancel: () => void;
  onTaskUpdated: (task: Task) => void;
}

type FieldErrors = Partial<Record<keyof TaskInput, string>>;

export function EditTaskForm({ task, onCancel, onTaskUpdated }: EditTaskFormProps) {
  const formId = useId();
  const [values, setValues] = useState<EditTaskFormValues>(() => ({
    title: task.title,
    description: task.description ?? "",
    dueDate: task.dueDate,
    priority: task.priority,
    status: task.status,
  }));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function updateField<Field extends keyof TaskInput>(field: Field, value: TaskInput[Field]) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
    setFieldErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
    setFormError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = updateTask(task.id, values);

    if (!result.ok) {
      setFieldErrors(toFieldErrors(result.error.fieldErrors ?? []));
      setFormError(result.error.fieldErrors?.length ? null : result.error.message);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    onTaskUpdated(result.data);
  }

  return (
    <form className="task-form" aria-labelledby={`${formId}-heading`} onSubmit={handleSubmit}>
      <div className="form-heading">
        <div>
          <p className="eyebrow">Edit</p>
          <h2 id={`${formId}-heading`}>{task.title}</h2>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-field form-field-wide">
          <label htmlFor={`${formId}-title`}>
            Title <span aria-hidden="true">*</span>
          </label>
          <input
            id={`${formId}-title`}
            name="title"
            type="text"
            value={values.title}
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.title)}
            aria-describedby={fieldErrors.title ? `${formId}-title-error` : undefined}
            onChange={(event) => updateField("title", event.target.value)}
          />
          {fieldErrors.title ? (
            <p className="field-error" id={`${formId}-title-error`}>
              {fieldErrors.title}
            </p>
          ) : null}
        </div>

        <div className="form-field form-field-wide">
          <label htmlFor={`${formId}-description`}>Description</label>
          <textarea
            id={`${formId}-description`}
            name="description"
            rows={3}
            value={values.description}
            onChange={(event) => updateField("description", event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor={`${formId}-due-date`}>
            Due date <span aria-hidden="true">*</span>
          </label>
          <input
            id={`${formId}-due-date`}
            name="dueDate"
            type="date"
            value={values.dueDate}
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.dueDate)}
            aria-describedby={fieldErrors.dueDate ? `${formId}-due-date-error` : undefined}
            onChange={(event) => updateField("dueDate", event.target.value)}
          />
          {fieldErrors.dueDate ? (
            <p className="field-error" id={`${formId}-due-date-error`}>
              {fieldErrors.dueDate}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor={`${formId}-priority`}>
            Priority <span aria-hidden="true">*</span>
          </label>
          <select
            id={`${formId}-priority`}
            name="priority"
            value={values.priority}
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.priority)}
            aria-describedby={fieldErrors.priority ? `${formId}-priority-error` : undefined}
            onChange={(event) =>
              updateField("priority", event.target.value as TaskInput["priority"])
            }
          >
            <option value="">Select priority</option>
            {taskPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
          {fieldErrors.priority ? (
            <p className="field-error" id={`${formId}-priority-error`}>
              {fieldErrors.priority}
            </p>
          ) : null}
        </div>
      </div>

      {formError ? <p className="task-error">{formError}</p> : null}

      <div className="form-actions">
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="primary-action" type="submit">
          Save Changes
        </button>
      </div>
    </form>
  );
}

function toFieldErrors(errors: readonly TaskValidationError[]): FieldErrors {
  return errors.reduce<FieldErrors>((nextErrors, error) => {
    nextErrors[error.field] = error.message;
    return nextErrors;
  }, {});
}
