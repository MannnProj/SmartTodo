import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Layout({ children, title = 'SmartTodo' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/favicon.svg" alt="SmartTodo logo" className="h-9 w-9 rounded-xl shadow-sm" />
              <h1 className="text-lg font-bold tracking-tight text-slate-900">{title}</h1>
            </div>

            {user && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-semibold text-white">
                    {user.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span className="hidden text-sm font-medium text-slate-700 sm:block">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
