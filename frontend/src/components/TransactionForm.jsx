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
    <div className="panel p-6 animate-fade-in">
      <div className="mb-5 pb-4 border-b border-slate-800/50">
        <h2 className="section-title">New Transaction</h2>
        <p className="section-subtitle">Record an earning or expenditure</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">User Account</label>
          <select id="user-select" value={userId} onChange={(e) => setUserId(e.target.value)} className="input-field">
            <option value="">Select an account...</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">Transaction Type</label>
          <div className="flex gap-2 bg-slate-900 p-1 rounded-md border border-slate-800">
            {['earn', 'spend'].map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-all ${
                  type === t
                    ? t === 'earn' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}>
                {t === 'earn' ? 'Credit (Earn)' : 'Debit (Spend)'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">Amount (USD)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
            <input id="amount-input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00" min="0.01" max="10000" step="0.01" className="input-field pl-7 metric-value" />
          </div>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">Limit: $10,000.00</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">Reference Note</label>
          <input id="description-input" type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional reference details" maxLength={255} className="input-field" />
        </div>

        <button id="submit-transaction" type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </span>
          ) : `Execute ${type === 'earn' ? 'Credit' : 'Debit'}`}
        </button>
      </form>
    </div>
  );
}

export default TransactionForm;
