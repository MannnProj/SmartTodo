import { useMemo } from 'react';
import TaskItem from './TaskItem';
import { CalendarIcon } from './icons';
import {
  WEEKDAYS,
  buildCalendar,
  monthLabel,
  formatFullDate,
  getToday,
  priority,
  sortTasks,
} from '../utils/tasks';

export default function CalendarView({
  monthDate,
  tasksByDate,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  onNewTask,
  onToggle,
  onEdit,
  onDelete,
}) {
  const cells = useMemo(() => buildCalendar(monthDate), [monthDate]);
  const todayKey = getToday();
  const dayTasks = sortTasks(tasksByDate.get(selectedDate) || []);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{monthLabel(monthDate)}</h3>
            <button
              type="button"
              onClick={onToday}
              className="mt-0.5 text-xs font-medium text-indigo-600 transition hover:text-indigo-700"
            >
              Jump to today
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrevMonth}
              aria-label="Previous month"
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              aria-label="Next month"
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const items = tasksByDate.get(cell.key) || [];
            const isToday = cell.key === todayKey;
            const isSelected = cell.key === selectedDate;
            const pending = items.filter((t) => !t.done).length;

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => onSelectDate(cell.key)}
                className={`flex min-h-[76px] flex-col rounded-xl border p-1.5 text-left transition sm:min-h-[92px] ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200'
                    : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                } ${cell.inMonth ? '' : 'opacity-40'}`}
              >
                <span
                  className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    isToday ? 'bg-indigo-600 text-white' : 'text-slate-600'
                  }`}
                >
                  {cell.date.getDate()}
                </span>

                <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                  {items.slice(0, 2).map((task) => (
                    <span
                      key={task.id}
                      className={`flex items-center gap-1 truncate rounded-md px-1 py-0.5 text-[10px] font-medium leading-tight ${
                        task.done ? 'text-slate-400 line-through' : 'text-slate-600'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${priority(task.priority).dot}`} />
                      <span className="truncate">{task.title}</span>
                    </span>
                  ))}
                  {items.length > 2 && (
                    <span className="px-1 text-[10px] font-semibold text-indigo-500">+{items.length - 2} more</span>
                  )}
                </div>

                {pending > 0 && (
                  <span className="mt-auto self-end text-[10px] font-bold text-indigo-500 sm:hidden">{pending}</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Selected day</p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">{formatFullDate(selectedDate)}</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              {dayTasks.length === 0
                ? 'Nothing scheduled'
                : `${dayTasks.length} task${dayTasks.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNewTask(selectedDate)}
            className="shrink-0 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
          >
            + Add
          </button>
        </div>

        <div className="-mr-1 flex-1 space-y-2.5 overflow-y-auto pr-1">
          {dayTasks.length === 0 ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-slate-600">No tasks on this day</p>
              <p className="mt-1 text-xs text-slate-400">Tap “Add” to plan something.</p>
            </div>
          ) : (
            dayTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                showDate={false}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
