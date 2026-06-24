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
    <div className="min-h-screen bg-dark-900">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="border-b border-white/5 bg-dark-800/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">TR</div>
            <div>
              <h1 className="text-lg font-bold gradient-text">Transaction Ranking System</h1>
              <p className="text-xs text-slate-500">FastAPI · PostgreSQL · Redis · Docker</p>
            </div>
          </div>
          <a href="/docs" target="_blank" rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-purple-400 transition-colors bg-dark-700 px-3 py-1.5 rounded-lg border border-white/5 hover:border-purple-500/30">
            API Docs ↗
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TransactionForm users={users} onSuccess={showToast} />
          <UserSummary users={users} refreshTrigger={refreshTrigger} />
          <RankingTable refreshTrigger={refreshTrigger} />
        </div>

        <div className="mt-10 glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-3">How It Works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-slate-400">
            {[
              { color: 'purple', title: 'Idempotency', desc: 'Unique key per transaction. Duplicates return cached response.' },
              { color: 'blue', title: 'Concurrency', desc: 'PostgreSQL row-level locking (SELECT FOR UPDATE) prevents races.' },
              { color: 'cyan', title: 'Rate Limiting', desc: 'Redis sliding window: 10 transactions per user per minute.' },
              { color: 'emerald', title: 'Fair Ranking', desc: 'Multi-factor: 40% balance + 35% count + 25% avg value.' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-2">
                <span className={`text-${item.color}-400 mt-0.5`}>●</span>
                <div>
                  <p className="font-medium text-slate-300">{item.title}</p>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 mt-auto py-6">
        <p className="text-center text-xs text-slate-600">
          Built with FastAPI · PostgreSQL · Redis · React · Tailwind CSS · Docker
        </p>
      </footer>
    </div>
  );
}

export default App;
