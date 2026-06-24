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
    rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-badge';

  return (
    <div className="panel p-6 animate-fade-in flex flex-col">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800/50">
        <div>
          <h2 className="section-title">Global Leaderboard</h2>
          <p className="section-subtitle">Real-time risk algorithm scoring</p>
        </div>
        {ranking?.cachedAt && (
          <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
            Cached: {ranking.cacheTtlSeconds}s
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 flex-1">
          <svg className="animate-spin h-5 w-5 text-brand-blue" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {error && (
        <div className="text-center py-8 flex-1">
          <p className="text-red-400 text-xs">{error}</p>
          <button onClick={loadRanking} className="mt-3 text-[10px] uppercase tracking-wider text-brand-blue hover:text-brand-blue-hover underline">Retry connection</button>
        </div>
      )}

      {ranking && !loading && (
        <div className="flex-1 flex flex-col">
          <div className="space-y-2 flex-1">
            {ranking.rankings.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-md">
                <p className="text-xs text-slate-500">No telemetry data available</p>
              </div>
            ) : (
              ranking.rankings.map((entry) => (
                <div key={entry.userId} className="flex items-center gap-4 p-3 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className={`w-8 h-8 rounded flex items-center justify-center text-[11px] font-bold shrink-0 ${badgeClass(entry.rank)}`}>
                    #{entry.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-slate-200 truncate">{entry.name}</p>
                      <p className="text-xs font-semibold text-brand-blue metric-value">{entry.score.toFixed(1)}</p>
                    </div>
                    <div className="score-bar">
                      <div className="score-bar-fill" style={{ width: `${entry.score}%` }} />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] uppercase tracking-wide text-slate-500 metric-value">
                      <span>Bal: ${entry.netBalance.toFixed(0)}</span>
                      <span>Vol: {entry.transactionCount}</span>
                      <span>Avg: ${entry.avgTransactionValue.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/50">
            <p className="text-[10px] text-slate-500 flex justify-between">
              <span>ALGORITHM WEIGHTS:</span>
              <span className="font-mono text-slate-400">40% BAL · 35% VOL · 25% AVG</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default RankingTable;
