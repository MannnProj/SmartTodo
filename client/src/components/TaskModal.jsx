import { useEffect, useRef, useState } from 'react';
import { normalizeTime } from '../utils/tasks';

const emptyForm = {
  title: '',
  description: '',
  task_date: '',
  task_time: '',
  location: '',
  priority: 'medium',
};

const priorityOptions = [
  { value: 'high', label: 'High', active: 'border-rose-500 bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
  { value: 'medium', label: 'Medium', active: 'border-amber-500 bg-amber-50 text-amber-700', dot: 'bg-amber-400' },
  { value: 'low', label: 'Low', active: 'border-emerald-500 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
];

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100';

export default function TaskModal({ open, task, defaultDate, saving, error, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const titleRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => {
      if (task) {
        setForm({
          title: task.title || '',
          description: task.description || '',
          task_date: task.task_date ? task.task_date.slice(0, 10) : '',
          task_time: normalizeTime(task.task_time),
          location: task.location || '',
          priority: task.priority || 'medium',
        });
      } else {
        setForm({ ...emptyForm, task_date: defaultDate || '' });
      }
      titleRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open, task, defaultDate]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const change = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      task_date: form.task_date || null,
      task_time: form.task_time || null,
      location: form.location.trim(),
      priority: form.priority,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade"
      />

      <div className="relative z-10 w-full max-w-lg animate-pop rounded-t-3xl bg-white shadow-2xl shadow-slate-900/20 sm:rounded-3xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{task ? 'Edit task' : 'New task'}</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              {task ? 'Update the details below.' : 'Add the details to plan your day.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 -mt-1 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-slate-700">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              ref={titleRef}
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={change}
              placeholder="Review deployment notes"
              className={fieldClass}
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
              onChange={change}
              rows="3"
              placeholder="Optional notes or context"
              className={`${fieldClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task_date" className="mb-1.5 block text-sm font-medium text-slate-700">
                Date
              </label>
              <input id="task_date" name="task_date" type="date" value={form.task_date} onChange={change} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="task_time" className="mb-1.5 block text-sm font-medium text-slate-700">
                Time
              </label>
              <input id="task_time" name="task_time" type="time" value={form.task_time} onChange={change} className={fieldClass} />
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
              onChange={change}
              placeholder="Home, office, server room..."
              className={fieldClass}
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Priority</span>
            <div className="grid grid-cols-3 gap-2">
              {priorityOptions.map((option) => {
                const selected = form.priority === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, priority: option.value }))}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      selected ? option.active : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${option.dot}`} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {saving ? 'Saving…' : task ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
