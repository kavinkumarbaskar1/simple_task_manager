import { useEffect, useMemo, useState } from "react";

import type { Task } from "../../domain/tasks/taskTypes";
import { completeTask, removeTask } from "../../features/tasks/taskController";
import { TaskCard } from "./TaskCard";
import { TaskEmptyState } from "./TaskEmptyState";

interface TaskDashboardProps {
  tasks: readonly Task[];
  error?: string | null;
}

export function TaskDashboard({ tasks, error }: TaskDashboardProps) {
  const [displayedTasks, setDisplayedTasks] = useState<Task[]>(() => [...tasks]);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayedTasks([...tasks]);
    setCompletionError(null);
    setDeleteError(null);
  }, [tasks]);

  const dashboardStats = useMemo(
    () => [
      {
        label: "Pending",
        value: String(displayedTasks.filter((task) => task.status === "Pending").length),
      },
      {
        label: "Completed",
        value: String(displayedTasks.filter((task) => task.status === "Completed").length),
      },
      { label: "Due Soon", value: String(countDueSoonTasks(displayedTasks)) },
    ],
    [displayedTasks],
  );

  function handleTaskUpdated(updatedTask: Task) {
    setDisplayedTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    );
  }

  function handleTaskCompleted(taskId: string) {
    const result = completeTask(taskId);

    if (!result.ok) {
      setCompletionError(result.error.message);
      return;
    }

    setCompletionError(null);
    setDisplayedTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === result.data.id ? result.data : task)),
    );
  }

  function handleTaskDeleted(taskId: string) {
    const result = removeTask(taskId);

    if (!result.ok) {
      setDeleteError(result.error.message);
      return;
    }

    setDeleteError(null);
    setDisplayedTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
  }

  return (
    <section className="dashboard" aria-label="Task dashboard overview">
      <div className="stats-grid">
        {dashboardStats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </div>

      <div className="task-panel" aria-labelledby="today-heading">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Today</p>
            <h2 id="today-heading">Task Dashboard</h2>
          </div>
          <div className="segmented-control" aria-label="Task status summary">
            <button type="button" aria-pressed="true">
              Pending
            </button>
            <button type="button" aria-pressed="false">
              Completed
            </button>
          </div>
        </div>

        {error ? <p className="task-error">{error}</p> : null}
        {completionError ? <p className="task-error">{completionError}</p> : null}
        {deleteError ? <p className="task-error">{deleteError}</p> : null}

        {displayedTasks.length > 0 ? (
          <ul className="task-list" aria-label="Tasks">
            {displayedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onTaskUpdated={handleTaskUpdated}
                onTaskCompleted={handleTaskCompleted}
                onTaskDeleted={handleTaskDeleted}
              />
            ))}
          </ul>
        ) : (
          <TaskEmptyState />
        )}
      </div>
    </section>
  );
}

function countDueSoonTasks(tasks: readonly Task[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueSoonLimit = new Date(today);
  dueSoonLimit.setDate(today.getDate() + 7);

  return tasks.filter((task) => {
    if (task.status !== "Pending") {
      return false;
    }

    const dueDate = new Date(`${task.dueDate}T00:00:00`);
    return dueDate >= today && dueDate <= dueSoonLimit;
  }).length;
}
