import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Cookie Policy | BCM - Business Contracts Manager",
  description: "Quali cookie e quali dati salvati nel browser usa BCM, e perché.",
};

const CONTACT_EMAIL = "donatocorbacio92@gmail.com";

export default function CookiePolicyPage() {
  return (
    <LegalPageShell title="Cookie Policy" lastUpdated="5 settembre 2026">
      <section>
        <h2>1. Perché questa pagina</h2>
        <p>
          Questa pagina elenca, in modo diretto, tutto ciò che BCM salva nel browser di chi lo
          usa — sia sotto forma di cookie, sia come dati nel <code>localStorage</code>. Per il
          trattamento dei dati personali in generale vedi l&apos;
          <Link href="/privacy" className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary dark:text-[var(--accent-foreground)] dark:decoration-[var(--accent-foreground)]/40 dark:hover:decoration-[var(--accent-foreground)]">
            informativa privacy
          </Link>.
        </p>
      </section>

      <section>
        <h2>2. Cookie tecnici essenziali</h2>
        <p>BCM usa un solo cookie, impostato dal backend al login:</p>
        <ul>
          <li>
            <strong>refresh_token</strong> — <code>HttpOnly</code>, <code>Secure</code>,{" "}
            <code>SameSite</code>. Serve esclusivamente a mantenere la sessione attiva e a
            rinnovare il token di accesso. Non è leggibile da JavaScript, non è usato per
            profilazione o tracciamento, e non viene condiviso con nessun servizio esterno.
          </li>
        </ul>
        <p className="mt-3">
          Essendo strettamente necessario al funzionamento del servizio che l&apos;utente ha
          esplicitamente richiesto (restare autenticato), questo cookie non richiede consenso
          preventivo (art. 122 Codice Privacy, art. 5.3 direttiva ePrivacy).
        </p>
      </section>

      <section>
        <h2>3. Dati salvati nel browser (localStorage)</h2>
        <p>
          Oltre al cookie, BCM salva alcune informazioni in <code>localStorage</code> — non sono
          cookie in senso tecnico (non vengono inviate al server ad ogni richiesta), ma li
          documentiamo con la stessa trasparenza:
        </p>
        <ul>
          <li><strong>Token di accesso</strong> — necessario per autenticare le richieste all&apos;API mentre la pagina è aperta.</li>
          <li><strong>Preferenza tema</strong> (chiaro/scuro) — solo per ricordare la scelta visiva.</li>
          <li><strong>Promemoria banner cookie</strong> — per non mostrare più questo avviso dopo la prima chiusura.</li>
        </ul>
        <p className="mt-3">
          Questi dati restano solo nel tuo browser: puoi cancellarli in qualsiasi momento dalle
          impostazioni del browser stesso, senza contattarci.
        </p>
      </section>

      <section>
        <h2>4. Cosa NON usiamo</h2>
        <p>
          Nessun cookie di profilazione, nessun cookie pubblicitario, nessun servizio di
          analytics o tracciamento di terze parti (Google Analytics, Meta Pixel, o simili).
          Nessun dato di navigazione viene ceduto o venduto a terzi.
        </p>
      </section>

      <section>
        <h2>5. Domande</h2>
        <p>
          Per qualsiasi domanda su questa pagina, scrivi a{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary dark:text-[var(--accent-foreground)] dark:decoration-[var(--accent-foreground)]/40 dark:hover:decoration-[var(--accent-foreground)]">
            {CONTACT_EMAIL}
          </a>.
        </p>
      </section>
    </LegalPageShell>
  );
}
