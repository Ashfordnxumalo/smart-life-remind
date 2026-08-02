import { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile as updateAuthProfile,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase";
import { createProfile } from "@/lib/firestore/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { takePendingInvite } from "@/lib/firestore/invitations";

const authErrorMessage = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Invalid email or password.";
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      default:
        return error.message;
    }
  }
  return "Something went wrong. Please try again.";
};

const AuthPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [planType, setPlanType] = useState<'family' | 'business'>('family');
  const navigate = useNavigate();
  const loading = authLoading || submitting;

  useEffect(() => {
    if (!user) return;
    // Someone who arrived from an invitation link came here only to
    // authenticate — send them back to finish accepting rather than dropping
    // them on the dashboard with the invitation silently abandoned.
    const pendingInvite = takePendingInvite();
    navigate(pendingInvite ? `/invite?token=${encodeURIComponent(pendingInvite)}` : "/");
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateAuthProfile(credential.user, { displayName: fullName });
      await createProfile(credential.user.uid, { fullName, email, planType });

      toast({
        title: "Account created! 🎉",
        description: "Welcome to SmartRemind.",
      });
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: authErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: authErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">SmartRemind</CardTitle>
          <CardDescription>
            Your intelligent reminder management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-3">
                  <Label>Choose Your Plan</Label>
                  <RadioGroup
                    value={planType}
                    onValueChange={(value) => setPlanType(value as 'family' | 'business')}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="family" id="family" />
                      <div className="flex-1">
                        <Label htmlFor="family" className="font-medium">Family Plan</Label>
                        <p className="text-sm text-muted-foreground">Up to 5 family members</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="business" id="business" />
                      <div className="flex-1">
                        <Label htmlFor="business" className="font-medium">Business Plan</Label>
                        <p className="text-sm text-muted-foreground">Up to 15 team members</p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Choose a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;