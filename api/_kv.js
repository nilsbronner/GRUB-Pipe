const SB  = () => process.env.SUPABASE_URL;
const KEY = () => process.env.SUPABASE_SERVICE_KEY;
const h   = () => ({
  Authorization: `Bearer ${KEY()}`,
  apikey: KEY(),
  'Content-Type': 'application/json'
});

async function getInbox() {
  if (!SB()) return [];
  const r = await fetch(`${SB()}/rest/v1/grub_inbox?select=prospect&order=created_at.asc`, { headers: h() });
  const rows = await r.json();
  return Array.isArray(rows) ? rows.map(row => row.prospect) : [];
}

async function addToInbox(prospect) {
  if (!SB()) return;
  await fetch(`${SB()}/rest/v1/grub_inbox`, {
    method: 'POST',
    headers: { ...h(), Prefer: 'return=minimal' },
    body: JSON.stringify({ id: prospect.id, prospect })
  });
}

async function clearFromInbox(ids) {
  if (!SB() || !ids?.length) return;
  await fetch(`${SB()}/rest/v1/grub_inbox?id=in.(${ids.join(',')})`, {
    method: 'DELETE',
    headers: h()
  });
}

async function isProcessed(threadId) {
  if (!SB() || !threadId) return false;
  const r = await fetch(`${SB()}/rest/v1/grub_processed?thread_id=eq.${encodeURIComponent(threadId)}&select=thread_id`, { headers: h() });
  const rows = await r.json();
  return Array.isArray(rows) && rows.length > 0;
}

async function markProcessed(threadId) {
  if (!SB() || !threadId) return;
  await fetch(`${SB()}/rest/v1/grub_processed`, {
    method: 'POST',
    headers: { ...h(), Prefer: 'return=minimal,resolution=ignore-duplicates' },
    body: JSON.stringify({ thread_id: threadId })
  });
}

module.exports = { getInbox, addToInbox, clearFromInbox, isProcessed, markProcessed };
