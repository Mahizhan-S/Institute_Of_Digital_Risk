import { useState, useEffect } from 'react';
import { fetchRanking } from '../api';

function RankingTable({ refreshTrigger }) {
  const [ranking, setRanking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadRanking(); }, [refreshTrigger]);
  useEffect(() => {
    const interval = setInterval(loadRanking, 15000);
    return () => clearInterval(interval);
  }, []);

  async function loadRanking() {
    try {
      setRanking(await fetchRanking());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const badgeClass = (rank) =>
    rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'bg-dark-600 text-slate-400';

  const badgeLabel = (rank) =>
    rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-lg">🏆</div>
          <div>
            <h2 className="text-lg font-semibold text-white">Ranking</h2>
            <p className="text-sm text-slate-400">Multi-factor leaderboard</p>
          </div>
        </div>
        {ranking?.cachedAt && (
          <span className="text-xs text-slate-500 bg-dark-700 px-2 py-1 rounded-md">Cached {ranking.cacheTtlSeconds}s</span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-6 w-6 text-purple-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={loadRanking} className="mt-2 text-xs text-purple-400 hover:text-purple-300 underline">Try again</button>
        </div>
      )}

      {ranking && !loading && (
        <div className="space-y-3">
          {ranking.rankings.length === 0 ? (
            <p className="text-center text-slate-500 py-8 text-sm">No rankings yet. Create some transactions first!</p>
          ) : (
            ranking.rankings.map((entry) => (
              <div key={entry.userId} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.03] transition-all">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${badgeClass(entry.rank)}`}>
                  {badgeLabel(entry.rank)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-white truncate">{entry.name}</p>
                    <p className="text-sm font-bold text-purple-400 ml-2">{entry.score.toFixed(1)}</p>
                  </div>
                  <div className="score-bar">
                    <div className="score-bar-fill" style={{ width: `${entry.score}%` }} />
                  </div>
                  <div className="flex gap-4 mt-1.5 text-xs text-slate-500">
                    <span>Balance: ${entry.netBalance.toFixed(0)}</span>
                    <span>Txns: {entry.transactionCount}</span>
                    <span>Avg: ${entry.avgTransactionValue.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            ))
          )}

          <div className="mt-4 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
            <p className="text-xs text-slate-400">
              <span className="text-purple-400 font-medium">Score: </span>
              40% Balance + 35% Count + 25% Avg Value (normalized 0–100)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default RankingTable;
