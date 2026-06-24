import { useState, useEffect } from 'react';
import { fetchSummary } from '../api';

function UserSummary({ users, refreshTrigger }) {
  const [selectedUser, setSelectedUser] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedUser) loadSummary(selectedUser);
  }, [selectedUser, refreshTrigger]);

  async function loadSummary(userId) {
    setLoading(true);
    setError(null);
    try {
      setSummary(await fetchSummary(userId));
    } catch (err) {
      setError(err.message);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'No transactions yet';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  const statCards = summary ? [
    { label: 'Total Credited', value: `$${summary.totalEarned.toFixed(2)}`, valueColor: 'text-emerald-400' },
    { label: 'Total Debited', value: `$${summary.totalSpent.toFixed(2)}`, valueColor: 'text-red-400' },
    { label: 'Net Balance', value: `$${summary.netBalance.toFixed(2)}`, valueColor: 'text-white' },
    { label: 'Volume (Count)', value: summary.transactionCount, valueColor: 'text-slate-300' },
  ] : [];

  return (
    <div className="panel p-6 animate-fade-in">
      <div className="mb-5 pb-4 border-b border-slate-800/50">
        <h2 className="section-title">Account Summary</h2>
        <p className="section-subtitle">Real-time aggregate financial metrics</p>
      </div>

      <select id="summary-user-select" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="input-field mb-5">
        <option value="">Select an account...</option>
        {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
      </select>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-5 w-5 text-brand-blue" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {error && <p className="text-center text-red-400 text-xs py-8">{error}</p>}

      {summary && !loading && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h3 className="text-sm font-semibold text-white">{summary.name}</h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{summary.userId}</p>
          </div>

          <div className="grid grid-cols-2 gap-px bg-slate-800 border border-slate-700 rounded-md overflow-hidden">
            {statCards.map((card) => (
              <div key={card.label} className="bg-slate-900 p-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">{card.label}</p>
                <p className={`text-sm font-medium metric-value ${card.valueColor}`}>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800/50">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Last activity: <span className="font-mono ml-1">{formatDate(summary.lastTransactionAt)}</span>
            </p>
          </div>
        </div>
      )}

      {!selectedUser && !loading && (
        <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-md">
          <p className="text-xs text-slate-500">No account selected</p>
        </div>
      )}
    </div>
  );
}

export default UserSummary;
