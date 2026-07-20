import Link from "next/link";
import Logo from "@/components/layout/Logo";

interface LandingFooterProps {
  /** The homepage's last heading before the footer is h3 (Pricing plan
   * cards), so h4 is correct there (default). Standalone pages like the
   * legal pages top out at h2, so they pass "h3" to keep heading levels
   * sequential instead of skipping one. */
  readonly headingLevel?: "h3" | "h4";
}

export function LandingFooter({ headingLevel = "h4" }: LandingFooterProps) {
  const year = new Date().getFullYear();
  const HeadingTag = headingLevel;

  return (
    <footer className="border-t border-border bg-muted/30 py-12">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid sm:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <Logo />
            <p className="text-sm text-muted-foreground max-w-xs">
              Software SaaS per la gestione dei contratti aziendali con AI integrata.
            </p>
          </div>

          {/* Product links */}
          <div>
            <HeadingTag className="text-sm font-semibold text-foreground mb-3">Prodotto</HeadingTag>
            <ul className="space-y-2">
              {[
                { href: "#features", label: "Funzionalità" },
                { href: "#how-it-works", label: "Come funziona" },
                { href: "#pricing", label: "Prezzi" },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Account links */}
          <div>
            <HeadingTag className="text-sm font-semibold text-foreground mb-3">Account</HeadingTag>
            <ul className="space-y-2">
              {[
                { href: "/register-org", label: "Registrati" },
                { href: "/login", label: "Accedi" },
                { href: "/dashboard", label: "Dashboard" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <HeadingTag className="text-sm font-semibold text-foreground mb-3">Legale</HeadingTag>
            <ul className="space-y-2">
              {[
                { href: "/privacy", label: "Informativa Privacy" },
                { href: "/trasparenza-ai", label: "Trasparenza sull'AI" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {year} BCM — Business Contracts Manager. Tutti i diritti riservati.
          </p>
          <p className="text-xs text-muted-foreground">
            Sviluppato da{" "}
            <a
              href="mailto:donato.corbacio.dev@gmail.com"
              className="hover:text-foreground transition-colors"
            >
              Donato Corbacio
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
