import { useEffect, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { MailCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Prefilled from whatever was typed on the sign-in form. */
  defaultEmail?: string;
}

export const ForgotPasswordDialog = ({
  open,
  onOpenChange,
  defaultEmail = "",
}: ForgotPasswordDialogProps) => {
  const [email, setEmail] = useState(defaultEmail);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setEmail(defaultEmail);
    setSent(false);
    setError(null);
  }, [open, defaultEmail]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    setError(null);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err) {
      // auth/user-not-found is deliberately not surfaced — saying which
      // addresses have accounts turns this form into an account checker.
      if (err instanceof FirebaseError && err.code === "auth/user-not-found") {
        setSent(true);
      } else if (err instanceof FirebaseError && err.code === "auth/invalid-email") {
        setError("That doesn't look like a valid email address.");
      } else if (err instanceof FirebaseError && err.code === "auth/too-many-requests") {
        setError("Too many attempts. Wait a few minutes and try again.");
      } else {
        setError("Couldn't send the reset email. Please try again.");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset your password</DialogTitle>
          <DialogDescription>
            {sent
              ? "Check your inbox for a link to set a new password."
              : "We'll email you a link to set a new password."}
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="space-y-4 py-2 text-center">
            <MailCheck className="mx-auto h-10 w-10 text-primary" />
            <p className="text-sm text-muted-foreground">
              If an account exists for <span className="font-medium">{email}</span>,
              a reset link is on its way. It can take a minute to arrive — check
              your spam folder too.
            </p>
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Back to sign in
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={sending}>
                {sending ? "Sending…" : "Send reset link"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
