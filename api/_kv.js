const KV = () => process.env.KV_REST_API_URL;
const KVT = () => process.env.KV_REST_API_TOKEN;

async function kvGet(key) {
  if (!KV() || !KVT()) return null;
  const r = await fetch(`${KV()}/get/${key}`, { headers: { Authorization: `Bearer ${KVT()}` } });
  const d = await r.json();
  if (d.result == null) return null;
  if (typeof d.result === 'string') { try { return JSON.parse(d.result); } catch { return d.result; } }
  return d.result;
}

async function kvSet(key, val) {
  if (!KV() || !KVT()) return;
  await fetch(`${KV()}/set/${key}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KVT()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(JSON.stringify(val))
  });
}

module.exports = { kvGet, kvSet };
