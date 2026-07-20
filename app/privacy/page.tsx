import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Informativa Privacy | BCM - Business Contracts Manager",
  description: "Come BCM tratta i dati personali: titolare, finalità, conservazione e diritti dell'interessato.",
};

const CONTACT_EMAIL = "donato.corbacio.dev@gmail.com";

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Informativa sulla privacy" lastUpdated="20 luglio 2026">
      <section>
        <h2>1. Titolare e responsabile del trattamento</h2>
        <p>
          BCM (Business Contracts Manager) è un software multi-tenant per la gestione del
          ciclo di vita dei contratti aziendali: scadenze, valori finanziari, documenti,
          fatture, pagamenti e analisi del rischio contrattuale.
        </p>
        <p>
          Ogni organizzazione che utilizza BCM è <strong>titolare autonoma</strong> dei
          propri dati (contratti, controparti, dipendenti). Chi opera o distribuisce BCM
          come software agisce come <strong>responsabile del trattamento</strong> per conto
          delle organizzazioni clienti, ai sensi dell&apos;art. 28 GDPR.
        </p>
      </section>

      <section>
        <h2>2. Quali dati trattiamo</h2>
        <ul>
          <li>Dati identificativi di dipendenti e responsabili (nome, cognome, email, telefono, reparto)</li>
          <li>Credenziali utente (nome utente, password protetta con hash, secret per l&apos;autenticazione a due fattori cifrato)</li>
          <li>Dati delle controparti contrattuali (in genere ragione sociale, raramente persona fisica)</li>
          <li>Coordinate bancarie dell&apos;organizzazione (IBAN/BIC), non di singole persone fisiche</li>
          <li>Contenuto dei documenti contrattuali caricati — può includere qualunque dato personale presente nel contratto stesso</li>
          <li>Log applicativi di sicurezza (azione, tipo di operazione, utente, organizzazione — mai il contenuto dei documenti)</li>
        </ul>
        <p className="mt-3">
          Non trattiamo categorie particolari di dati (art. 9 GDPR — salute, origine etnica,
          orientamento, ecc.) come parte del modello previsto dal software. Resta possibile
          che compaiano incidentalmente nel testo libero di un contratto caricato da un
          utente, sulla stessa base giuridica del contratto stesso.
        </p>
      </section>

      <section>
        <h2>3. Finalità e base giuridica</h2>
        <ul>
          <li>Dati di dipendenti/responsabili e credenziali: esecuzione del rapporto con l&apos;organizzazione cliente (art. 6.1.b GDPR)</li>
          <li>Documenti contrattuali: esecuzione del contratto tra l&apos;organizzazione cliente e la propria controparte — BCM è lo strumento di gestione, non parte del contratto (art. 6.1.b GDPR)</li>
          <li>Log di sicurezza: legittimo interesse alla sicurezza e alla tracciabilità (art. 6.1.f GDPR)</li>
        </ul>
      </section>

      <section>
        <h2>4. Sub-responsabili e trasferimenti extra-UE</h2>
        <p>
          BCM non si appoggia a servizi SaaS di terze parti per l&apos;elaborazione dei
          documenti: nessun servizio cloud esterno di intelligenza artificiale, nessun
          trasferimento di dati fuori dall&apos;Unione Europea.
        </p>
        <ul>
          <li>
            <strong>Estrazione clausole a rischio e analisi assistita</strong>: eseguita da
            un modello linguistico ospitato internamente (self-hosted), nella stessa
            infrastruttura del titolare/responsabile. Il testo del documento non lascia mai
            questo perimetro.
          </li>
          <li>
            <strong>Riconoscimento testo su documenti scansionati (OCR)</strong>: eseguito
            localmente, nessuna chiamata a servizi esterni.
          </li>
          <li>
            <strong>Invio email</strong> (inviti, notifiche, riepiloghi periodici): tramite il
            provider SMTP configurato per l&apos;installazione — indirizzo e contenuto della
            notifica sono gli unici dati coinvolti.
          </li>
        </ul>
        <p className="mt-3">Per approfondire l&apos;uso dell&apos;intelligenza artificiale, vedi la pagina{" "}
          <Link href="/trasparenza-ai" className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary">
            Trasparenza sull&apos;uso dell&apos;AI
          </Link>.
        </p>
      </section>

      <section>
        <h2>5. Conservazione e cancellazione</h2>
        <ul>
          <li>I documenti restano archiviati finché non vengono eliminati esplicitamente dall&apos;organizzazione titolare.</li>
          <li>Utenti e responsabili possono essere rimossi su richiesta dell&apos;organizzazione titolare, salvo obblighi di conservazione fiscale o contrattuale su dati storici collegati.</li>
          <li>I refresh token di accesso hanno una durata limitata e vengono ruotati automaticamente per motivi di sicurezza.</li>
        </ul>
      </section>

      <section>
        <h2>6. I tuoi diritti</h2>
        <p>
          In quanto interessato puoi esercitare, nei confronti dell&apos;organizzazione
          titolare del trattamento, i diritti previsti dagli articoli 15-22 GDPR: accesso,
          rettifica, cancellazione, portabilità, opposizione e limitazione del trattamento.
        </p>
        <p className="mt-3">
          La rettifica dei tuoi dati principali è disponibile direttamente dal tuo profilo
          utente. Per richiedere l&apos;esportazione dei tuoi dati, la cancellazione
          dell&apos;account o qualsiasi altro diritto, scrivi a{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary">
            {CONTACT_EMAIL}
          </a>{" "}
          indicando l&apos;organizzazione di appartenenza: oggi la richiesta viene gestita
          manualmente dal titolare, non esiste ancora un self-service automatico.
        </p>
      </section>

      <section>
        <h2>7. Decisioni automatizzate</h2>
        <p>
          Il punteggio di rischio contrattuale e l&apos;analisi delle clausole a rischio{" "}
          <strong>non sono decisioni automatizzate con effetti giuridici</strong>: sono
          segnalazioni sottoposte a un revisore umano. Nessun contratto viene approvato,
          rifiutato o modificato senza un&apos;azione esplicita di una persona autorizzata.
        </p>
      </section>

      <section>
        <h2>8. Misure di sicurezza</h2>
        <p>
          Password protette con hashing, secret per l&apos;autenticazione a due fattori
          cifrati, separazione rigorosa dei dati tra organizzazioni diverse, refresh token
          rotanti con rilevamento del riutilizzo, upload di documenti limitati e validati.
        </p>
      </section>

      <section>
        <h2>9. Contatti</h2>
        <p>
          Per qualsiasi domanda su questa informativa o sul trattamento dei tuoi dati,
          scrivi a{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary">
            {CONTACT_EMAIL}
          </a>.
        </p>
      </section>
    </LegalPageShell>
  );
}
