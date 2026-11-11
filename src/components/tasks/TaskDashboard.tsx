import { useEffect, useMemo, useState } from "react";

import type { Task } from "../../domain/tasks/taskTypes";
import {
  completeTask,
  loadPersistedTasks,
  removeTask,
} from "../../features/tasks/taskController";
import { StatusFilter, type TaskStatusFilter } from "./StatusFilter";
import { TaskCard } from "./TaskCard";
import { TaskEmptyState } from "./TaskEmptyState";

interface TaskDashboardProps {
  tasks: readonly Task[];
  error?: string | null;
  onTasksRefreshed?: (tasks: readonly Task[]) => void;
}

export function TaskDashboard({ tasks, error, onTasksRefreshed }: TaskDashboardProps) {
  const [allTasks, setAllTasks] = useState<Task[]>(() => [...tasks]);
  const [selectedFilter, setSelectedFilter] = useState<TaskStatusFilter>("All");
  const [filterError, setFilterError] = useState<string | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    setAllTasks([...tasks]);
    setFilterError(null);
    setCompletionError(null);
    setDeleteError(null);
    setRefreshError(null);
  }, [tasks]);

  const displayedTasks = useMemo(
    () => filterTasks(allTasks, selectedFilter),
    [allTasks, selectedFilter],
  );

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

  function handleTaskUpdated() {
    refreshDashboardTasks(selectedFilter, setRefreshError);
  }

  function handleTaskCompleted(taskId: string) {
    const result = completeTask(taskId);

    if (!result.ok) {
      setCompletionError(result.error.message);
      return;
    }

    setCompletionError(null);
    refreshDashboardTasks(selectedFilter, setCompletionError);
  }

  function handleTaskDeleted(taskId: string) {
    const result = removeTask(taskId);

    if (!result.ok) {
      setDeleteError(result.error.message);
      return;
    }

    setDeleteError(null);
    refreshDashboardTasks(selectedFilter, setDeleteError);
  }

  function handleFilterChange(nextFilter: TaskStatusFilter) {
    setSelectedFilter(nextFilter);
    setCompletionError(null);
    setDeleteError(null);
    refreshDashboardTasks(nextFilter, setFilterError);
  }

  function refreshDashboardTasks(
    nextFilter: TaskStatusFilter,
    setError: (message: string | null) => void,
  ) {
    const result = loadPersistedTasks();

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    setError(null);
    setRefreshError(null);
    setAllTasks(result.data);
    onTasksRefreshed?.(result.data);
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
          <StatusFilter selectedFilter={selectedFilter} onFilterChange={handleFilterChange} />
        </div>

        {error ? <p className="task-error">{error}</p> : null}
        {filterError ? <p className="task-error">{filterError}</p> : null}
        {completionError ? <p className="task-error">{completionError}</p> : null}
        {deleteError ? <p className="task-error">{deleteError}</p> : null}
        {refreshError ? <p className="task-error">{refreshError}</p> : null}

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

function filterTasks(tasks: readonly Task[], selectedFilter: TaskStatusFilter): Task[] {
  if (selectedFilter === "All") {
    return [...tasks];
  }

  return tasks.filter((task) => task.status === selectedFilter);
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
