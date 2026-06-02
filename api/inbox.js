const { getInbox, clearFromInbox } = require('./_kv');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const inbox = await getInbox();
    return res.json({ inbox });
  }

  if (req.method === 'DELETE') {
    const { ids } = req.body || {};
    await clearFromInbox(ids);
    return res.json({ ok: true });
  }

  res.status(405).end();
};
