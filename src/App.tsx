import { useCallback, useEffect, useState } from "react";

import { TaskDashboard } from "./components/tasks/TaskDashboard";
import { TaskForm } from "./components/tasks/TaskForm";
import { loadPersistedTasks } from "./features/tasks/taskController";
import type { Task } from "./domain/tasks/taskTypes";
import { taskStorageKey } from "./storage/localTaskStorage";

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskError, setTaskError] = useState<string | null>(null);

  const loadTasks = useCallback(() => {
    const result = loadPersistedTasks();

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

  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      if (event.key === taskStorageKey) {
        loadTasks();
      }
    }

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadTasks]);

  function handleTaskCreated() {
    loadTasks();
  }

  function handleTasksRefreshed(refreshedTasks: readonly Task[]) {
    setTasks([...refreshedTasks]);
    setTaskError(null);
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

      <TaskDashboard
        tasks={tasks}
        error={taskError}
        onTasksRefreshed={handleTasksRefreshed}
      />
    </main>
  );
}
