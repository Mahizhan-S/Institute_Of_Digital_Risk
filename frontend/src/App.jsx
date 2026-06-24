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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TransactionForm users={users} onSuccess={showToast} />
          <UserSummary users={users} refreshTrigger={refreshTrigger} />
          <RankingTable refreshTrigger={refreshTrigger} />
        </div>
      </main>
    </div>
  );
}

export default App;
