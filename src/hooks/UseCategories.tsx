import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import * as api from '../api/categoryApi.tsx';
import type { Category } from '../api/categoryApi.tsx';

export type { Category };

export type CategoryContextType = {
  categories: Category[];
  addCategory: (name: string, colorIdx: number) => Promise<boolean>;
  removeCategory: (name: string) => Promise<boolean>;
  getCategory: (name: string) => Category;
  loading: boolean;
};

export const COLOR_OPTIONS = [
  { color: '#534AB7', bg: '#EEEDFE', text: '#3C3489' },
  { color: '#1D9E75', bg: '#E1F5EE', text: '#0F6E56' },
  { color: '#BA7517', bg: '#FAEEDA', text: '#854F0B' },
  { color: '#E24B4A', bg: '#FCEBEB', text: '#A32D2D' },
  { color: '#185FA5', bg: '#E6F1FB', text: '#0C447C' },
  { color: '#993556', bg: '#FBEAF0', text: '#72243E' },
  { color: '#639922', bg: '#EAF3DE', text: '#3B6D11' },
  { color: '#888780', bg: '#F1EFE8', text: '#444441' },
];

const FALLBACK: Category = { id: 0, name: 'General', color: '#888780', bg: '#F1EFE8', text: '#444441' };

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data ?? []);
    } catch (e) {
      console.error('Failed to load categories:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const addCategory = async (name: string, colorIdx: number): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) return false;
    try {
      const cat = await api.createCategory({ name: trimmed, ...COLOR_OPTIONS[colorIdx] });
      setCategories(prev => [...prev, cat]);
      return true;
    } catch {
      return false;
    }
  };

  const removeCategory = async (name: string): Promise<boolean> => {
    try {
      await api.deleteCategory(name);
      setCategories(prev => prev.filter(c => c.name !== name));
      return true;
    } catch {
      return false;
    }
  };

  const getCategory = (name: string): Category => {
    return categories.find(c => c.name === name) ?? FALLBACK;
  };

  return (
    <CategoryContext.Provider value={{ categories, addCategory, removeCategory, getCategory, loading }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories(): CategoryContextType {
  const context = useContext(CategoryContext);
  if (!context) throw new Error('useCategories must be used within a CategoryProvider');
  return context;
}