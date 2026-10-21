/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { ONEROUS_CLAUSES, TERMS_LAST_UPDATED, TERMS_VERSION } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Termini di servizio | BCM - Business Contracts Manager",
  description:
    "Condizioni generali di utilizzo di BCM: piani, pagamenti, protezione dei dati, responsabilità, recesso e foro competente.",
};

const CONTACT_EMAIL = "donatocorbacio92@gmail.com";
const LINK =
  "text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary dark:text-[var(--accent-foreground)] dark:decoration-[var(--accent-foreground)]/40 dark:hover:decoration-[var(--accent-foreground)]";

export default function TerminiPage() {
  return (
    <LegalPageShell title="Termini di servizio" lastUpdated={`${TERMS_LAST_UPDATED} (versione ${TERMS_VERSION})`}>
      <section>
        <h2>1. Ambito e destinatari</h2>
        <p>
          I presenti Termini di servizio (&quot;Termini&quot;) regolano l&apos;utilizzo di BCM
          (Business Contracts Manager), software in cloud per la gestione del ciclo di vita dei
          contratti aziendali (&quot;Servizio&quot;).
        </p>
        <p>
          Il Servizio è riservato <strong>esclusivamente a imprese, professionisti ed enti</strong> che
          agiscono nell&apos;ambito della propria attività imprenditoriale o professionale. Chi si
          registra dichiara di agire per tali scopi e non in qualità di consumatore: non si
          applicano pertanto le disposizioni del Codice del Consumo (D.Lgs. 206/2005) riservate ai
          consumatori.
        </p>
      </section>

      <section>
        <h2>2. Fornitore del Servizio</h2>
        <p>
          Il Servizio è fornito da <strong>Donato Corbacio</strong> (&quot;Fornitore&quot;), contattabile
          all&apos;indirizzo <a href={`mailto:${CONTACT_EMAIL}`} className={LINK}>{CONTACT_EMAIL}</a>.
        </p>
        <p>
          I piani a pagamento non sono ancora attivi. Prima della loro attivazione, il Fornitore
          pubblicherà in questa sezione i dati fiscali completi (partita IVA e sede), che saranno
          riportati anche in ogni fattura.
        </p>
      </section>

      <section>
        <h2>3. Il Servizio</h2>
        <p>
          BCM consente di gestire contratti, scadenze, controparti, documenti, fatture elettroniche
          FatturaPA e pagamenti SEPA, e offre funzionalità di analisi basate su intelligenza
          artificiale. Le funzionalità e i limiti di ciascun piano (Free, Pro, Enterprise) sono
          quelli indicati nella <Link href="/#pricing" className={LINK}>pagina dei prezzi</Link> al
          momento della sottoscrizione.
        </p>
        <p>
          Il Fornitore può migliorare, modificare o sostituire singole funzionalità, purché il
          Servizio nel suo complesso non risulti sostanzialmente ridotto rispetto al piano
          sottoscritto.
        </p>
      </section>

      <section>
        <h2>4. Registrazione e account</h2>
        <ul>
          <li>Il Cliente fornisce dati veritieri e aggiornati e ne è responsabile.</li>
          <li>
            Il Cliente custodisce le credenziali di accesso e risponde delle attività svolte con il
            proprio account, comprese quelle degli utenti che invita nella propria organizzazione.
          </li>
          <li>
            Il Cliente comunica senza ritardo al Fornitore qualsiasi uso non autorizzato
            dell&apos;account di cui venga a conoscenza.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Piani, prezzi e pagamenti</h2>
        <ul>
          <li>Il piano Free è gratuito e senza scadenza, nei limiti indicati nella pagina dei prezzi.</li>
          <li>
            I piani a pagamento si pagano in anticipo, mensilmente, tramite il fornitore di
            pagamenti Stripe. Il Fornitore non riceve né conserva i dati della carta di pagamento.
          </li>
          <li>
            L&apos;abbonamento <strong>si rinnova automaticamente</strong> ogni mese fino alla
            disdetta. Il Cliente può disdire in qualsiasi momento dalla sezione
            &quot;Gestisci abbonamento&quot;: la disdetta ha effetto alla fine del periodo già pagato,
            fino al quale il Servizio resta disponibile.
          </li>
          <li>
            <strong>Non sono previsti rimborsi</strong> per periodi parziali, salvo quanto
            inderogabilmente previsto dalla legge o in caso di inadempimento del Fornitore.
          </li>
          <li>
            Il Fornitore può modificare i prezzi con un <strong>preavviso di almeno 30 giorni</strong>{" "}
            via email. La modifica si applica dal rinnovo successivo; il Cliente che non la accetta
            può disdire prima di tale data.
          </li>
          <li>
            In caso di passaggio a un piano inferiore, i dati esistenti restano accessibili; non è
            però possibile superare i limiti del nuovo piano (ad esempio creare nuovi contratti oltre
            il numero consentito).
          </li>
          <li>Il trattamento fiscale (IVA) è quello indicato in fattura secondo il regime del Fornitore.</li>
        </ul>
      </section>

      <section>
        <h2>6. Uso consentito</h2>
        <p>Il Cliente si impegna a non:</p>
        <ul>
          <li>utilizzare il Servizio per attività illecite o per trattare dati senza una valida base giuridica;</li>
          <li>caricare malware o contenuti che violino diritti di terzi;</li>
          <li>tentare di accedere ai dati di altre organizzazioni, aggirare le misure di sicurezza o sovraccaricare il Servizio;</li>
          <li>decompilare il software, salvo i casi consentiti dalla legge, o rivendere il Servizio senza accordo scritto.</li>
        </ul>
      </section>

      <section>
        <h2>7. Dati del Cliente e protezione dei dati personali</h2>
        <p>
          I dati inseriti nel Servizio restano di proprietà del Cliente. Per i dati personali in
          essi contenuti, il Cliente è <strong>titolare del trattamento</strong> e il Fornitore è{" "}
          <strong>responsabile del trattamento</strong> ai sensi dell&apos;art. 28 del Regolamento
          (UE) 2016/679 (&quot;GDPR&quot;). Con l&apos;accettazione dei presenti Termini il Cliente
          nomina il Fornitore responsabile del trattamento, alle condizioni seguenti:
        </p>
        <ul>
          <li>il Fornitore tratta i dati solo per erogare il Servizio e secondo le istruzioni del Cliente, che consistono nell&apos;uso delle funzionalità del Servizio;</li>
          <li>le persone autorizzate al trattamento sono vincolate alla riservatezza;</li>
          <li>il Fornitore adotta misure tecniche e organizzative adeguate ai sensi dell&apos;art. 32 GDPR, tra cui cifratura delle comunicazioni, isolamento dei dati tra organizzazioni, backup giornalieri e controllo degli accessi;</li>
          <li>
            i dati sono conservati su server situati <strong>in Italia</strong> (Oracle Cloud,
            regione di Milano). Il Cliente autorizza i sotto-responsabili elencati
            nell&apos;<Link href="/privacy" className={LINK}>Informativa privacy</Link>; il Fornitore
            comunica in anticipo l&apos;aggiunta o la sostituzione di sotto-responsabili, e il Cliente
            può opporsi recedendo;
          </li>
          <li>le funzionalità di intelligenza artificiale sono eseguite su infrastruttura del Fornitore: i contenuti del Cliente non vengono inviati a fornitori di AI terzi;</li>
          <li>il Fornitore assiste il Cliente nel rispondere alle richieste degli interessati e negli adempimenti previsti dagli artt. 32-36 GDPR;</li>
          <li>il Fornitore notifica al Cliente, senza ingiustificato ritardo, le violazioni dei dati personali di cui venga a conoscenza;</li>
          <li>alla cessazione del rapporto il Fornitore cancella i dati secondo quanto previsto alla sezione 12;</li>
          <li>il Fornitore mette a disposizione le informazioni necessarie a dimostrare il rispetto di questi obblighi.</li>
        </ul>
        <p>
          Per il trattamento dei dati degli utenti del Servizio da parte del Fornitore si rinvia
          all&apos;<Link href="/privacy" className={LINK}>Informativa privacy</Link>.
        </p>
      </section>

      <section>
        <h2>8. Funzionalità di intelligenza artificiale</h2>
        <p>
          Previsioni finanziarie, punteggi di rischio, segnalazioni di anomalie e risposte
          dell&apos;assistente sono <strong>elaborazioni automatiche a supporto delle decisioni</strong>:
          possono contenere errori e non costituiscono consulenza legale, fiscale o finanziaria. Il
          Cliente resta responsabile delle decisioni prese sulla base di tali elaborazioni.
          Funzionamento e limiti sono descritti nella pagina{" "}
          <Link href="/trasparenza-ai" className={LINK}>Trasparenza AI</Link>.
        </p>
      </section>

      <section>
        <h2>9. Disponibilità del Servizio</h2>
        <p>
          Il Fornitore si impegna a mantenere il Servizio disponibile con la diligenza professionale
          richiesta, ma non garantisce un funzionamento ininterrotto o privo di errori. Possono
          verificarsi interruzioni per manutenzione, preferibilmente comunicate in anticipo, o per
          cause non imputabili al Fornitore. Livelli di servizio garantiti (SLA) sono disponibili
          solo se concordati per iscritto nel piano Enterprise.
        </p>
        <p>
          Gli avvisi di scadenza e le notifiche sono uno strumento di supporto: il Cliente resta
          responsabile del rispetto dei propri termini contrattuali e legali, anche nel caso in cui
          un avviso non venga recapitato. Il Cliente conserva copia dei documenti originali caricati
          nel Servizio.
        </p>
      </section>

      <section>
        <h2>10. Proprietà intellettuale</h2>
        <p>
          Il software, il marchio e i contenuti del Servizio appartengono al Fornitore. Al Cliente è
          concessa una licenza d&apos;uso non esclusiva e non trasferibile, limitata alla durata del
          rapporto. Nessun diritto sui dati del Cliente è trasferito al Fornitore, salvo quanto
          necessario all&apos;erogazione del Servizio.
        </p>
      </section>

      <section>
        <h2>11. Limitazione di responsabilità</h2>
        <p>Nei limiti consentiti dalla legge, e in ogni caso esclusi dolo e colpa grave (art. 1229 c.c.):</p>
        <ul>
          <li>il Fornitore non risponde di danni indiretti o consequenziali, quali mancato guadagno, perdita di opportunità commerciali o danni d&apos;immagine;</li>
          <li>il Fornitore non risponde della perdita di dati successivi all&apos;ultimo backup disponibile;</li>
          <li>la responsabilità complessiva del Fornitore è limitata all&apos;importo dei corrispettivi pagati dal Cliente nei 12 mesi precedenti l&apos;evento dannoso.</li>
        </ul>
      </section>

      <section>
        <h2>12. Durata, recesso, sospensione e cancellazione dei dati</h2>
        <ul>
          <li>Il rapporto è a tempo indeterminato per il piano Free e mensile, con rinnovo automatico, per i piani a pagamento.</li>
          <li>Il Cliente può recedere in qualsiasi momento, disdicendo l&apos;abbonamento o chiedendo la chiusura dell&apos;account.</li>
          <li>Il Fornitore può recedere con un preavviso di 30 giorni via email, rimborsando la parte di corrispettivo già pagata e non goduta.</li>
          <li>
            Il Fornitore può sospendere l&apos;account, informandone il Cliente, in caso di mancato
            pagamento, di violazione della sezione 6 o per proteggere la sicurezza del Servizio e
            degli altri clienti. In caso di violazione grave può risolvere il rapporto.
          </li>
          <li>
            Alla cessazione del rapporto il Cliente ha <strong>30 giorni</strong> per esportare i
            propri dati. Trascorso tale termine i dati vengono cancellati definitivamente; le copie
            di backup sono eliminate al termine del loro ciclo di conservazione. Restano esclusi i
            dati che il Fornitore è tenuto a conservare per obbligo di legge.
          </li>
        </ul>
      </section>

      <section>
        <h2>13. Modifiche ai Termini</h2>
        <p>
          Il Fornitore può modificare i presenti Termini comunicandolo via email con almeno 30 giorni
          di preavviso. Le modifiche sostanziali richiedono una nuova accettazione nel Servizio. Il
          Cliente che non accetta le modifiche può recedere senza penali prima della loro entrata in
          vigore. Ogni versione dei Termini è identificata dalla data indicata in cima a questa pagina.
        </p>
      </section>

      <section>
        <h2>14. Comunicazioni</h2>
        <p>
          Le comunicazioni tra le parti avvengono via email: per il Fornitore all&apos;indirizzo
          indicato alla sezione 2, per il Cliente all&apos;indirizzo dell&apos;amministratore
          dell&apos;organizzazione registrato nel Servizio.
        </p>
      </section>

      <section>
        <h2>15. Legge applicabile e foro competente</h2>
        <p>
          I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia relativa
          alla loro interpretazione, esecuzione o cessazione è competente in via esclusiva il{" "}
          <strong>Foro di Bari</strong>.
        </p>
      </section>

      <section>
        <h2>16. Disposizioni finali</h2>
        <ul>
          <li>I presenti Termini, l&apos;Informativa privacy e la pagina dei prezzi costituiscono l&apos;intero accordo tra le parti relativo al Servizio.</li>
          <li>L&apos;eventuale nullità di una clausola non comporta la nullità delle altre.</li>
          <li>Il Cliente non può cedere il contratto senza il consenso scritto del Fornitore.</li>
        </ul>
      </section>

      <section>
        <h2>17. Approvazione specifica</h2>
        <p>
          Ai sensi degli artt. 1341 e 1342 c.c., al momento della registrazione il Cliente approva
          specificamente, con un&apos;apposita dichiarazione separata, le seguenti clausole:{" "}
          {ONEROUS_CLAUSES}.
        </p>
      </section>
    </LegalPageShell>
  );
}
