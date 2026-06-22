import { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import TaskModal from '../components/TaskModal';
import TaskItem from '../components/TaskItem';
import CalendarView from '../components/CalendarView';
import { useAuth } from '../context/AuthContext';
import { ListIcon, CalendarIcon, SparkleIcon } from '../components/icons';
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

// Circumference of the completion ring (r = 15.5 in a 36x36 viewBox).
const RING_CIRCUMFERENCE = 2 * Math.PI * 15.5;

export default function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [view, setView] = useState('list');
  const [listFilter, setListFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(getToday);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [modalDate, setModalDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

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

  useEffect(() => {
    const timer = window.setTimeout(() => fetchTasks(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchTasks]);

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

  const visibleList = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = tasks.filter((task) => {
      if (listFilter === 'pending' && task.done) return false;
      if (listFilter === 'done' && !task.done) return false;
      if (term) {
        const haystack = `${task.title} ${task.description} ${task.location}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
    return sortTasks(filtered);
  }, [tasks, listFilter, search]);

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

        {/* Views */}
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
                  <TaskItem key={task.id} task={task} onToggle={toggleDone} onEdit={openEdit} onDelete={deleteTask} />
                ))}
              </div>
            )}
          </section>
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
      />
    </Layout>
  );
}
