import { useState, useEffect } from 'react';
import { fetchUsers } from './api';
import TransactionForm from './components/TransactionForm';
import UserSummary from './components/UserSummary';
import RankingTable from './components/RankingTable';
import Toast from './components/Toast';

function App() {
  const [users, setUsers] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(() => showToast('Failed to load users. Is the backend running?', 'error'));
  }, []);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    if (type === 'success') setRefreshTrigger((n) => n + 1);
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Enterprise Header */}
      <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded bg-brand-blue flex items-center justify-center text-white font-bold text-xs tracking-wider">
              IDR
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-100 tracking-tight">Institute of Digital Risk</h1>
              <p className="text-xs text-slate-400">Transaction & Ranking Dashboard</p>
            </div>
          </div>
          <a href="/docs" target="_blank" rel="noopener noreferrer"
            className="text-xs font-medium text-slate-300 hover:text-white transition-colors bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700 hover:border-slate-600 shadow-sm">
            API Documentation
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TransactionForm users={users} onSuccess={showToast} />
          <UserSummary users={users} refreshTrigger={refreshTrigger} />
          <RankingTable refreshTrigger={refreshTrigger} />
        </div>

        {/* Technical Architecture Details */}
        <div className="mt-8 panel p-6">
          <h3 className="section-title mb-4">System Architecture & Safeguards</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-slate-400">
            <div>
              <p className="font-semibold text-slate-200 mb-1">Idempotency Guard</p>
              <p className="leading-relaxed">Requests require a unique idempotency key. Duplicates are intercepted via Redis (24h TTL) to prevent double-processing.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-200 mb-1">Concurrency Control</p>
              <p className="leading-relaxed">PostgreSQL utilizes row-level locking (SELECT ... FOR UPDATE) to strictly serialize concurrent requests per user.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-200 mb-1">Rate Limiting</p>
              <p className="leading-relaxed">Redis sliding window implementation restricts traffic to 10 requests per user per minute to mitigate abuse.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-200 mb-1">Algorithmic Ranking</p>
              <p className="leading-relaxed">Multi-factor normalization: 40% Net Balance, 35% Transaction Count, and 25% Average Transaction Value.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} Institute of Digital Risk. All rights reserved.</p>
          <p className="font-mono">SYS_READY · v1.0.0</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
