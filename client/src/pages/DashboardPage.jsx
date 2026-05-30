import Layout from '../components/Layout';

export default function DashboardPage() {
  return (
    <Layout title="SmartTodo">
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SmartTodo!</h2>
        <p className="text-gray-500 mb-8">Your tasks will appear here. Phase 3 coming next! 🚀</p>
        <div className="inline-block bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md">
          <p className="text-gray-400 text-sm">
            You're logged in and ready to go.<br />
            Task management features coming in the next update.
          </p>
        </div>
      </div>
    </Layout>
  );
}
