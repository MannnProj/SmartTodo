import { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import TaskModal from '../components/TaskModal';
import TaskItem from '../components/TaskItem';
import CalendarView from '../components/CalendarView';
import { useAuth } from '../context/AuthContext';
import { ListIcon, CalendarIcon, SparkleIcon, FolderIcon } from '../components/icons';
import api from '../utils/api';
import { sortTasks, toDateKey, getToday, startOfMonth } from '../utils/tasks';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

const STAT_CARDS = [
  { key: 'total', label: 'Total', accent: 'text-slate-900' },
  { key: 'pending', label: 'Pending', accent: 'text-indigo-600' },
  { key: 'completed', label: 'Done', accent: 'text-emerald-600' },
  { key: 'highPriority', label: 'High priority', accent: 'text-rose-600' },
];

const LIST_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'done', label: 'Done' },
];

const RING_CIRCUMFERENCE = 2 * Math.PI * 15.5;

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'analytics'
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null); // ID or null
  
  // Category input state
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#4f46e5');
  const [showAddCat, setShowAddCat] = useState(false);

  // Filtering & loading
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [view, setView] = useState('list');
  const [listFilter, setListFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(getToday);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [modalDate, setModalDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Analytics states
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/tasks');
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch analytics
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const { data } = await api.get('/dashboard/stats');
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchTasks();
      fetchCategories();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchTasks]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.done).length;
    return {
      total,
      completed,
      pending: total - completed,
      highPriority: tasks.filter((t) => !t.done && t.priority === 'high').length,
    };
  }, [tasks]);

  const completion = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  const tasksByDate = useMemo(() => {
    const map = new Map();
    for (const task of tasks) {
      const key = toDateKey(task.task_date);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(task);
    }
    return map;
  }, [tasks]);

  // Filter tasks locally by Category selection & search/status
  const visibleList = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = tasks.filter((task) => {
      if (selectedCategory !== null && task.category_id !== selectedCategory) return false;
      if (listFilter === 'pending' && task.done) return false;
      if (listFilter === 'done' && !task.done) return false;
      if (term) {
        const haystack = `${task.title} ${task.description} ${task.location}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
    return sortTasks(filtered);
  }, [tasks, selectedCategory, listFilter, search]);

  const openCreate = (date = '') => {
    setEditingTask(null);
    setModalDate(date || (view === 'calendar' ? selectedDate : ''));
    setModalError('');
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setModalDate('');
    setModalError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingTask(null);
    setModalError('');
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api.post('/categories', { name: newCatName.trim(), color: newCatColor });
      setNewCatName('');
      setShowAddCat(false);
      await fetchCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (catId, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Delete category? Tasks inside this category will become unassigned.')) return;
    try {
      await api.delete(`/categories/${catId}`);
      if (selectedCategory === catId) setSelectedCategory(null);
      await fetchCategories();
      await fetchTasks();
      if (activeTab === 'analytics') fetchAnalytics();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete category');
    }
  };

  const submitTask = async (payload) => {
    if (!payload.title) {
      setModalError('Task title is required.');
      return;
    }
    setSaving(true);
    setModalError('');
    try {
      if (editingTask) {
        await api.patch(`/tasks/${editingTask.id}`, payload);
        setNotice('Task updated.');
      } else {
        await api.post('/tasks', payload);
        setNotice('Task created.');
      }
      setModalOpen(false);
      setEditingTask(null);
      await fetchTasks();
      if (activeTab === 'analytics') fetchAnalytics();
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to save task.');
    } finally {
      setSaving(false);
    }
  };

  const toggleDone = async (task) => {
    setError('');
    const next = !task.done;
    setTasks((current) => current.map((t) => (t.id === task.id ? { ...t, done: next } : t)));
    try {
      await api.patch(`/tasks/${task.id}`, { done: next });
      if (activeTab === 'analytics') fetchAnalytics();
    } catch (err) {
      setTasks((current) => current.map((t) => (t.id === task.id ? { ...t, done: task.done } : t)));
      setError(err.response?.data?.error || 'Failed to update task status.');
    }
  };

  const deleteTask = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setError('');
    try {
      await api.delete(`/tasks/${task.id}`);
      setTasks((current) => current.filter((t) => t.id !== task.id));
      setNotice('Task deleted.');
      if (activeTab === 'analytics') fetchAnalytics();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete task.');
    }
  };

  const changeMonth = (delta) => {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const goToday = () => {
    const today = new Date();
    setMonthDate(startOfMonth(today));
    setSelectedDate(toDateKey(today));
  };

  return (
    <Layout>
      <div className="space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'tasks'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'analytics'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Analytics Dashboard
          </button>
        </div>

        {/* Tab 1: Tasks */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Header */}
            <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">{greeting()},</p>
                  <h2 className="mt-0.5 truncate text-2xl font-semibold tracking-tight text-slate-900">
                    {user?.name || 'there'}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {stats.pending > 0
                      ? `You have ${stats.pending} pending task${stats.pending > 1 ? 's' : ''}. Let's get them done.`
                      : 'Everything is wrapped up. Enjoy your day!'}
                  </p>
                </div>

                {/* Completion ring */}
                <div className="flex shrink-0 items-center gap-3 sm:gap-4">
                  <div className="relative h-20 w-20">
                    <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100" />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="text-indigo-600 transition-all duration-500"
                        strokeDasharray={RING_CIRCUMFERENCE}
                        strokeDashoffset={RING_CIRCUMFERENCE * (1 - completion / 100)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-slate-900">{completion}%</span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-slate-900">Completion</p>
                    <p className="mt-0.5 text-slate-500">
                      {stats.completed} of {stats.total} done
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 sm:grid-cols-4">
                {STAT_CARDS.map((card) => (
                  <div key={card.key} className="px-5 py-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{card.label}</p>
                    <p className={`mt-1 text-2xl font-semibold ${card.accent}`}>{stats[card.key]}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex rounded-2xl bg-slate-100 p-1 text-sm font-medium text-slate-600">
                {['list', 'calendar'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setView(mode)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 capitalize transition ${
                      view === mode ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                    }`}
                  >
                    {mode === 'list' ? <ListIcon className="h-4 w-4" /> : <CalendarIcon className="h-4 w-4" />} {mode}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => openCreate()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
              >
                <span className="text-base leading-none">+</span> New task
              </button>
            </div>

            {/* Alerts */}
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            )}
            {notice && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 animate-fade">
                {notice}
              </div>
            )}

            {/* Content Sidebar + Grid */}
            <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
              
              {/* Categories Sidebar */}
              {view === 'list' && (
                <aside className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Categories</h4>
                      <button
                        onClick={() => setShowAddCat(!showAddCat)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        {showAddCat ? 'Close' : '+ Add'}
                      </button>
                    </div>

                    {showAddCat && (
                      <form onSubmit={handleAddCategory} className="mb-4 space-y-2 border-b border-slate-100 pb-4">
                        <input
                          type="text"
                          placeholder="Category name..."
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <label className="text-[10px] text-slate-500 font-medium">Color:</label>
                            <input
                              type="color"
                              value={newCatColor}
                              onChange={(e) => setNewCatColor(e.target.value)}
                              className="w-8 h-6 border-0 bg-transparent cursor-pointer rounded"
                            />
                          </div>
                          <button
                            type="submit"
                            className="bg-indigo-600 text-white rounded-lg px-3 py-1 text-[10px] font-semibold hover:bg-indigo-700"
                          >
                            Save
                          </button>
                        </div>
                      </form>
                    )}

                    <nav className="space-y-1">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                          selectedCategory === null ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-1.5"><FolderIcon className="h-3.5 w-3.5" /> All Categories</span>
                        <span className="bg-slate-200/50 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
                          {tasks.length}
                        </span>
                      </button>

                      {categories.map((cat) => {
                        const count = tasks.filter((t) => t.category_id === cat.id).length;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                              selectedCategory === cat.id ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                              <span className="truncate max-w-[110px]">{cat.name}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="bg-slate-200/50 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
                                {count}
                              </span>
                              <span
                                onClick={(e) => handleDeleteCategory(cat.id, e)}
                                className="text-red-400 hover:text-red-600 text-[10px] cursor-pointer"
                              >
                                ✕
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </aside>
              )}

              {/* Main List/Calendar Panel */}
              <div className={view === 'list' ? '' : 'lg:col-span-2'}>
                {loading ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
                    ))}
                  </div>
                ) : view === 'calendar' ? (
                  <CalendarView
                    monthDate={monthDate}
                    tasksByDate={tasksByDate}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    onPrevMonth={() => changeMonth(-1)}
                    onNextMonth={() => changeMonth(1)}
                    onToday={goToday}
                    onNewTask={openCreate}
                    onToggle={toggleDone}
                    onEdit={openEdit}
                    onDelete={deleteTask}
                  />
                ) : (
                  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex rounded-xl bg-slate-100 p-1 text-sm font-medium text-slate-600">
                        {LIST_FILTERS.map((filter) => (
                          <button
                            key={filter.key}
                            type="button"
                            onClick={() => setListFilter(filter.key)}
                            className={`rounded-lg px-3.5 py-1.5 transition ${
                              listFilter === filter.key ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                            }`}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>

                      <div className="relative sm:w-64">
                        <svg
                          viewBox="0 0 24 24"
                          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="11" cy="11" r="7" />
                          <path strokeLinecap="round" d="m20 20-3-3" />
                        </svg>
                        <input
                          type="search"
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Search tasks…"
                          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                        />
                      </div>
                    </div>

                    {visibleList.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-500 shadow-sm">
                          <SparkleIcon className="h-7 w-7" />
                        </div>
                        <h4 className="text-base font-semibold text-slate-900">
                          {search || listFilter !== 'all' ? 'No matching tasks' : 'No tasks yet'}
                        </h4>
                        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                          {search || listFilter !== 'all'
                            ? 'Try a different filter or search term.'
                            : 'Create your first task to get started.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => openCreate()}
                          className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                          + New task
                        </button>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {visibleList.map((task) => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            onToggle={toggleDone}
                            onEdit={openEdit}
                            onDelete={deleteTask}
                            categories={categories}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </div>

            </div>

          </div>
        )}

        {/* Tab 2: Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Productivity Analytics</h1>
                <p className="text-slate-500 text-xs">Review performance across all tasks.</p>
              </div>
              <button
                onClick={fetchAnalytics}
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-indigo-700 shadow-sm transition"
              >
                Refresh Stats
              </button>
            </div>

            {analyticsLoading || !analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Tasks</span>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{analytics.stats.total}</h3>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Completed</span>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{analytics.stats.completed}</h3>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Pending</span>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{analytics.stats.pending}</h3>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Completion Rate</span>
                    <h3 className="text-2xl font-bold text-indigo-600 mt-1">{analytics.stats.completionRate}%</h3>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Daily Chart (SVG height styling based on task completed count) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm lg:col-span-2">
                    <h3 className="font-bold text-xs text-slate-800 mb-6">Daily Completion (Last 7 Days)</h3>
                    
                    <div className="flex justify-between items-end h-48 px-4 border-b border-slate-100 pb-3">
                      {analytics.daily.map((day, idx) => {
                        const maxVal = Math.max(...analytics.daily.map(d => d.completed), 1);
                        const height = Math.round((day.completed / maxVal) * 120);

                        return (
                          <div key={idx} className="flex flex-col items-center gap-2 w-10">
                            <div className="text-[10px] font-bold text-slate-700">{day.completed}</div>
                            <div
                              className="w-6 bg-indigo-600 hover:bg-indigo-700 rounded-t transition-all cursor-pointer"
                              style={{ height: `${height}px` }}
                              title={`${day.completed}/${day.total} tasks completed`}
                            ></div>
                            <span className="text-[10px] text-slate-400 font-semibold">{day.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold text-xs text-slate-800 mb-4">Tasks by Category</h3>
                    {analytics.categories.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">No categories with tasks yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {analytics.categories.map((cat) => {
                          const rate = cat.total > 0 ? Math.round((cat.completed * 100) / cat.total) : 0;
                          return (
                            <div key={cat.id}>
                              <div className="flex justify-between text-[11px] mb-1">
                                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                                  {cat.name}
                                </span>
                                <span className="text-slate-500 font-medium">
                                  {cat.completed}/{cat.total} completed ({rate}%)
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${rate}%`, backgroundColor: cat.color }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}
          </div>
        )}

      </div>

      <TaskModal
        open={modalOpen}
        task={editingTask}
        defaultDate={modalDate}
        saving={saving}
        error={modalError}
        onClose={closeModal}
        onSubmit={submitTask}
        categories={categories}
      />
    </Layout>
  );
}
