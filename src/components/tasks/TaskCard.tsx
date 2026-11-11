import type { Task } from "../../domain/tasks/taskTypes";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
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
      </div>
    </li>
  );
}
