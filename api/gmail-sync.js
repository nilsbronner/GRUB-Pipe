const { getInbox, addToInbox, isProcessed, markProcessed } = require('./_kv');

const handler = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  if (req.headers['x-sync-secret'] !== process.env.SYNC_SECRET)
    return res.status(401).json({ error: 'Non autorisé' });

  const { subject, from, body, date, threadId } = req.body || {};
  if (!subject && !body) return res.status(400).json({ error: 'Contenu manquant' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY manquante' });

  if (threadId && await isProcessed(threadId))
    return res.json({ ok: true, duplicate: true });

  const today = new Date().toISOString().split('T')[0];
  const prompt = `Tu es un assistant pour "Le Grub" à Strasbourg. Analyse cet email et retourne UNIQUEMENT un JSON :
{"pr":"nom entreprise","ct":"contact","cd":"email/tel","sr":"Inbound","fa":"Espaces|Production rapide|Preuve sociale & acquisition","of":"Coworking|Domiciliation|Location de salle|Reportage photo événementiel|Reportage photo + vidéo|Portrait corporate|Vidéo manifeste / institutionnelle|Témoignage client filmé|Podcast / émission packagée|Campagne Ads","mn":"montant chiffres seuls","pb":"50","st":"À contacter","d1":"${date||today}","ac":"Répondre à l'email","da":"${today}","nt":"résumé besoin et contexte"}
JSON uniquement.

De: ${from||''}
Objet: ${subject||''}
Corps:
${(body||'').slice(0, 2000)}`;

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 512, messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }] })
  });
  const d = await r.json();
  const m = (d.content?.[0]?.text || '').match(/\{[\s\S]*\}/);
  if (!m) return res.status(500).json({ error: 'Erreur parsing Claude' });

  const prospect = { ...JSON.parse(m[0]), id: `gmail_${Date.now()}`, ts: Date.now() };

  await addToInbox(prospect);
  if (threadId) await markProcessed(threadId);

  res.json({ ok: true, prospect });
};

handler.config = { api: { bodyParser: { sizeLimit: '1mb' } } };
module.exports = handler;
