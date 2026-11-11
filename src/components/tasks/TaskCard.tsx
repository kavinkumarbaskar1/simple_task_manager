import { useState } from "react";

import type { Task } from "../../domain/tasks/taskTypes";
import { EditTaskForm } from "./EditTaskForm";

interface TaskCardProps {
  task: Task;
  onTaskUpdated: (task: Task) => void;
  onTaskCompleted: (taskId: string) => void;
  onTaskDeleted: (taskId: string) => void;
}

export function TaskCard({
  task,
  onTaskUpdated,
  onTaskCompleted,
  onTaskDeleted,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  function handleTaskUpdated(updatedTask: Task) {
    onTaskUpdated(updatedTask);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <li className="task-card">
        <span className="task-check" aria-hidden="true" />
        <div>
          <EditTaskForm
            task={task}
            onCancel={() => setIsEditing(false)}
            onTaskUpdated={handleTaskUpdated}
          />
        </div>
      </li>
    );
  }

  return (
    <li className="task-card">
      <span className="task-check" aria-hidden="true" />
      <div>
        <strong>{task.title}</strong>
        <dl className="task-details" aria-label={`${task.title} details`}>
          <div>
            <dt>Due date</dt>
            <dd>{task.dueDate}</dd>
          </div>
          <div>
            <dt>Priority</dt>
            <dd>{task.priority}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{task.status}</dd>
          </div>
        </dl>
        <div className="task-actions">
          {task.status === "Pending" ? (
            <button type="button" onClick={() => onTaskCompleted(task.id)}>
              Mark completed
            </button>
          ) : null}
          <button type="button" onClick={() => setIsEditing(true)}>
            Edit
          </button>
          <button type="button" onClick={() => onTaskDeleted(task.id)}>
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
