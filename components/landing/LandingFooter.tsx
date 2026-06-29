import Link from "next/link";
import Logo from "@/components/layout/Logo";

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30 py-12">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid sm:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <Logo iconClassName="h-8 w-8" />
            <p className="text-sm text-muted-foreground max-w-xs">
              Software SaaS per la gestione dei contratti aziendali con AI integrata.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Prodotto</h4>
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
            <h4 className="text-sm font-semibold text-foreground mb-3">Account</h4>
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
