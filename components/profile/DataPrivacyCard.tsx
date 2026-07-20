import Link from "next/link";
import { ShieldCheck, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PRIVACY_CONTACT_EMAIL = "donato.corbacio.dev@gmail.com";

/** GDPR data-subject rights: what exists today is a request channel to the
 * data controller (see docs/GDPR.md §6/§9), not self-service automation —
 * this card reflects that honestly rather than promising an export button
 * that doesn't exist yet. */
export default function DataPrivacyCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Dati personali e privacy
        </CardTitle>
        <CardDescription>
          Come trattiamo i tuoi dati e come esercitare i tuoi diritti — vedi l&apos;
          <Link
            href="/privacy"
            className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary"
          >
            informativa privacy completa
          </Link>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" asChild>
            <a
              href={`mailto:${PRIVACY_CONTACT_EMAIL}?subject=${encodeURIComponent(
                "Richiesta esportazione dati - BCM"
              )}`}
            >
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              Richiedi esportazione dati
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href={`mailto:${PRIVACY_CONTACT_EMAIL}?subject=${encodeURIComponent(
                "Richiesta cancellazione account - BCM"
              )}`}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
              Richiedi cancellazione account
            </a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Le richieste vengono gestite manualmente dal titolare del trattamento della tua
          organizzazione, come previsto dall&apos;informativa privacy.
        </p>
      </CardContent>
    </Card>
  );
}
