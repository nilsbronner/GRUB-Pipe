const handler = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { text, image, mediaType } = req.body || {};
  const key = process.env.ANTHROPIC_API_KEY;

  if (!key) return res.status(500).json({ error: 'ANTHROPIC_API_KEY manquante — ajoute-la dans les variables Vercel' });
  if (!text && !image) return res.status(400).json({ error: 'Aucun contenu fourni' });

  const today = new Date().toISOString().split('T')[0];
  const instructions = `Tu es un assistant commercial pour "Le Grub", espace coworking et studio audiovisuel à Strasbourg (91 Route des Romains, 67200).
Analyse ce document (email, SMS, LinkedIn, WhatsApp, capture d'écran) et retourne UNIQUEMENT un objet JSON valide avec ces champs (string vide "" si inconnu) :
{"pr":"nom entreprise ou prospect","ct":"prénom + nom du contact","cd":"email et/ou téléphone","sr":"une valeur parmi : ARIA Alsace | Agences | Direct / Réseau | Référence | Inbound","fa":"une valeur parmi : Espaces | Production rapide | Preuve sociale & acquisition","of":"une valeur parmi : Coworking | Domiciliation | Location de salle | Reportage photo événementiel | Reportage photo + vidéo | Portrait corporate | Vidéo manifeste / institutionnelle | Témoignage client filmé | Podcast / émission packagée | Campagne Ads","mn":"montant estimé en chiffres seuls ex: 500","pb":"probabilité 0 à 100","st":"une valeur parmi : À contacter | Relancé | Devis envoyé | Négociation | Signé | Perdu","d1":"date premier contact YYYY-MM-DD","ac":"prochaine action commerciale courte","da":"date prochaine action YYYY-MM-DD","nt":"résumé du besoin, du contexte et des contraintes importantes"}
Aujourd'hui : ${today}. Réponds uniquement avec le JSON, rien d'autre.`;

  const content = [];
  if (image) content.push({ type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image } });
  content.push({ type: 'text', text: text ? `${instructions}\n\nContenu à analyser :\n${text}` : instructions });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, messages: [{ role: 'user', content }] })
    });
    const d = await r.json();
    if (!r.ok) return res.status(500).json({ error: d.error?.message || 'Erreur API Anthropic' });
    const raw = d.content?.[0]?.text || '';
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return res.status(500).json({ error: 'Réponse non parseable' });
    return res.json(JSON.parse(m[0]));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

handler.config = { api: { bodyParser: { sizeLimit: '8mb' } } };
module.exports = handler;
