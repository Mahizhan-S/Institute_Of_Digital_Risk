"""
Multi-factor ranking algorithm.
Score = 40% net_balance + 35% txn_count + 25% avg_txn_value (normalized 0-100).
"""

from typing import List, Dict, Any


def calculate_rankings(summaries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not summaries:
        return []

    if len(summaries) == 1:
        s = summaries[0]
        count = int(s['transaction_count'])
        total = float(s['total_earned']) + float(s['total_spent'])
        return [{
            "rank": 1,
            "userId": s['user_id'],
            "name": s['name'],
            "score": 100.0,
            "netBalance": round(float(s['net_balance']), 2),
            "transactionCount": count,
            "avgTransactionValue": round(total / count if count else 0, 2)
        }]

    balances, counts, avg_values = [], [], []
    for s in summaries:
        count = int(s['transaction_count'])
        total = float(s['total_earned']) + float(s['total_spent'])
        balances.append(float(s['net_balance']))
        counts.append(count)
        avg_values.append(total / count if count else 0)

    rankings = []
    for i, s in enumerate(summaries):
        score = (
            0.40 * _normalize(balances[i], min(balances), max(balances)) +
            0.35 * _normalize(counts[i], min(counts), max(counts)) +
            0.25 * _normalize(avg_values[i], min(avg_values), max(avg_values))
        )
        rankings.append({
            "userId": s['user_id'],
            "name": s['name'],
            "score": round(score, 2),
            "netBalance": round(float(s['net_balance']), 2),
            "transactionCount": int(s['transaction_count']),
            "avgTransactionValue": round(avg_values[i], 2)
        })

    rankings.sort(key=lambda x: x['score'], reverse=True)
    for i, entry in enumerate(rankings):
        entry['rank'] = i + 1

    return rankings


def _normalize(value: float, min_val: float, max_val: float) -> float:
    """Min-max normalization to 0-100 scale."""
    if max_val == min_val:
        return 50.0
    return ((value - min_val) / (max_val - min_val)) * 100.0
