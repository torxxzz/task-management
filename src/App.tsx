import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Moon, Sun } from 'lucide-react';
import Sidebar from './components/Sidebar.tsx';
import StatsGrid from './components/StatsGrid.tsx';
import TaskList from './components/TaskList.tsx';
import TaskModal from './components/TaskModal.tsx';
import Toast from './components/Toast';
import { useTasks } from './hooks/UseTask.tsx';
import { useToast } from './hooks/UseToast.tsx';
import { CategoryProvider, useCategories } from './hooks/UseCategories.tsx';
import type { Task, TaskCreateData, TaskUpdateData } from './api/TaskApi.tsx';

const FILTER_TITLES = { all: 'All Tasks', active: 'Active Tasks', completed: 'Completed Tasks' };
const UNDO_SECONDS = 5;

type UndoAction =
  | { kind: 'delete'; task: Task; remaining: number }
  | { kind: 'clear'; remaining: number };

type PendingUndoAction =
  | { kind: 'delete'; task: Task }
  | { kind: 'clear' };


function AppInner() {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sort, setSort] = useState<'created' | 'priority' | 'title' | 'due'>('created');
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'view' | 'edit'>('add');
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = window.localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    document.body.classList.toggle('light', theme === 'light');
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  const { toast, showToast } = useToast();
  const { categories } = useCategories();
  const { tasks, stats, loading, error, addTask, editTask, toggleDone, removeTask, clearDone } = useTasks({
    filter, search, sort,
  });

  const undoActionRef = useRef<UndoAction | null>(null);
  const undoTimeoutRef = useRef<number | null>(null);
  const undoIntervalRef = useRef<number | null>(null);

  const clearUndoTimers = () => {
    if (undoTimeoutRef.current !== null) {
      window.clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    if (undoIntervalRef.current !== null) {
      window.clearInterval(undoIntervalRef.current);
      undoIntervalRef.current = null;
    }
  };

  useEffect(() => {
    undoActionRef.current = undoAction;
  }, [undoAction]);

  const filteredTasks = tasks.filter(task => {
    const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(task.category);
    const priorityMatch = selectedPriorities.length === 0 || selectedPriorities.includes(task.priority);
    return categoryMatch && priorityMatch;
  });

  const visibleTasks = filteredTasks.filter(task => {
    if (undoAction?.kind === 'delete' && undoAction.task.id === task.id) return false;
    if (undoAction?.kind === 'clear' && task.completed) return false;
    return true;
  });

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(visibleTasks.length / pageSize));
  const paginatedTasks = visibleTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (error) showToast(error);
  }, [error, showToast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search, sort, selectedCategories, selectedPriorities]);

  useEffect(() => {
    setCurrentPage(prev => Math.min(prev, totalPages));
  }, [totalPages]);

  const commitUndoAction = async (action: UndoAction) => {
    if (action.kind === 'delete') {
      const err = await removeTask(action.task.id);
      if (err) showToast(err);
      else showToast('Task deleted');
      return;
    }

    const err = await clearDone();
    if (err) showToast(err);
    else showToast('Completed tasks cleared');
  };

  const scheduleUndoAction = (action: PendingUndoAction) => {
    clearUndoTimers();
    setUndoAction(action.kind === 'delete'
      ? { kind: 'delete', task: action.task, remaining: UNDO_SECONDS }
      : { kind: 'clear', remaining: UNDO_SECONDS }
    );
    undoIntervalRef.current = window.setInterval(() => {
      setUndoAction(prev => {
        if (!prev) return prev;
        if (prev.remaining <= 1) return prev;
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    undoTimeoutRef.current = window.setTimeout(async () => {
      const pending = undoActionRef.current;
      clearUndoTimers();
      setUndoAction(null);
      if (pending) {
        await commitUndoAction(pending);
      }
    }, UNDO_SECONDS * 1000);
  };

  const undoPendingAction = () => {
    clearUndoTimers();
    setUndoAction(null);
  };

  const openAdd = () => { setModalMode('add'); setViewingTask(null); setEditingTask(null); setModalOpen(true); };
  const openView = (task: Task) => { setModalMode('view'); setViewingTask(task); setEditingTask(null); setModalOpen(true); };
  const openEdit = (task: Task) => { setModalMode('edit'); setViewingTask(task); setEditingTask(task); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setModalMode('add'); setViewingTask(null); setEditingTask(null); };
  const switchToEdit = () => {
    if (viewingTask) {
      setModalMode('edit');
      setEditingTask(viewingTask);
    }
  };

  const handleSave: (data: TaskCreateData | TaskUpdateData) => Promise<void> = async (data) => {
    if (editingTask) {
      const err = await editTask(editingTask.id, data as TaskUpdateData);
      showToast(err ?? 'Task updated');
    } else {
      const err = await addTask(data as TaskCreateData);
      showToast(err ?? 'Created task');
    }
  };

  const handleToggle: (id: number) => Promise<void> = async (id) => {
    const t = tasks.find(x => x.id === id);
    const err = await toggleDone(id);
    if (err) showToast(err);
    else showToast(t?.completed ? 'Marked as active' : 'Task completed ✓');
  };

  const handleDelete: (id: number) => Promise<void> = async (id) => {
    const task = tasks.find(x => x.id === id);
    if (!task) return;

    if (undoActionRef.current) {
      await commitUndoAction(undoActionRef.current);
      clearUndoTimers();
      setUndoAction(null);
    }

    scheduleUndoAction({ kind: 'delete', task });
  };

  const handleClearDone: () => Promise<void> = async () => {
    if (undoActionRef.current) {
      await commitUndoAction(undoActionRef.current);
      clearUndoTimers();
      setUndoAction(null);
    }

    scheduleUndoAction({ kind: 'clear' });
  };

  const togglePriority = (priority: string) => {
    setSelectedPriorities(prev => prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };

  return (
    <div className="app">
      <Sidebar
        filter={filter}
        onFilterChange={setFilter}
        stats={stats}
        onClearDone={handleClearDone}
      />

      <div className="main">
        <header className="topbar">
          <h1 className="page-title">{FILTER_TITLES[filter]}</h1>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add task
          </button>
        </header>

        <div className="content">
          <StatsGrid stats={stats} />

          <div className="filter-panel">
            <div className="filter-tools">
              <div className="search-wrap">
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search tasks…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="search-input"
                />
              </div>

              <select
                className="sort-select"
                value={sort}
                onChange={e => setSort(e.target.value as 'created' | 'priority' | 'title' | 'due')}
                aria-label="Sort tasks"
              >
                <option value="created">Newest</option>
                <option value="priority">Priority</option>
                <option value="title">Alphabetize</option>
                <option value="due">Due date</option>
              </select>
            </div>

            <div className="filter-group">
              <h4 className="filter-heading">Filter by category</h4>
              <div className="checkbox-row">
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={selectedCategories.length === 0}
                    onChange={() => setSelectedCategories([])}
                  />
                  <span>All</span>
                </label>
                {categories.map(category => (
                  <label key={category.id} className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.name)}
                      onChange={() => toggleCategory(category.name)}
                    />
                    <span>{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4 className="filter-heading">Filter by priority</h4>
              <div className="checkbox-row">
                {['high', 'medium', 'low'].map(priority => (
                  <label key={priority} className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={selectedPriorities.includes(priority)}
                      onChange={() => togglePriority(priority)}
                    />
                    <span>{priority}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <TaskList
            tasks={paginatedTasks}
            loading={loading}
            onToggle={handleToggle}
            onOpen={openView}
            onEdit={openEdit}
            onDelete={handleDelete}
          />

          {!loading && filteredTasks.length > 0 && (
            <div className="pager">
              <button
                type="button"
                className="pager-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="pager-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="pager-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <TaskModal
          task={editingTask ?? viewingTask}
          onSave={handleSave}
          onClose={closeModal}
          readOnly={modalMode === 'view'}
          onEdit={switchToEdit}
        />
      )}

      <Toast
        message={undoAction ? (undoAction.kind === 'delete' ? 'Task will be deleted' : 'Completed tasks will be deleted') : toast}
        actionLabel={undoAction ? `Undo ${undoAction.remaining}s` : undefined}
        onAction={undoAction ? undoPendingAction : undefined}
      />
    </div>
  );
}

export default function App() {
  return (
    <CategoryProvider>
      <AppInner />
    </CategoryProvider>
  );
}