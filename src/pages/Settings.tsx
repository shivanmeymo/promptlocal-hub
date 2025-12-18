import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Mail, Shield, Unlink, Loader2, Check, AlertCircle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type AuthProvider = "email" | "google" | "unknown";

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [authProvider, setAuthProvider] = useState<AuthProvider>("unknown");
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [unlinkLoading, setUnlinkLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      // Determine auth provider from user metadata
      const provider = user.app_metadata?.provider;
      if (provider === "google") {
        setAuthProvider("google");
      } else if (provider === "email" || user.email) {
        setAuthProvider("email");
      }
    }
  }, [user]);

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim(),
      });

      if (error) throw error;

      toast.success("En bekräftelselänk har skickats till din nya e-postadress.");
      setNewEmail("");
    } catch (err: any) {
      toast.error(err?.message || "Kunde inte uppdatera e-post.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    setUnlinkLoading(true);
    try {
      // To unlink Google, user needs to have a password set first
      // We'll inform the user about this requirement
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser?.app_metadata?.provider === "google" && !currentUser?.email) {
        toast.error("Du måste först lägga till en e-postadress innan du kan koppla bort Google.");
        return;
      }

      // Supabase doesn't have a direct "unlink" API for OAuth providers
      // The user would need to use password reset to set a password, then they can log in with email
      toast.info(
        "För att koppla bort Google, begär en lösenordsåterställning till din e-post. " +
        "När du har satt ett lösenord kan du logga in med e-post istället.",
        { duration: 8000 }
      );
    } catch (err: any) {
      toast.error("Ett fel inträffade.");
    } finally {
      setUnlinkLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <main className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <Helmet>
        <title>Inställningar | NowInTown</title>
        <meta name="description" content="Hantera dina kontoinställningar på NowInTown." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <main className="container max-w-2xl py-8 px-4 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Inställningar</h1>
          <p className="text-muted-foreground mt-1">Hantera ditt konto och inloggningsmetoder.</p>
        </div>

        {/* Login Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Inloggningsmetod
            </CardTitle>
            <CardDescription>Se hur du loggar in på ditt konto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-muted-foreground">
                  {authProvider === "google" && "Inloggad via Google"}
                  {authProvider === "email" && "Inloggad via e-post och lösenord"}
                  {authProvider === "unknown" && "Okänd inloggningsmetod"}
                </p>
              </div>
              <Badge variant={authProvider === "google" ? "secondary" : "outline"}>
                {authProvider === "google" ? "Google" : "E-post"}
              </Badge>
            </div>

            {authProvider === "google" && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Vill du använda e-post och lösenord istället?
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleUnlinkGoogle}
                    disabled={unlinkLoading}
                    className="gap-2"
                  >
                    {unlinkLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Unlink className="h-4 w-4" />
                    )}
                    Koppla bort Google
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Change Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Byt e-postadress
            </CardTitle>
            <CardDescription>
              En bekräftelselänk skickas till din nya e-postadress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangeEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-email">Ny e-postadress</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="din.nya@epost.se"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={emailLoading || !newEmail.trim()}>
                {emailLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Skickar...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Uppdatera e-post
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Om du har problem med ditt konto eller vill ta bort det helt, 
            besök din <a href="/profile" className="underline hover:text-foreground">profilsida</a>.
          </p>
        </div>
      </main>
    </Layout>
  );
};

export default Settings;
