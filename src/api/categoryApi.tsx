export type Category = {
  id: number;
  name: string;
  color: string;
  bg: string;
  text: string;
};

export type CategoryCreateData = Omit<Category, 'id'>;

const apiFetch = async <T = any>(path: string, options: RequestInit = {}): Promise<T> => {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null as unknown as T;
  return res.json();
};

export async function getCategories() {
  return apiFetch<Category[]>('/api/categories');
}

export async function createCategory(data: CategoryCreateData) {
  return apiFetch<Category>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(name: string) {
  return apiFetch(`/api/categories/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
}