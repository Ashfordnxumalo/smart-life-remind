import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, Users, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppFooter } from "@/components/AppFooter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  acceptFamilyInvite,
  getInvitePreview,
  rememberPendingInvite,
  type InvitePreview,
} from "@/lib/firestore/invitations";

type Phase = "loading" | "ready" | "accepting" | "accepted" | "error";

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col bg-gradient-subtle">
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md shadow-medium">
        <CardContent className="p-6 text-center">{children}</CardContent>
      </Card>
    </main>
    <AppFooter />
  </div>
);

export const InvitePage = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("loading");
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setPhase("error");
      setMessage("This link is missing its invitation code.");
      return;
    }

    let cancelled = false;
    getInvitePreview(token)
      .then((data) => {
        if (cancelled) return;
        setPreview(data);
        if (data.status === "pending") {
          setPhase("ready");
        } else {
          setPhase("error");
          setMessage(
            data.status === "accepted"
              ? "This invitation has already been accepted."
              : data.status === "expired"
                ? "This invitation has expired. Ask for a new one."
                : "This invitation is no longer valid."
          );
        }
      })
      .catch(() => {
        if (cancelled) return;
        setPhase("error");
        setMessage("We couldn't find this invitation. The link may be incorrect.");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleAccept = async () => {
    setPhase("accepting");
    try {
      const { linkedWith } = await acceptFamilyInvite(token);
      setMessage(linkedWith);
      setPhase("accepted");
    } catch (error) {
      const description =
        error instanceof Error ? error.message : "Please try again.";
      toast({ title: "Couldn't accept invitation", description, variant: "destructive" });
      setPhase("ready");
    }
  };

  // Park the token so signing in or registering comes straight back here.
  const handleSignIn = () => {
    rememberPendingInvite(token);
    navigate("/auth");
  };

  if (phase === "loading" || authLoading) {
    return (
      <Shell>
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Checking your invitation…</p>
      </Shell>
    );
  }

  if (phase === "error") {
    return (
      <Shell>
        <XCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
        <h1 className="mb-2 text-xl font-bold">Invitation unavailable</h1>
        <p className="mb-6 text-sm text-muted-foreground">{message}</p>
        <Link to="/">
          <Button variant="outline">Go to Smart R</Button>
        </Link>
      </Shell>
    );
  }

  if (phase === "accepted") {
    return (
      <Shell>
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-category-personal" />
        <h1 className="mb-2 text-xl font-bold">You're linked</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          You and {message} can now share reminders and loyalty cards.
        </p>
        <Link to="/">
          <Button className="bg-gradient-primary">Open Smart R</Button>
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary">
        <Users className="h-6 w-6 text-white" />
      </div>
      <h1 className="mb-2 text-xl font-bold">
        {preview?.inviterName} invited you
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Accepting links your account with {preview?.inviterName}'s on Smart R.
        You'll be able to share reminders and loyalty cards with each other.
      </p>

      {user ? (
        <Button
          className="w-full bg-gradient-primary"
          onClick={handleAccept}
          disabled={phase === "accepting"}
        >
          {phase === "accepting" ? "Linking…" : "Accept invitation"}
        </Button>
      ) : (
        <>
          <Button className="w-full bg-gradient-primary" onClick={handleSignIn}>
            Sign in or create an account
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            The invitation was sent to {preview?.inviteeEmail}. Registering with
            that address keeps things tidy, but any account can accept.
          </p>
        </>
      )}
    </Shell>
  );
};

export default InvitePage;
