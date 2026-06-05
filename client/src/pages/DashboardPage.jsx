import { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const emptyForm = {
  title: '',
  description: '',
  task_date: '',
  task_time: '',
  location: '',
  priority: 'medium',
};

const priorityStyles = {
  high: 'bg-red-50 text-red-700 ring-red-200',
  medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  low: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

const priorityLabels = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

function normalizeTime(value) {
  if (!value) return '';
  return value.slice(0, 5);
}

function formatDate(value) {
  if (!value) return 'No date';

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filterMode, setFilterMode] = useState('all');
  const [selectedDate, setSelectedDate] = useState(getToday);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.done).length;
    const pending = total - completed;
    const highPriority = tasks.filter((task) => !task.done && task.priority === 'high').length;

    return { total, completed, pending, highPriority };
  }, [tasks]);

  const filterLabel = useMemo(() => {
    if (filterMode === 'date') return `Tasks on ${selectedDate || 'selected date'}`;
    if (filterMode === 'month') return `Tasks in ${selectedMonth || 'selected month'}`;
    return 'All tasks';
  }, [filterMode, selectedDate, selectedMonth]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {};
      if (filterMode === 'date' && selectedDate) params.date = selectedDate;
      if (filterMode === 'month' && selectedMonth) params.month = selectedMonth;

      const { data } = await api.get('/tasks', { params });
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filterMode, selectedDate, selectedMonth]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchTasks();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchTasks]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const title = form.title.trim();

    if (!title) {
      setError('Task title is required.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    const payload = {
      title,
      description: form.description.trim(),
      task_date: form.task_date || null,
      task_time: form.task_time || null,
      location: form.location.trim(),
      priority: form.priority,
    };

    try {
      if (editingId) {
        await api.patch(`/tasks/${editingId}`, payload);
        setNotice('Task updated.');
      } else {
        await api.post('/tasks', payload);
        setNotice('Task created.');
      }

      resetForm();
      await fetchTasks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save task.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setForm({
      title: task.title || '',
      description: task.description || '',
      task_date: task.task_date || '',
      task_time: normalizeTime(task.task_time),
      location: task.location || '',
      priority: task.priority || 'medium',
    });
    setNotice('Editing task.');
  };

  const toggleDone = async (task) => {
    setError('');
    setNotice('');

    try {
      await api.patch(`/tasks/${task.id}`, { done: !task.done });
      setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, done: !item.done } : item)));
      setNotice(!task.done ? 'Task marked done.' : 'Task marked pending.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update task status.');
    }
  };

  const deleteTask = async (task) => {
    const confirmed = window.confirm(`Delete "${task.title}"?`);
    if (!confirmed) return;

    setError('');
    setNotice('');

    try {
      await api.delete(`/tasks/${task.id}`);
      setTasks((current) => current.filter((item) => item.id !== task.id));
      if (editingId === task.id) resetForm();
      setNotice('Task deleted.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete task.');
    }
  };

  return (
    <Layout title="SmartTodo">
      <div className="space-y-8">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-6 py-8 text-white sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100 ring-1 ring-white/15">
                  Calm daily planning
                </p>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Plan, track, and finish your tasks.</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                  Keep the dashboard focused: create tasks quickly, scan priorities, and mark work done without leaving this page.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[430px]">
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                  <p className="text-xs uppercase tracking-wide text-slate-300">Total</p>
                  <p className="mt-2 text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                  <p className="text-xs uppercase tracking-wide text-slate-300">Pending</p>
                  <p className="mt-2 text-2xl font-bold">{stats.pending}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                  <p className="text-xs uppercase tracking-wide text-slate-300">Done</p>
                  <p className="mt-2 text-2xl font-bold">{stats.completed}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                  <p className="text-xs uppercase tracking-wide text-slate-300">High</p>
                  <p className="mt-2 text-2xl font-bold">{stats.highPriority}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{editingId ? 'Edit task' : 'Create task'}</h3>
                <p className="text-sm text-slate-500">Add clear details so the day is easier to scan.</p>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Cancel
                </button>
              )}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Review deployment notes"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Optional notes or context"
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="task_date" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Date
                  </label>
                  <input
                    id="task_date"
                    name="task_date"
                    type="date"
                    value={form.task_date}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label htmlFor="task_time" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Time
                  </label>
                  <input
                    id="task_time"
                    name="task_time"
                    type="time"
                    value={form.task_time}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="location" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Location
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Home, office, server room..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="priority" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create task'}
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Task list</h3>
                <p className="text-sm text-slate-500">{filterLabel}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="inline-flex rounded-2xl bg-slate-100 p-1 text-sm font-medium text-slate-600">
                  {['all', 'date', 'month'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFilterMode(mode)}
                      className={`rounded-xl px-3 py-2 capitalize transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        filterMode === mode ? 'bg-white text-slate-950 shadow-sm' : 'hover:text-slate-950'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {filterMode === 'date' && (
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                )}

                {filterMode === 'month' && (
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                )}

                <button
                  type="button"
                  onClick={fetchTasks}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Refresh
                </button>
              </div>
            </div>

            {(error || notice) && (
              <div className="mb-4 space-y-2">
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                {notice && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {notice}
                  </div>
                )}
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                  ✨
                </div>
                <h4 className="text-base font-semibold text-slate-950">No tasks here yet</h4>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Create your first task or change the filter to see another date/month.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <article
                    key={task.id}
                    className={`rounded-2xl border p-4 transition hover:border-blue-200 hover:shadow-sm ${
                      task.done ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleDone(task)}
                            aria-label={task.done ? 'Mark task as pending' : 'Mark task as done'}
                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                              task.done
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'border-slate-300 bg-white text-transparent hover:border-emerald-500 hover:text-emerald-500'
                            }`}
                          >
                            ✓
                          </button>

                          <div className="min-w-0">
                            <h4 className={`text-base font-semibold ${task.done ? 'text-slate-400 line-through' : 'text-slate-950'}`}>
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className={`mt-1 text-sm leading-6 ${task.done ? 'text-slate-400' : 'text-slate-600'}`}>
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{formatDate(task.task_date)}</span>
                          {task.task_time && <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{normalizeTime(task.task_time)}</span>}
                          {task.location && <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">📍 {task.location}</span>}
                          <span className={`rounded-full px-3 py-1 ring-1 ${priorityStyles[task.priority] || priorityStyles.medium}`}>
                            {priorityLabels[task.priority] || 'Medium'} priority
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(task)}
                          className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTask(task)}
                          className="rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}
