// ═══════════════════════════════════════════════════════════
// GRUB PIPE — Google Apps Script
// 1. Va sur script.google.com → Nouveau projet
// 2. Colle ce code
// 3. Configure les 3 variables ci-dessous
// 4. Clique sur Déclencheurs (horloge) → Ajouter un déclencheur
//    → syncGrubEmails → Basé sur le temps → Toutes les 5 minutes
// ═══════════════════════════════════════════════════════════

const LABEL    = 'Le Grub';                                    // 👈 Nom exact du libellé Gmail
const API_URL  = 'https://TON-PROJET.vercel.app/api/gmail-sync'; // 👈 Ton URL Vercel
const SECRET   = 'TON_SECRET_ICI';                            // 👈 Doit correspondre à SYNC_SECRET dans Vercel

function syncGrubEmails() {
  const label = GmailApp.getUserLabelByName(LABEL);
  if (!label) { Logger.log('Libellé introuvable : ' + LABEL); return; }

  const props   = PropertiesService.getScriptProperties();
  const threads = label.getThreads(0, 20);

  threads.forEach(function(thread) {
    const id = thread.getId();
    if (props.getProperty('sent_' + id)) return; // déjà traité

    const msg = thread.getMessages()[0];
    const payload = {
      threadId: id,
      subject:  msg.getSubject(),
      from:     msg.getFrom(),
      body:     msg.getPlainBody().slice(0, 2000),
      date:     Utilities.formatDate(msg.getDate(), Session.getScriptTimeZone(), 'yyyy-MM-dd')
    };

    try {
      const resp = UrlFetchApp.fetch(API_URL, {
        method:           'post',
        contentType:      'application/json',
        headers:          { 'x-sync-secret': SECRET },
        payload:          JSON.stringify(payload),
        muteHttpExceptions: true
      });

      if (resp.getResponseCode() === 200) {
        props.setProperty('sent_' + id, '1');
        Logger.log('✓ Synced : ' + msg.getSubject());
      } else {
        Logger.log('✗ Erreur ' + resp.getResponseCode() + ' : ' + resp.getContentText());
      }
    } catch(e) {
      Logger.log('Exception : ' + e);
    }
  });
}
