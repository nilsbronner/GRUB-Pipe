const { kvGet, kvSet } = require('./_kv');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const inbox = (await kvGet('grub_inbox')) || [];
    return res.json({ inbox });
  }

  if (req.method === 'DELETE') {
    const { ids } = req.body || {};
    if (ids?.length) {
      const inbox = (await kvGet('grub_inbox')) || [];
      await kvSet('grub_inbox', inbox.filter(p => !ids.includes(p.id)));
    }
    return res.json({ ok: true });
  }

  res.status(405).end();
};
