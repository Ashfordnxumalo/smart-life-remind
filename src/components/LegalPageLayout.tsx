import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppFooter } from "@/components/AppFooter";

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export const LegalPageLayout = ({ title, lastUpdated, children }: LegalPageLayoutProps) => (
  <div className="flex min-h-screen flex-col bg-gradient-subtle">
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex items-center gap-3 px-4 py-4">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-lg font-bold sm:text-2xl">{title}</h1>
      </div>
    </header>

    <main className="container mx-auto flex-1 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 rounded-lg border border-warning/40 bg-warning/10 p-4">
          <p className="text-sm font-medium">Template — not yet legally reviewed</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This document describes how the app currently behaves, but it has not been
            checked by a legal professional. Have it reviewed for POPIA (and GDPR, if you
            have users in the EU) before relying on it with real users.
          </p>
        </div>

        <p className="mb-8 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

        <div className="space-y-8">{children}</div>
      </div>
    </main>

    <AppFooter />
  </div>
);

export const LegalSection = ({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-3">
    <h2 className="text-lg font-semibold">{heading}</h2>
    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
  </section>
);
