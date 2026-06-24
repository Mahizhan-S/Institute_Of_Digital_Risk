import { useState } from 'react';
import { createTransaction, generateIdempotencyKey } from '../api';

function TransactionForm({ users, onSuccess }) {
  const [userId, setUserId] = useState('');
  const [type, setType] = useState('earn');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!userId) return onSuccess('Please select a user', 'error');
    if (!amount || parseFloat(amount) <= 0) return onSuccess('Enter a valid amount', 'error');
    if (parseFloat(amount) > 10000) return onSuccess('Amount cannot exceed $10,000', 'error');

    setLoading(true);
    try {
      const result = await createTransaction({
        userId,
        type,
        amount: parseFloat(amount),
        description: description || undefined,
        idempotencyKey: generateIdempotencyKey(),
      });

      onSuccess(
        result.isDuplicate
          ? 'Duplicate request — no new transaction created'
          : `Transaction created! ${type === 'earn' ? '+' : '-'}$${parseFloat(amount).toFixed(2)}`,
        result.isDuplicate ? 'warning' : 'success'
      );
      setAmount('');
      setDescription('');
    } catch (error) {
      onSuccess(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-lg">💸</div>
        <div>
          <h2 className="text-lg font-semibold text-white">New Transaction</h2>
          <p className="text-sm text-slate-400">Create an earn or spend transaction</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">User</label>
          <select id="user-select" value={userId} onChange={(e) => setUserId(e.target.value)} className="input-field">
            <option value="">Select a user...</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Type</label>
          <div className="flex gap-2">
            {['earn', 'spend'].map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  type === t
                    ? t === 'earn' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-dark-700 text-slate-400 border border-transparent hover:bg-dark-600'
                }`}>
                {t === 'earn' ? '↑ Earn' : '↓ Spend'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Amount ($)</label>
          <input id="amount-input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00" min="0.01" max="10000" step="0.01" className="input-field" />
          <p className="text-xs text-slate-500 mt-1">Max $10,000 per transaction</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Description (optional)</label>
          <input id="description-input" type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this transaction for?" maxLength={255} className="input-field" />
        </div>

        <button id="submit-transaction" type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </span>
          ) : `Create ${type === 'earn' ? 'Earn' : 'Spend'} Transaction`}
        </button>
      </form>
    </div>
  );
}

export default TransactionForm;
