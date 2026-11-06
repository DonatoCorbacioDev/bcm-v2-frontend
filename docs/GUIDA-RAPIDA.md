# BCM — Guida rapida

Le cinque cose che si fanno più spesso, in pochi minuti. Per provarle senza rischi c'è la demo: [bcm.donatocorbacio.dev](https://bcm.donatocorbacio.dev), utente `demo`, password `BcmDemo#2026` (i dati sono inventati e tornano come prima ogni notte).

**Due ruoli.** L'**Amministratore** gestisce tutto: contratti, utenti, impostazioni, conferme e pagamenti. Il **Responsabile** segue i contratti che gli sono assegnati: li vede, carica documenti e fatture, riceve i promemoria. Dove un'azione è solo per l'Amministratore, la guida lo dice.

---

## 1. Ogni mattina: la Home

Apri **Home**. In cima tre numeri (cose da fare nei prossimi 30 giorni, fatture da abbinare, avvisi IBAN), sotto l'elenco **Da fare**, già in ordine di urgenza:

- 🔴 **IBAN cambiato: verifica prima di pagare** — vedi il punto 4
- 📅 **Disdici entro l'11 novembre se non vuoi rinnovarlo** — l'ultimo giorno per disdire un contratto a rinnovo tacito
- ⚠️ **Scade il 17 novembre** — un contratto che finisce
- 🧾 **Fattura da abbinare** — una fattura arrivata, da controllare

Clicca una riga per aprire il contratto giusto. In fondo, **Fatture dei fornitori**: quanto era previsto da inizio anno e quanto ti è stato fatturato davvero.

## 2. Aggiungere un contratto con rinnovo tacito

*Amministratore.* **Contratti → + Nuovo contratto.**

1. Scegli la **controparte** (se non c'è, creala prima in **Controparti**: bastano nome e tipo).
2. **Numero contratto**, **Oggetto** (facoltativo), **data di inizio e di fine**. Se hai una sola area o un solo responsabile, sono già scelti.
3. Nel riquadro **Rinnovo e disdetta** spunta **Si rinnova tacitamente** e scrivi i **giorni di preavviso** e la **durata del rinnovo**, come sono scritti nel contratto.
4. Sotto compare subito l'**ultimo giorno per disdire**. Se è già passato, BCM te lo dice: il contratto si rinnoverà.
5. **Crea contratto.**

Da quel momento BCM ti avvisa 30, 14, 7 e 1 giorno prima dell'ultimo giorno per disdire, non della scadenza: è la data che conta.

## 3. Caricare una fattura del fornitore

Apri il contratto → scheda **Fatture** → **Carica fattura** e scegli il file **XML** della fattura elettronica (FatturaPA).

BCM controlla che il file sia una fattura elettronica valida, legge fornitore, importi e modalità di pagamento, e la confronta con quanto previsto dal contratto (sull'imponibile, IVA esclusa):

- **Suggerito · 100%** — corrisponde a quanto previsto. *Amministratore:* conferma con **Conferma abbinamento** ✓.
- **Fornitore non corrisponde** — la fattura è di un'altra azienda: forse l'hai caricata sul contratto sbagliato.

La prima fattura di un fornitore compila anche il suo **indirizzo** nella scheda della controparte, se era vuoto.

## 4. IBAN cambiato: cosa fare

Se una fattura chiede il pagamento su un conto **diverso da quello verificato** del fornitore, BCM la segna in rosso (**IBAN cambiato: da verificare**) e **non la mette nel pagamento SEPA**. Un bonifico fatto a mano dall'home banking, fuori da BCM, resta sotto la tua responsabilità.

È la truffa più comune tra aziende: un'email falsa "abbiamo cambiato banca". Quindi:

1. **Non rispondere all'email e non usare i recapiti scritti nella fattura.** Chiama il fornitore al numero che conosci già.
2. Se il cambio è vero: *Amministratore*, apri la **controparte** → **IBAN verificato** → **Conferma IBAN verificato** con il nuovo IBAN. Da lì la fattura si può pagare.
3. Se non è vero: non pagare, ed elimina la fattura.

## 5. Pagare le fatture

*Amministratore, o il Responsabile del contratto.* Nella scheda **Fatture** spunta le fatture **Pronte per SEPA** → **Genera pagamento SEPA** → scegli la data di esecuzione. Scarichi un file da caricare nel tuo home banking: la banca esegue i bonifici. BCM segna le fatture come **Pagate** quando generi il file, quindi caricalo davvero in banca.

Non tutte le fatture si pagano così:

- **RiBa** o **addebito diretto**: *incassa il fornitore*, tramite la tua banca. Nessun bonifico da fare: BCM ti mostra solo la scadenza, e non te la fa pagare due volte.
- **Carta, contanti, assegno**: *si paga fuori da BCM*.

---

## Altre cose utili

- **Calendario**: in **Profilo → Calendario scadenze** c'è un link da aggiungere a Google Calendar, Outlook o Apple Calendar.
- **Accesso più sicuro**: in **Profilo** puoi attivare l'**autenticazione a due fattori**.
- **I tuoi dati**: *Amministratore*, in **Impostazioni → Organizzazione** puoi esportare tutti i dati dell'azienda, o chiedere la cancellazione dell'account (con 30 giorni per ripensarci).
- **Lo stesso su telefono**: BCM funziona anche da smartphone; l'elenco dei contratti diventa a schede.

Dubbi o segnalazioni: donatocorbacio92@gmail.com
