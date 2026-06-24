const API_BASE = '';

async function apiFetch(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.error || `Request failed (${response.status})`);
  }

  return { data, status: response.status };
}

export async function fetchUsers() {
  const { data } = await apiFetch('/api/users');
  return data.users;
}

export async function createTransaction(transactionData) {
  const { data, status } = await apiFetch('/api/transaction', {
    method: 'POST',
    body: JSON.stringify(transactionData),
  });
  return { ...data, isDuplicate: status === 200 };
}

export async function fetchSummary(userId) {
  const { data } = await apiFetch(`/api/summary/${userId}`);
  return data;
}

export async function fetchRanking() {
  const { data } = await apiFetch('/api/ranking');
  return data;
}

export function generateIdempotencyKey() {
  return `txn-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}
