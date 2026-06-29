import { priority, formatDate, formatTime } from '../utils/tasks';
import { CheckIcon, CalendarIcon, ClockIcon, MapPinIcon, RepeatIcon } from './icons';

export default function TaskItem({ task, onToggle, onEdit, onDelete, showDate = true, categories = [] }) {
  const p = priority(task.priority);
  const matchedCat = categories.find((c) => c.id === task.category_id);
  const repeatLabels = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
  };

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border bg-white p-4 transition hover:border-indigo-200 hover:shadow-md hover:shadow-slate-200/60 ${
        task.done ? 'border-slate-200 bg-slate-50/70' : 'border-slate-200'
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${task.done ? 'bg-slate-200' : p.bar}`} />

      <div className="flex items-start gap-3 pl-2">
        <button
          type="button"
          onClick={() => onToggle(task)}
          aria-label={task.done ? 'Mark as pending' : 'Mark as done'}
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            task.done
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-slate-300 bg-white text-transparent hover:border-emerald-500 hover:text-emerald-500'
          }`}
        >
          <CheckIcon className="h-3.5 w-3.5" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`truncate text-sm font-semibold ${task.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
              {task.title}
            </h4>

            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Edit task"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onDelete(task)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                aria-label="Delete task"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V5h6v2m-8 0 1 13h8l1-13" />
                </svg>
              </button>
            </div>
          </div>

          {task.description && (
            <p className={`mt-1 line-clamp-2 text-sm leading-6 ${task.done ? 'text-slate-400' : 'text-slate-600'}`}>
              {task.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs font-medium">
            {showDate && task.task_date && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                <CalendarIcon className="h-3.5 w-3.5" /> {formatDate(task.task_date)}
              </span>
            )}
            {task.task_time && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                <ClockIcon className="h-3.5 w-3.5" /> {formatTime(task.task_time)}
              </span>
            )}
            {task.location && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                <MapPinIcon className="h-3.5 w-3.5" /> {task.location}
              </span>
            )}
            {matchedCat && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-white font-semibold"
                style={{ backgroundColor: matchedCat.color }}
              >
                {matchedCat.name}
              </span>
            )}
            {task.repeat_type !== 'none' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1">
                <RepeatIcon className="h-3 w-3" /> {repeatLabels[task.repeat_type] || 'Recurring'}
              </span>
            )}
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ring-1 ${p.chip}`}>
              {p.label}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
