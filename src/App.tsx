import { useCallback, useEffect, useMemo, useState } from "react";

import { TaskForm } from "./components/tasks/TaskForm";
import { listTasks } from "./features/tasks/taskController";
import type { Task } from "./domain/tasks/taskTypes";

const sampleTasks = [
  {
    title: "Review task list",
    meta: "Pending",
  },
  {
    title: "Draft project notes",
    meta: "Pending",
  },
  {
    title: "Archive completed items",
    meta: "Completed",
  },
];

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskError, setTaskError] = useState<string | null>(null);

  const loadTasks = useCallback(() => {
    const result = listTasks();

    if (result.ok) {
      setTasks(result.data);
      setTaskError(null);
      return;
    }

    setTaskError(result.error.message);
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const dashboardStats = useMemo(
    () => [
      { label: "Pending", value: String(tasks.filter((task) => task.status === "Pending").length) },
      {
        label: "Completed",
        value: String(tasks.filter((task) => task.status === "Completed").length),
      },
      { label: "Due Soon", value: String(countDueSoonTasks(tasks)) },
    ],
    [tasks],
  );

  const visibleTasks = useMemo(() => {
    if (tasks.length > 0) {
      return tasks.map((task) => ({
        title: task.title,
        meta: `${task.status} - ${task.priority} - due ${task.dueDate}`,
      }));
    }

    return sampleTasks;
  }, [tasks]);

  function handleTaskCreated() {
    loadTasks();
  }

  return (
    <main className="app-shell" aria-labelledby="app-title">
      <section className="hero">
        <div>
          <p className="eyebrow">Developer Demo SPA</p>
          <h1 id="app-title">Daily Task Management</h1>
          <p className="lede">
            A local-only React and TypeScript shell for organizing daily work.
          </p>
        </div>
        <button className="primary-action" type="button">
          New Task
        </button>
      </section>

      <TaskForm onTaskCreated={handleTaskCreated} />

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
            <div className="segmented-control" aria-label="Task status filter">
              <button type="button" aria-pressed="true">
                Pending
              </button>
              <button type="button" aria-pressed="false">
                Completed
              </button>
            </div>
          </div>

          {taskError ? <p className="task-error">{taskError}</p> : null}

          <ul className="task-list" aria-label="Tasks">
            {visibleTasks.map((task) => (
              <li key={task.title}>
                <span className="task-check" aria-hidden="true" />
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.meta}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
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
