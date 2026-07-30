import { Link } from "@tanstack/react-router";
import { Wordmark } from "./Wordmark";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-sidebar text-sidebar-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Wordmark tone="light" />
          <p className="mt-4 max-w-sm text-sm text-sidebar-foreground/70">
            The Authorised Business Broker (ABB) certification programme — structured training,
            assessed assignments and a verifiable credential for business broking professionals in
            India.
          </p>
        </div>

        <div>
          <h2 className="font-display text-sm font-semibold text-sidebar-foreground">Programme</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-sidebar-foreground/70">
            <li>
              <Link to="/" className="hover:text-sidebar-primary">
                Overview
              </Link>
            </li>
            <li>
              <Link to="/curriculum" className="hover:text-sidebar-primary">
                Curriculum
              </Link>
            </li>
            <li>
              <Link to="/enrol" className="hover:text-sidebar-primary">
                Enrol
              </Link>
            </li>
            <li>
              <Link to="/verify" className="hover:text-sidebar-primary">
                Verify a certificate
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-sm font-semibold text-sidebar-foreground">Legal</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-sidebar-foreground/70">
            <li>
              <Link
                to="/legal/$slug"
                params={{ slug: "terms" }}
                className="hover:text-sidebar-primary"
              >
                Terms of use
              </Link>
            </li>
            <li>
              <Link
                to="/legal/$slug"
                params={{ slug: "privacy" }}
                className="hover:text-sidebar-primary"
              >
                Privacy policy
              </Link>
            </li>
            <li>
              <Link
                to="/legal/$slug"
                params={{ slug: "refund" }}
                className="hover:text-sidebar-primary"
              >
                Refund policy
              </Link>
            </li>
            <li>
              <Link to="/support" className="hover:text-sidebar-primary">
                Support
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-sidebar-border">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-sidebar-foreground/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Yoova Business Broking. All rights reserved.</p>
          <p>Certification issued by Yoova Business Broking.</p>
        </div>
      </div>
    </footer>
  );
}
