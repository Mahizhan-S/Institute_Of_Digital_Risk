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
    { label: 'Total Earned', value: `$${summary.totalEarned.toFixed(2)}`, color: 'emerald' },
    { label: 'Total Spent', value: `$${summary.totalSpent.toFixed(2)}`, color: 'red' },
    { label: 'Net Balance', value: `$${summary.netBalance.toFixed(2)}`, color: 'purple' },
    { label: 'Transactions', value: summary.transactionCount, color: 'blue' },
  ] : [];

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-lg">📊</div>
        <div>
          <h2 className="text-lg font-semibold text-white">User Summary</h2>
          <p className="text-sm text-slate-400">View a user's transaction stats</p>
        </div>
      </div>

      <select id="summary-user-select" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="input-field mb-5">
        <option value="">Select a user...</option>
        {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
      </select>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-6 w-6 text-purple-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {error && <p className="text-center text-red-400 text-sm py-8">{error}</p>}

      {summary && !loading && (
        <div className="space-y-3 animate-fade-in">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-white">{summary.name}</h3>
            <p className="text-xs text-slate-500">{summary.userId}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {statCards.map((card) => (
              <div key={card.label} className={`bg-${card.color}-500/10 border border-${card.color}-500/20 rounded-xl p-3`}>
                <p className={`text-xs text-${card.color}-400 font-medium mb-1`}>{card.label}</p>
                <p className={`text-xl font-bold text-${card.color}-300`}>{card.value}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-slate-500 pt-2">
            Last transaction: {formatDate(summary.lastTransactionAt)}
          </p>
        </div>
      )}

      {!selectedUser && !loading && (
        <p className="text-center text-slate-500 text-sm py-8">Select a user to view their summary</p>
      )}
    </div>
  );
}

export default UserSummary;
