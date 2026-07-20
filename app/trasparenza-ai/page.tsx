import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Trasparenza sull'uso dell'AI | BCM - Business Contracts Manager",
  description: "Quali funzioni di intelligenza artificiale usa BCM, come funzionano e quali sono i loro limiti.",
};

const CONTACT_EMAIL = "donato.corbacio.dev@gmail.com";

export default function TrasparenzaAiPage() {
  return (
    <LegalPageShell title="Trasparenza sull'uso dell'intelligenza artificiale" lastUpdated="20 luglio 2026">
      <section>
        <h2>1. Perché questa pagina</h2>
        <p>
          BCM utilizza alcune funzioni di intelligenza artificiale per aiutare chi gestisce i
          contratti a individuare più rapidamente scadenze critiche e clausole rischiose.
          Questa pagina spiega, in modo diretto, cosa fanno queste funzioni, dove girano i
          modelli e — soprattutto — cosa <strong>non</strong> fanno.
        </p>
      </section>

      <section>
        <h2>2. Punteggio di rischio contrattuale</h2>
        <p>
          Ogni contratto riceve un punteggio di rischio (Basso / Medio / Alto) calcolato da
          due componenti:
        </p>
        <ul>
          <li>
            <strong>Regole euristiche</strong>: scadenza imminente, contratto scaduto, valore
            economico anomalo rispetto allo storico, assenza di una data di fine.
          </li>
          <li>
            <strong>Modello statistico</strong> calibrato su dati pubblici reali (fonti come
            ANAC e Banca d&apos;Italia), non su un addestramento generico — e affinato nel
            tempo dal feedback che i responsabili danno direttamente su ogni punteggio
            (conferma o correzione).
          </li>
        </ul>
        <p className="mt-3">
          <strong>Limite dichiarato</strong>: questo punteggio non è ancora stato validato su
          esiti reali su larga scala. Va trattato come un segnale di attenzione, non come una
          valutazione definitiva.
        </p>
      </section>

      <section>
        <h2>3. Analisi delle clausole a rischio</h2>
        <p>
          Sui documenti contrattuali caricati, un modello linguistico può individuare ed
          evidenziare clausole potenzialmente rischiose (es. rinnovo automatico, penali, foro
          competente).
        </p>
        <p className="mt-3">
          <strong>Non è un parere legale.</strong> È un aiuto alla lettura, non una consulenza
          — le clausole segnalate vanno sempre verificate da un professionista prima di
          qualsiasi decisione.
        </p>
      </section>

      <section>
        <h2>4. Dove girano i modelli</h2>
        <p>
          Entrambe le funzioni usano modelli ospitati internamente (self-hosted), nella stessa
          infrastruttura del titolare/responsabile del trattamento. Non c&apos;è alcun invio
          di documenti a servizi cloud di intelligenza artificiale di terze parti: il testo
          del contratto non lascia mai il perimetro dell&apos;organizzazione. Dettagli sul
          trattamento dei dati sono nell&apos;
          <Link href="/privacy" className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary">
            informativa privacy
          </Link>.
        </p>
      </section>

      <section>
        <h2>5. Nessuna decisione automatizzata</h2>
        <p>
          Né il punteggio di rischio né l&apos;analisi delle clausole modificano, approvano o
          rifiutano un contratto in autonomia. Ogni azione sul contratto — approvazione,
          rifiuto, modifica — richiede sempre un intervento esplicito di una persona
          autorizzata. Il ruolo dell&apos;AI qui è segnalare, non decidere.
        </p>
      </section>

      <section>
        <h2>6. Stato rispetto all&apos;AI Act</h2>
        <p>
          Una classificazione formale ai sensi del Regolamento UE sull&apos;intelligenza
          artificiale (AI Act) non è ancora stata effettuata da un professionista legale.
          Gli elementi tecnici raccolti finora — nessuna decisione automatizzata con effetti
          giuridici, supervisione umana sempre richiesta, nessun trattamento di categorie
          particolari di dati come parte del modello previsto — sono un punto di partenza
          favorevole, ma non sostituiscono una valutazione formale, che verrà effettuata prima
          di un utilizzo su clienti reali con dati reali.
        </p>
      </section>

      <section>
        <h2>7. Domande</h2>
        <p>
          Per qualsiasi domanda su queste funzioni, scrivi a{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary">
            {CONTACT_EMAIL}
          </a>.
        </p>
      </section>
    </LegalPageShell>
  );
}
