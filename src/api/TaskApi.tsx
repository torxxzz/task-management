export type Task = {
  id: number;
  title: string;
  desc: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  due: string;
  completed: boolean;
  createdAt: number;
};

export type TaskStats = {
  total: number;
  active: number;
  completed: number;
  highPriority: number;
};

export type TaskQueryParams = {
  filter?: 'all' | 'active' | 'completed';
  search?: string;
  sort?: 'created' | 'priority' | 'title' | 'due';
  category?: string;
};

export type TaskCreateData = {
  title: string;
  desc: string;
  priority: Task['priority'];
  category: string;
  due: string;
};

export type TaskUpdateData = Partial<TaskCreateData> & {
  completed?: boolean;
};

const apiFetch = async <T = any>(path: string, options: RequestInit = {}): Promise<T> => {
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return null as unknown as T;
  }

  return res.json() as Promise<T>;
};

const buildQuery = (params: Record<string, string | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  });
  return query.toString() ? `?${query.toString()}` : '';
};

export async function getTasks({ filter = 'all', search = '', sort = 'created', category = '' }: TaskQueryParams = {}) {
  return apiFetch<Task[]>(`/api/tasks${buildQuery({ filter, search, sort, category })}`);
}

export async function getStats() {
  return apiFetch<TaskStats>('/api/tasks/stats');
}

export async function createTask(data: TaskCreateData) {
  return apiFetch('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTask(id: number, data: TaskUpdateData) {
  return apiFetch<Task>(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function patchTask(id: number, patch: TaskUpdateData) {
  return apiFetch<Task>(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteTask(id: number) {
  return apiFetch(`/api/tasks/${id}`, {
    method: 'DELETE',
  });
}

export async function deleteCompleted() {
  return apiFetch('/api/tasks?completed=true', {
    method: 'DELETE',
  });
}
