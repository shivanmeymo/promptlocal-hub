import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const hasCode = useMemo(() => searchParams.has("code"), [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // OAuth (PKCE): /auth/callback?code=...
        if (hasCode) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.search);
          if (error) throw error;

          // Remove sensitive params from URL.
          window.history.replaceState({}, document.title, window.location.pathname);

          if (!cancelled) {
            if (data.session) navigate("/", { replace: true });
            else setError("Inloggningen kunde inte slutföras. Försök igen.");
          }
          return;
        }

        // Fallback: already has a session
        const { data: { session } } = await supabase.auth.getSession();
        if (!cancelled) {
          if (session) navigate("/", { replace: true });
          else setError("Inloggningen kunde inte slutföras. Försök igen.");
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Ett oväntat fel inträffade.");
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [hasCode, navigate]);

  return (
    <Layout>
      <Helmet>
        <title>Auth callback | NowInTown</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={`${window.location.origin}/auth/callback`} />
      </Helmet>

      <main className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">Loggar in…</CardTitle>
            <CardDescription>
              Du skickas tillbaka automatiskt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!error ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Vänta ett ögonblick</span>
              </div>
            ) : (
              <section className="space-y-4" aria-label="Inloggningsfel">
                <div className="flex items-start gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button asChild>
                    <Link to="/auth">Till inloggning</Link>
                  </Button>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Försök igen
                  </Button>
                </div>
              </section>
            )}
          </CardContent>
        </Card>
      </main>
    </Layout>
  );
};

export default AuthCallback;
