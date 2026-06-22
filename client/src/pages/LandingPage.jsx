import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckIcon, CalendarIcon, ListIcon, ShieldIcon } from '../components/icons';

const FEATURES = [
  { icon: ListIcon, title: 'Capture everything', text: 'Jot down tasks with notes, time, and location in seconds.' },
  { icon: CalendarIcon, title: 'Plan by day or month', text: 'Switch between a focused list and a full calendar view.' },
  { icon: ShieldIcon, title: 'Yours alone', text: 'Every task is scoped to your account and kept private.' },
];

// Static rows for the product preview — purely decorative, mirrors the dashboard.
const PREVIEW_TASKS = [
  { title: 'Design review at 10:00', done: true, dot: 'bg-rose-500' },
  { title: 'Write the project proposal', done: false, dot: 'bg-amber-500' },
  { title: 'Sync with the design team', done: false, dot: 'bg-indigo-500' },
  { title: 'Plan next week', done: false, dot: 'bg-emerald-500' },
];

export default function LandingPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  // Already signed in — send them straight to the app.
  if (user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="SmartTodo logo" className="h-9 w-9 rounded-xl shadow-sm" />
          <span className="text-lg font-bold tracking-tight text-slate-900">SmartTodo</span>
        </div>
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <Link
            to="/login"
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero */}
        <section className="relative overflow-hidden py-12 lg:py-20">
          {/* Dot field background */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-0"
            style={{
              backgroundImage: 'radial-gradient(circle, #cbd5e1 1.5px, transparent 2px)',
              backgroundSize: '25px 25px',
              maskImage: 'radial-gradient(ellipse 90% 80% at 50% 45%, black 40%, transparent 85%)',
              WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 50% 45%, black 40%, transparent 85%)',
            }}
          />

          <div className="relative z-10 grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              Simple task management
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Organize your day,{' '}
              <span className="bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                one task at a time.
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-500">
              SmartTodo keeps your agenda tidy. Capture tasks, set priorities, and see what matters across a clean
              list or calendar.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500"
              >
                Get started — it's free
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                I already have an account
              </Link>
            </div>
          </div>

          {/* Product preview */}
          <div className="animate-pop">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Good morning,</p>
                  <p className="text-lg font-semibold text-slate-900">Today</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  67% done
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {PREVIEW_TASKS.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        item.done
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 bg-white text-transparent'
                      }`}
                    >
                      <CheckIcon className="h-3 w-3" />
                    </span>
                    <span
                      className={`flex-1 truncate text-sm ${
                        item.done ? 'text-slate-400 line-through' : 'text-slate-700'
                      }`}
                    >
                      {item.title}
                    </span>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-slate-200 py-12 lg:py-16">
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} SmartTodo</p>
          <div className="flex items-center gap-5">
            <Link to="/login" className="transition hover:text-slate-900">
              Log in
            </Link>
            <Link to="/register" className="transition hover:text-slate-900">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
