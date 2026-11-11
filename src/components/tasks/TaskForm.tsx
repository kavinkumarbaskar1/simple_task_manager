import { useId, useState, type FormEvent } from "react";

import { createTask } from "../../features/tasks/taskController";
import { taskPriorities, type Task, type TaskInput } from "../../domain/tasks/taskTypes";

type TaskFormValues = TaskInput;

interface TaskFormProps {
  onTaskCreated: (task: Task) => void;
}

type FieldErrors = Partial<Record<keyof TaskFormValues, string>>;

const initialValues: TaskFormValues = {
  title: "",
  description: "",
  dueDate: "",
  priority: "",
};

export function TaskForm({ onTaskCreated }: TaskFormProps) {
  const formId = useId();
  const [values, setValues] = useState<TaskFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function updateField<Field extends keyof TaskFormValues>(
    field: Field,
    value: TaskFormValues[Field],
  ) {
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

    const result = createTask(values);

    if (!result.ok) {
      setFieldErrors(toFieldErrors(result.error.fieldErrors ?? []));
      setFormError(result.error.fieldErrors?.length ? null : result.error.message);
      return;
    }

    onTaskCreated(result.data);
    setValues(initialValues);
    setFieldErrors({});
    setFormError(null);
  }

  return (
    <form className="task-form" aria-labelledby="task-form-heading" onSubmit={handleSubmit}>
      <div className="form-heading">
        <div>
          <p className="eyebrow">Create</p>
          <h2 id="task-form-heading">New Task</h2>
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
            rows={4}
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
            onChange={(event) => updateField("priority", event.target.value as TaskInput["priority"])}
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
        <button className="primary-action" type="submit">
          Create Task
        </button>
      </div>
    </form>
  );
}

function toFieldErrors(errors: NonNullable<ReturnType<typeof createTask>["error"]>["fieldErrors"]) {
  return (errors ?? []).reduce<FieldErrors>((nextErrors, error) => {
    nextErrors[error.field] = error.message;
    return nextErrors;
  }, {});
}
