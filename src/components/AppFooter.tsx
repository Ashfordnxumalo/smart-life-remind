import { Link } from "react-router-dom";

export const AppFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-xs text-muted-foreground">
            &copy; {year} SmartRemind. All rights reserved.
          </p>

          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link
              to="/privacy"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <span aria-hidden className="text-muted-foreground/40">
              &middot;
            </span>
            <Link
              to="/terms"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms of Service
            </Link>
            <span aria-hidden className="text-muted-foreground/40">
              &middot;
            </span>
            <span className="text-xs text-muted-foreground">v{__APP_VERSION__}</span>
          </nav>
        </div>
      </div>
    </footer>
  );
};
