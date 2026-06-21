import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskStats, TaskCreateData, TaskUpdateData, TaskQueryParams } from '../api/TaskApi.tsx';
import * as api from '../api/TaskApi.tsx';

export function useTasks({ filter, search, sort, category }: TaskQueryParams) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({ total: 0, active: 0, completed: 0, highPriority: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, s] = await Promise.all([
        api.getTasks({ filter, search, sort, category }),
        api.getStats(),
      ]);
      setTasks(list ?? []);
      setStats(s ?? { total: 0, active: 0, completed: 0, highPriority: 0 });
    } catch (e: any) {
      console.error('Failed to load tasks:', e);
      setError('Failed to load tasks. Please try again.');
      setTasks([]);
      setStats({ total: 0, active: 0, completed: 0, highPriority: 0 });
    } finally {
      setLoading(false);
    }
  }, [filter, search, sort, category]);

  useEffect(() => { refresh(); }, [refresh]);

  const addTask = async (data: TaskCreateData): Promise<string | null> => {
    try {
      await api.createTask(data);
      await refresh();
      return null;
    } catch (e: any) {
      return e.message || 'Failed to add task.';
    }
  };

  const editTask = async (id: number, data: TaskUpdateData): Promise<string | null> => {
    try {
      await api.updateTask(id, data);
      await refresh();
      return null;
    } catch (e: any) {
      return e.message || 'Failed to update task.';
    }
  };

  const toggleDone = async (id: number): Promise<string | null> => {
    try {
      const t = tasks.find((x) => x.id === id);
      if (t) await api.patchTask(id, { completed: !t.completed });
      await refresh();
      return null;
    } catch (e: any) {
      return e.message || 'Failed to update task.';
    }
  };

  const removeTask = async (id: number): Promise<string | null> => {
    try {
      await api.deleteTask(id);
      await refresh();
      return null;
    } catch (e: any) {
      return e.message || 'Failed to delete task.';
    }
  };

  const clearDone = async (): Promise<string | null> => {
    try {
      await api.deleteCompleted();
      await refresh();
      return null;
    } catch (e: any) {
      return e.message || 'Failed to clear completed tasks.';
    }
  };

  return { tasks, stats, loading, error, addTask, editTask, toggleDone, removeTask, clearDone };
}